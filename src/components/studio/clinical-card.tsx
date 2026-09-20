import { AlertTriangle, Camera, CircleHelp, ListChecks, Scale, Video } from "lucide-react";
import type { ClinicalNote, Likelihood } from "@/lib/grock/types";
import { cn } from "@/lib/utils";

const LIKELIHOOD_LABEL: Record<Likelihood, string> = {
  alta: "Alta",
  media: "Media",
  bassa: "Bassa",
};

export function ClinicalCard({ note }: { note: ClinicalNote }) {
  const hasBody =
    note.differential.length > 0 ||
    note.redFlags.length > 0 ||
    note.questions.length > 0 ||
    note.nextSteps.length > 0 ||
    note.conscience ||
    note.asksForMedia ||
    note.emergency;

  if (!hasBody) return null;

  return (
    <aside className="mt-4 overflow-hidden rounded-xl bg-surface-2/80 shadow-[var(--shadow-plate)]">
      {note.emergency ? (
        <div className="flex items-start gap-3 bg-wine px-4 py-3 text-wine-fg">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
          <div>
            <p className="font-medium tracking-wide uppercase text-xs">Urgenza</p>
            <p className="mt-1 text-sm leading-snug">
              {note.emergencyAction || "Chiama il 118 o vai al Pronto Soccorso."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-5 px-4 py-5">
        {note.specialtyFocus ? (
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{note.specialtyFocus}</p>
        ) : null}

        {note.differential.length > 0 ? (
          <section>
            <h3 className="font-display text-lg text-ink">Diagnosi differenziale</h3>
            <ol className="mt-3 flex flex-col gap-3">
              {note.differential.map((d, i) => (
                <li key={d.name} className="grid grid-cols-[auto_1fr] gap-x-3">
                  <span className="font-display text-xl leading-none text-accent tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="font-medium text-ink">{d.name}</p>
                      <LikelihoodChip value={d.likelihood} />
                    </div>
                    {d.rationale ? (
                      <p className="mt-1 text-sm leading-relaxed text-muted">{d.rationale}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {note.redFlags.length > 0 ? (
          <section>
            <Header icon={AlertTriangle} title="Segnali d'allarme" />
            <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-ink-soft">
              {note.redFlags.map((item) => (
                <li key={item} className="pl-3 border-l border-wine/40">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {note.nextSteps.length > 0 ? (
          <section>
            <Header icon={ListChecks} title="Cosa fare ora" />
            <ol className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-ink-soft">
              {note.nextSteps.map((item, i) => (
                <li key={item}>
                  <span className="tabular-nums text-subtle mr-2">{i + 1}.</span>
                  {item}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {note.questions.length > 0 ? (
          <section>
            <Header icon={CircleHelp} title="Per chiudere il quadro" />
            <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-ink-soft">
              {note.questions.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {note.asksForMedia ? (
          <section className="rounded-md bg-accent-soft px-3 py-3">
            <div className="flex items-center gap-2 text-accent">
              {note.asksForMedia.photos ? <Camera className="size-4" strokeWidth={1.75} /> : null}
              {note.asksForMedia.video ? <Video className="size-4" strokeWidth={1.75} /> : null}
              <p className="text-xs uppercase tracking-[0.16em] font-medium">Il dottore chiede di vedere</p>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{note.asksForMedia.reason}</p>
          </section>
        ) : null}

        {note.conscience ? (
          <blockquote className="border-t border-line pt-4">
            <div className="flex items-center gap-2 text-accent">
              <Scale className="size-4" strokeWidth={1.75} />
              <p className="text-xs uppercase tracking-[0.16em] font-medium">Coscienza</p>
            </div>
            <p className="mt-2 font-display text-[1.15rem] leading-snug italic text-ink-soft">
              {note.conscience}
            </p>
          </blockquote>
        ) : null}
      </div>
    </aside>
  );
}

function Header({ icon: Icon, title }: { icon: typeof AlertTriangle; title: string }) {
  return (
    <div className="flex items-center gap-2 text-ink">
      <Icon className="size-4 text-accent" strokeWidth={1.75} />
      <h3 className="text-sm font-medium">{title}</h3>
    </div>
  );
}

function LikelihoodChip({ value }: { value: Likelihood }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] font-medium",
        value === "alta" && "bg-wine-soft text-wine",
        value === "media" && "bg-surface text-muted",
        value === "bassa" && "bg-ok-soft text-ok",
      )}
    >
      {LIKELIHOOD_LABEL[value]}
    </span>
  );
}
