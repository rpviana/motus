import type { MobilityType } from "@motus/shared";

const labelMap: Array<{ type: MobilityType; keywords: string[] }> = [
  { type: "wheelchair", keywords: ["wheelchair", "wheel chair", "cadeira de rodas"] },
  { type: "crutches", keywords: ["crutch", "crutches", "muleta"] },
  { type: "walker", keywords: ["walker", "walking frame", "andador"] },
  { type: "cane", keywords: ["cane", "walking stick", "bengala"] },
  {
    type: "mobility_scooter",
    keywords: ["mobility scooter", "electric scooter", "scooter"]
  }
];

export function classifyMobilityLabel(label: string): MobilityType | null {
  const normalized = label.toLowerCase();
  const match = labelMap.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword))
  );

  return match?.type ?? null;
}
