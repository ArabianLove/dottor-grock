import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Attachment, ChatMessage, Consult } from "./types";
import { openingLetter } from "./prompt";

type StudioState = {
  acceptedEthics: boolean;
  activeId: string | null;
  consults: Consult[];
  acceptEthics: () => void;
  startConsult: (specialtyId: string | null) => string;
  setActive: (id: string | null) => void;
  appendMessage: (consultId: string, message: ChatMessage) => void;
  patchMessage: (consultId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  removeConsult: (id: string) => void;
};

function uid(): string {
  return crypto.randomUUID();
}

function titleFrom(text: string, specialtyName?: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length > 4) return t.slice(0, 48);
  return specialtyName ? `Consulto · ${specialtyName}` : "Nuovo consulto";
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      acceptedEthics: false,
      activeId: null,
      consults: [],

      acceptEthics: () => set({ acceptedEthics: true }),

      startConsult: (specialtyId) => {
        const id = uid();
        const now = Date.now();
        const consult: Consult = {
          id,
          title: "Nuovo consulto",
          specialtyId,
          createdAt: now,
          updatedAt: now,
          messages: [
            {
              id: uid(),
              role: "assistant",
              text: openingLetter(specialtyId),
              createdAt: now,
              clinical:
                specialtyId === "urgenza"
                  ? {
                      emergency: false,
                      emergencyAction: "Se è un'emergenza in corso, chiama il 118.",
                      specialtyFocus: "Medicina d'urgenza",
                      asksForMedia: null,
                      differential: [],
                      redFlags: [
                        "Dolore toracico, dispnea, un lato che non risponde, sanguinamento, bambino inerte: 118.",
                      ],
                      questions: [],
                      nextSteps: [],
                      conscience:
                        "Qui si orienta. L'emergenza si affronta dal vivo, non in una chat.",
                    }
                  : undefined,
            },
          ],
        };
        set((s) => ({
          activeId: id,
          consults: [consult, ...s.consults].slice(0, 24),
        }));
        return id;
      },

      setActive: (id) => set({ activeId: id }),

      appendMessage: (consultId, message) =>
        set((s) => ({
          consults: s.consults.map((c) => {
            if (c.id !== consultId) return c;
            const title =
              c.messages.filter((m) => m.role === "user").length === 0 && message.role === "user"
                ? titleFrom(message.text)
                : c.title;
            return {
              ...c,
              title,
              updatedAt: message.createdAt,
              messages: [...c.messages, message],
            };
          }),
        })),

      patchMessage: (consultId, messageId, patch) =>
        set((s) => ({
          consults: s.consults.map((c) =>
            c.id !== consultId
              ? c
              : {
                  ...c,
                  updatedAt: Date.now(),
                  messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
                },
          ),
        })),

      removeConsult: (id) => {
        const { activeId, consults } = get();
        const next = consults.filter((c) => c.id !== id);
        set({
          consults: next,
          activeId: activeId === id ? (next[0]?.id ?? null) : activeId,
        });
      },
    }),
    {
      name: "dottor-grock-studio-v1",
      partialize: (state) => ({
        acceptedEthics: state.acceptedEthics,
        activeId: state.activeId,
        consults: state.consults.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({
            ...m,
            attachments: stripHeavy(m.attachments),
          })),
        })),
      }),
    },
  ),
);

function stripHeavy(attachments: Attachment[] | undefined): Attachment[] | undefined {
  if (!attachments?.length) return attachments;
  return attachments.map((a) => ({ ...a, dataUrl: "" }));
}

export function activeConsult(): Consult | undefined {
  const { activeId, consults } = useStudio.getState();
  return consults.find((c) => c.id === activeId);
}
