export type KpiTone = "green" | "gold" | "cyan" | "white";

export type KpiItem = {
  id: string;
  label: string;
  value: string;
  sub: string;
  tone: KpiTone;

  // Enterprise credibility
  sourceTag?: string; // e.g. "SRC: ServiceLogix"
  calc?: string;      // e.g. "Uptime = 1 - (Downtime/TotalTime)"
  actions?: string[]; // e.g. ["PM cadence", "Spare policy", ...]
};

export const HITECH_TOKENS = {
  gold: "#AB7B26",
  blueDeep: "#026F86",
  cyan: "#02A7CA",
  bronze: "#553E13",
};

export const KPI_ITEMS: KpiItem[] = [
  {
    id: "uptime",
    label: "UPTIME PROMEDIO",
    value: "98.5%",
    sub: "↑ 15% vs Anterior",
    tone: "green",
    sourceTag: "SRC: ServiceLogix",
    calc: "Uptime = 1 - (Downtime / Total Time)",
    actions: ["Preventivo calendarizado", "Checklist de arranque", "Cierre de hallazgos"],
  },
  {
    id: "savings",
    label: "COST SAVINGS",
    value: "$45K",
    sub: "En refacciones evitadas",
    tone: "gold",
    sourceTag: "SRC: SmartService",
    calc: "Savings = (Costo evitado) - (Costo intervención)",
    actions: ["Refacciones críticas", "Diagnóstico temprano", "Estandarización OEM"],
  },
  {
    id: "response",
    label: "TIEMPO RESPUESTA",
    value: "24H",
    sub: "vs 72H Promedio Industria",
    tone: "cyan",
    sourceTag: "SRC: HealthRadar",
    calc: "Response = (Open → First Action) tiempo",
    actions: ["SLA + triage", "Rutas y kits", "Pre-diagnóstico remoto"],
  },
  {
    id: "roi",
    label: "ROI PROYECTADO",
    value: "4.5x",
    sub: "En 12 meses",
    tone: "white",
    sourceTag: "SRC: Financial Model",
    calc: "ROI = (Beneficio neto / Inversión)",
    actions: ["Estandarizar entregables", "Repetibilidad", "Expansión a 2–3 plantas"],
  },
];
