import { useState } from "react";
import { PhoneCall } from "lucide-react";
import { GrockMark } from "./mark";
import { SPECIALTIES } from "@/lib/grock/specialties";
import { useStudio } from "@/lib/grock/store";
import { cn } from "@/lib/utils";

export function Welcome() {
  const acceptEthics = useStudio((s) => s.acceptEthics);
  const accepted = useStudio((s) => s.acceptedEthics);
  const startConsult = useStudio((s) => s.startConsult);
  const [checked, setChecked] = useState(accepted);

  const canEnter = checked || accepted;

  function open(specialtyId: string | null) {
    if (!canEnter) return;
    if (!accepted) acceptEthics();
    startConsult(specialtyId);
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-16 pt-6 sm:gap-10 sm:px-8 sm:pt-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GrockMark className="size-8" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Studio</p>
              <p className="font-display text-xl leading-none text-ink">Dottor Grock</p>
            </div>
          </div>
          <a
            href="tel:118"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-wine px-4 text-sm font-medium text-wine-fg"
          >
            <PhoneCall className="size-4" strokeWidth={1.75} />
            118
          </a>
        </header>

        <section className="grid items-end gap-8 lg:grid-cols-2 lg:gap-10">
          <figure className="grock-enter relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl bg-bg-warm shadow-[var(--shadow-plate)]">
              <img
                src="/dottor-grock.jpg"
                alt="Ritratto del Dottor Grock"
                className="h-[min(42vh,22rem)] w-full object-cover object-top outline outline-1 -outline-offset-1 outline-ink/10 lg:h-auto lg:aspect-[3/4]"
              />
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-sm text-muted">
              <span>Dottor Grock</span>
              <span className="text-xs uppercase tracking-[0.18em]">Medico chirurgo</span>
            </figcaption>
          </figure>

          <div className="grock-enter order-1 flex flex-col gap-5 lg:order-2 lg:gap-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Scienza e coscienza</p>
            <h1 className="font-display text-[2.35rem] leading-[0.95] tracking-tight text-ink sm:text-6xl">
              Medicina e chirurgia,
              <span className="italic text-ink-soft"> senza fretta di nominare.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Mi occupo di tutte le branche, con le tecniche più attuali. Faccio diagnosi
              differenziale. Se serve, mi fai vedere: foto, video, il segno così come sta. Ti
              restituisco ciò che la scienza consente, e ciò che la coscienza impone — incluso
              mandarti da un medico in carne e ossa.
            </p>

            <label className="flex max-w-xl cursor-pointer items-start gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-plate)]">
              <input
                type="checkbox"
                checked={canEnter}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1 size-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="text-sm leading-relaxed text-ink-soft">
                Ho letto: questo studio orienta, non visita. Non prescrive, non certifica. In
                emergenza chiamo il 118. Le foto restano sul mio dispositivo; i metadati di
                posizione vengono rimossi.
              </span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={!canEnter}
                onClick={() => open("completo")}
                className={cn(
                  "inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-medium transition-transform duration-150",
                  canEnter
                    ? "bg-accent text-accent-fg active:scale-[0.98]"
                    : "bg-line text-subtle",
                )}
              >
                Apri il consulto
              </button>
              <p className="text-xs leading-relaxed text-subtle sm:max-w-xs">
                Scegli una branca qui sotto, o entra nel quadro completo.
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-muted">Branche</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {SPECIALTIES.filter((s) => s.id !== "completo").map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={!canEnter}
                onClick={() => open(s.id)}
                className={cn(
                  "min-h-16 rounded-xl bg-surface px-3 py-3 text-left shadow-[var(--shadow-plate)] transition-[box-shadow,transform] duration-150",
                  canEnter
                    ? "hover:shadow-[var(--shadow-plate-hover)] active:scale-[0.99]"
                    : "opacity-50",
                )}
              >
                <p className="text-sm font-medium leading-snug text-ink">{s.name}</p>
                <p className="mt-1 text-[11px] leading-snug text-subtle">{s.field}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
