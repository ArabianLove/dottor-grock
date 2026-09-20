import type { Attachment, MediaKind } from "./types";

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.74;
const FRAME_EDGE = 960;
const FRAME_QUALITY = 0.7;

function uid(): string {
  return crypto.randomUUID();
}

function drawToJpeg(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxEdge: number,
  quality: number,
): string {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponibile");
  ctx.drawImage(source, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

async function loadImage(file: File): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through — HEIC/odd types */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImageFile(file: File): Promise<Attachment> {
  const source = await loadImage(file);
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!width || !height) throw new Error("Immagine non leggibile");
  const dataUrl = drawToJpeg(source, width, height, MAX_EDGE, JPEG_QUALITY);
  if ("close" in source && typeof source.close === "function") source.close();
  return {
    id: uid(),
    kind: "photo",
    mime: "image/jpeg",
    dataUrl,
    name: file.name || "foto-clinica.jpg",
  };
}

function waitSeeked(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Video non leggibile"));
    };
    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 900);
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
  });
}

export async function extractVideoFrames(
  file: File,
  count = 4,
): Promise<Attachment[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Video non leggibile"));
    });
    try {
      await video.play();
      video.pause();
    } catch {
      /* iOS sometimes needs play to decode; ignore autoplay block */
    }

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const frames: Attachment[] = [];
    const n = Math.max(1, Math.min(count, 4));

    for (let i = 0; i < n; i++) {
      const t = duration * ((i + 0.5) / n);
      video.currentTime = Math.min(Math.max(0.05, t), Math.max(0.05, duration - 0.08));
      await waitSeeked(video);
      const dataUrl = drawToJpeg(video, video.videoWidth || 640, video.videoHeight || 360, FRAME_EDGE, FRAME_QUALITY);
      frames.push({
        id: uid(),
        kind: "video-frame" as MediaKind,
        mime: "image/jpeg",
        dataUrl,
        name: `fotogramma-${i + 1}.jpg`,
      });
    }
    return frames;
  } finally {
    video.src = "";
    URL.revokeObjectURL(url);
  }
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|qt)$/i.test(file.name);
}
