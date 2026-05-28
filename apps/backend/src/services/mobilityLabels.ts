import type { MobilityType } from "@motus/shared";

const labelMap: Array<{ type: MobilityType; keywords: string[] }> = [
  { type: "wheelchair", keywords: ["wheelchair", "weelchair", "wheel chair", "cadeira de rodas"] },
  { type: "crutches", keywords: ["crutch", "crutches", "muleta"] },
  { type: "walker", keywords: ["walker", "walking frame", "andador"] },
  { type: "cane", keywords: ["cane", "walking stick", "bengala"] },
  {
    type: "mobility_scooter",
    keywords: ["mobility scooter", "electric scooter", "scooter"]
  }
];

const humanKeywords = [
  "person",
  "people",
  "human",
  "adult",
  "child",
  "man",
  "woman",
  "boy",
  "girl",
  "head",
  "face",
  "body"
];

export function classifyMobilityLabel(label: string): MobilityType | null {
  const normalized = normalizeLabel(label);

  if (!normalized || humanKeywords.includes(normalized)) {
    return null;
  }

  const match = labelMap.find(({ keywords }) => keywords.some((keyword) => normalized === keyword));

  return match?.type ?? null;
}

function normalizeLabel(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
