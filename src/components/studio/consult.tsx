import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Camera,
  ImageOff,
  PhoneCall,
  Plus,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { ClinicalCard } from "./clinical-card";
import { GrockMark } from "./mark";
import { runConsult } from "@/lib/grock/api";
import {
  compressImageFile,
  extractVideoFrames,
  isImageFile,
  isVideoFile,
} from "@/lib/grock/media";
import { specialtyById } from "@/lib/grock/specialties";
import { useStudio } from "@/lib/grock/store";
import type { Attachment, ChatMessage, Consult } from "@/lib/grock/types";
import { cn } from "@/lib/utils";

export function ConsultRoom({ consult }: { consult: Consult }) {
  const startConsult = useStudio((s) => s.startConsult);
  const setActive = useStudio((s) => s.setActive);
  const consults = useStudio((s) => s.consults);
  const removeConsult = useStudio((s) => s.removeConsult);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busyMedia, setBusyMedia] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const spec = specialtyById(consult.specialtyId);
  const lastAssistant = [...consult.messages].reverse().find((m) => m.role === "assistant");
  const wantsMedia = lastAssistant?.clinical?.asksForMedia;

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [consult.messages, pending, files.length]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = `${Math.min(160, ta.scrollHeight)}px`;
  }, [draft]);

  async function onPick(list: FileList | null, kind: "photo" | "video") {
    if (!list?.length) return;
    setLocalError(null);
    setBusyMedia(true);
    try {
      const next: Attachment[] = [];
      for (const file of Array.from(list)) {
        if (kind === "photo" && isImageFile(file)) {
          next.push(await compressImageFile(file));
        } else if (kind === "video" && isVideoFile(file)) {
          next.push(...(await extractVideoFrames(file, 4)));
        } else {
          setLocalError("Usa una foto (jpg, png) o un video breve.");
        }
      }
      setFiles((prev) => [...prev, ...next].slice(0, 4));
    } catch {
      setLocalError("Non riesco a leggere quel file. Prova jpg, png o mp4.");
    } finally {
      setBusyMedia(false);
      if (photoRef.current) photoRef.current.value = "";
      if (videoRef.current) videoRef.current.value = "";
    }
  }

  async function send() {
    const text = draft.trim();
    if (pending || busyMedia) return;
    if (!text && files.length === 0) return;

    const payloadText =
      text ||
      (files.some((f) => f.kind === "video-frame")
        ? "Ti allego i fotogrammi del video."
        : "Ti allego quanto vedi.");

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: payloadText,
      attachments: files,
      createdAt: Date.now(),
    };
    useStudio.getState().appendMessage(consult.id, userMsg);
    setDraft("");
    const images = files.map((f) => f.dataUrl).filter(Boolean);
    setFiles([]);
    setPending(true);
    setLocalError(null);

    const history = consult.messages
      .concat(userMsg)
      .slice(0, -1)
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));

    try {
      const result = await runConsult({
        data: {
          specialtyId: consult.specialtyId,
          history,
          userText: payloadText,
          images,
        },
      });
      if (!result.ok) {
        useStudio.getState().appendMessage(consult.id, {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.error,
          error: true,
          createdAt: Date.now(),
        });
      } else {
        useStudio.getState().appendMessage(consult.id, {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.message,
          clinical: result.clinical,
          createdAt: Date.now(),
        });
      }
    } catch {
      useStudio.getState().appendMessage(consult.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "C'è stato un intoppo di linea. Riprova, senza fretta.",
        error: true,
        createdAt: Date.now(),
      });
    } finally {
      setPending(false);
    }
  }

  const canSend = (draft.trim().length > 0 || files.length > 0) && !pending && !busyMedia;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full"
            aria-label="Torna allo studio"
          >
            <GrockMark className="size-7" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl leading-none">Dottor Grock</p>
            <p className="mt-1 truncate text-[11px] uppercase tracking-[0.16em] text-muted">
              {spec.field}
            </p>
          </div>
          <a
            href="tel:118"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-wine"
            aria-label="Chiama il 118"
          >
            <PhoneCall className="size-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">118</span>
          </a>
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full"
            aria-label="Archivio consulti"
          >
            <Archive className="size-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => startConsult(consult.specialtyId)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-accent text-accent-fg"
            aria-label="Nuovo consulto"
          >
            <Plus className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div
        ref={threadRef}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-6"
      >
        {consult.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {pending ? <Thinking /> : null}
      </div>

      <footer className="sticky bottom-0 z-20 border-t border-line/80 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          {wantsMedia ? (
            <p className="mb-2 text-xs leading-relaxed text-accent">
              Il dottore chiede {wantsMedia.photos && wantsMedia.video ? "foto o video" : wantsMedia.video ? "un video" : "una foto"}
              : {wantsMedia.reason}
            </p>
          ) : null}
          {localError ? <p className="mb-2 text-xs text-wine">{localError}</p> : null}
          {files.length > 0 ? (
            <ul className="mb-3 flex gap-2 overflow-x-auto">
              {files.map((f) => (
                <li key={f.id} className="relative shrink-0">
                  {f.dataUrl ? (
                    <img
                      src={f.dataUrl}
                      alt={f.name}
                      className="h-16 w-16 rounded-md object-cover outline outline-1 -outline-offset-1 outline-ink/10"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-surface-2">
                      <ImageOff className="size-4 text-subtle" />
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-ink text-accent-fg"
                    onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                    aria-label="Rimuovi allegato"
                  >
                    <X className="size-3" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex items-end gap-2 rounded-2xl bg-surface p-2 shadow-[var(--shadow-plate)]">
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files, "photo")}
            />
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files, "video")}
            />
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              disabled={busyMedia || files.length >= 4}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-accent"
              aria-label="Allega foto clinica"
            >
              <Camera className="size-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => videoRef.current?.click()}
              disabled={busyMedia || files.length >= 4}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-accent"
              aria-label="Allega video clinico"
            >
              <Video className="size-5" strokeWidth={1.75} />
            </button>
            <textarea
              ref={taRef}
              value={draft}
              rows={1}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={busyMedia ? "Sto preparando le immagini…" : "Scrivi al Dottor Grock"}
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base leading-snug text-ink outline-none placeholder:text-subtle"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!canSend}
              className={cn(
                "flex min-h-11 min-w-11 items-center justify-center rounded-full transition-transform duration-150",
                canSend ? "bg-accent text-accent-fg active:scale-[0.98]" : "bg-line text-subtle",
              )}
              aria-label="Invia"
            >
              <Send className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] leading-relaxed text-subtle">
            Orientamento, non visita. In emergenza 118. Le immagini restano sul tuo dispositivo.
          </p>
        </div>
      </footer>

      {archiveOpen ? (
        <ArchiveSheet
          consults={consults}
          activeId={consult.id}
          onClose={() => setArchiveOpen(false)}
          onOpen={(id) => {
            setActive(id);
            setArchiveOpen(false);
          }}
          onDelete={removeConsult}
        />
      ) : null}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <article className={cn("grock-enter flex flex-col", isUser ? "items-end" : "items-stretch")}>
      {isUser ? (
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-3 text-accent-fg">
          {message.attachments && message.attachments.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {message.attachments.map((a) =>
                a.dataUrl ? (
                  <img
                    key={a.id}
                    src={a.dataUrl}
                    alt=""
                    className="h-20 w-20 rounded-md object-cover outline outline-1 -outline-offset-1 outline-accent-fg/20"
                  />
                ) : (
                  <span
                    key={a.id}
                    className="flex h-20 w-20 items-center justify-center rounded-md bg-accent-fg/10 text-[10px] uppercase tracking-wide"
                  >
                    {a.kind === "video-frame" ? "Video" : "Foto"}
                  </span>
                ),
              )}
            </div>
          ) : null}
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.text}</p>
        </div>
      ) : (
        <div className="max-w-none">
          <div className="flex items-center gap-2 text-accent">
            <GrockMark className="size-5" />
            <p className="text-[11px] uppercase tracking-[0.18em]">Dottor Grock</p>
          </div>
          <div
            className={cn(
              "mt-2 whitespace-pre-wrap text-[17px] leading-relaxed text-ink",
              message.error && "text-wine",
            )}
          >
            {message.text}
          </div>
          {message.clinical ? <ClinicalCard note={message.clinical} /> : null}
        </div>
      )}
    </article>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-3 text-muted">
      <GrockMark className="size-5" />
      <p className="text-sm italic" style={{ animation: "grock-pulse 1.4s ease-in-out infinite" }}>
        Semeiotica in corso — un minuto di pazienza
      </p>
    </div>
  );
}

function ArchiveSheet({
  consults,
  activeId,
  onClose,
  onOpen,
  onDelete,
}: {
  consults: Consult[];
  activeId: string;
  onClose: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const items = useMemo(
    () => [...consults].sort((a, b) => b.updatedAt - a.updatedAt),
    [consults],
  );

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/30"
        aria-label="Chiudi archivio"
        onClick={onClose}
      />
      <div className="relative max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-[var(--shadow-plate)] sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Archivio</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full"
            aria-label="Chiudi"
          >
            <X className="size-5" />
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Nessun consulto ancora.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2 py-1",
                  c.id === activeId && "bg-accent-soft",
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpen(c.id)}
                  className="min-h-11 flex-1 truncate px-2 text-left text-sm"
                >
                  <span className="block truncate font-medium">{c.title}</span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-subtle">
                    {specialtyById(c.specialtyId).name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  className="flex size-11 items-center justify-center text-subtle"
                  aria-label="Elimina consulto"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
