import type { Specialty } from "./types";

export const SPECIALTIES: Specialty[] = [
  {
    id: "completo",
    name: "Quadro completo",
    field: "Medicina interna e chirurgia",
    hint: "Semeiotica a tutto campo, senza specialità preassegnata.",
  },
  {
    id: "pelle",
    name: "Pelle e ferite",
    field: "Dermatologia · chirurgia plastica",
    hint: "Rash, nei, ulcere, ustioni, cicatrici. Foto ravvicinate, luce naturale.",
  },
  {
    id: "cuore",
    name: "Cuore e vasi",
    field: "Cardiologia · chirurgia vascolare",
    hint: "Dolore toracico, palpitazioni, edema, claudicatio.",
  },
  {
    id: "nervi",
    name: "Cervello e nervi",
    field: "Neurologia · neurochirurgia",
    hint: "Cefalea, deficit, tremore, crisi. Un video del movimento aiuta.",
  },
  {
    id: "ossa",
    name: "Ossa e articolazioni",
    field: "Ortopedia · reumatologia",
    hint: "Trauma, impotenza funzionale, gonfiore. Foto e video di movimento.",
  },
  {
    id: "pancia",
    name: "Pancia e digestione",
    field: "Gastroenterologia · chirurgia",
    hint: "Dolore addominale, alvo, vomito, ittero.",
  },
  {
    id: "respiro",
    name: "Respiro",
    field: "Pneumologia · chirurgia toracica",
    hint: "Dispnea, tosse, dolore pleurico, saturazione se la conosci.",
  },
  {
    id: "ormoni",
    name: "Ormoni e metabolismo",
    field: "Endocrinologia",
    hint: "Tiroide, glicemia, peso, ciclo, stanchezza.",
  },
  {
    id: "donna",
    name: "Salute della donna",
    field: "Ginecologia · senologia",
    hint: "Ciclo, dolore pelvico, seno, gravidanza. Foto solo se clinicamente utili.",
  },
  {
    id: "uomo",
    name: "Salute dell'uomo",
    field: "Urologia · andrologia",
    hint: "Vie urinarie, prostata, dolore testicolare, disfunzione.",
  },
  {
    id: "occhi",
    name: "Occhi",
    field: "Oculistica",
    hint: "Rossore, calo visivo, trauma. Foto dell'occhio in luce naturale.",
  },
  {
    id: "orls",
    name: "Orecchio, naso, gola",
    field: "Otorinolaringoiatria",
    hint: "Otalgia, sinusite, disfonia, masse del collo.",
  },
  {
    id: "bambini",
    name: "Bambini",
    field: "Pediatria",
    hint: "Età in mesi o anni, vaccini, curva di crescita, foto del segno.",
  },
  {
    id: "infezioni",
    name: "Infezioni",
    field: "Infettivologia",
    hint: "Febbre, viaggi, contatti, immunosoppressione.",
  },
  {
    id: "tumori",
    name: "Oncologia",
    field: "Oncologia medica e chirurgica",
    hint: "Masse, dimagrimento, referti. Non sostituisce lo specialista curante.",
  },
  {
    id: "mente",
    name: "Mente",
    field: "Psichiatria · psicologia clinica",
    hint: "Umore, sonno, ansia, rischio. Ascolto prima di ogni ipotesi.",
  },
  {
    id: "urgenza",
    name: "Urgenza",
    field: "Medicina d'urgenza",
    hint: "Se è un'emergenza, il telefono è il 118 — non questo studio.",
  },
  {
    id: "dolore",
    name: "Dolore e post-operatorio",
    field: "Anestesia · terapia del dolore",
    hint: "Dolore cronico, ferita chirurgica, drenaggi, farmaci in corso.",
  },
];

export function specialtyById(id: string | null): Specialty {
  return SPECIALTIES.find((s) => s.id === id) ?? SPECIALTIES[0];
}
