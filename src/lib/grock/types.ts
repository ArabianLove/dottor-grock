export type Likelihood = "alta" | "media" | "bassa";

export type MediaKind = "photo" | "video-frame";

export type Attachment = {
  id: string;
  kind: MediaKind;
  mime: "image/jpeg" | "image/png";
  dataUrl: string;
  name: string;
};

export type Differential = {
  name: string;
  likelihood: Likelihood;
  rationale: string;
};

export type MediaAsk = {
  photos: boolean;
  video: boolean;
  reason: string;
};

export type ClinicalNote = {
  emergency: boolean;
  emergencyAction: string | null;
  specialtyFocus: string;
  asksForMedia: MediaAsk | null;
  differential: Differential[];
  redFlags: string[];
  questions: string[];
  nextSteps: string[];
  conscience: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  attachments?: Attachment[];
  clinical?: ClinicalNote;
  createdAt: number;
  error?: boolean;
};

export type Consult = {
  id: string;
  title: string;
  specialtyId: string | null;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export type Specialty = {
  id: string;
  name: string;
  field: string;
  hint: string;
};
