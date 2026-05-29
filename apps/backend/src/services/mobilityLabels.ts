import type { MobilityType } from "@motus/shared";

// Labels aceites vindas do Roboflow. "person" fica fora de proposito.
const mobilityLabels: Record<string, MobilityType> = {
  wheelchair: "wheelchair",
  weelchair: "wheelchair",
  "wheel chair": "wheelchair",
  "cadeira de rodas": "wheelchair",
  crutch: "crutches",
  crutches: "crutches",
  muleta: "crutches",
  walker: "walker",
  "walking frame": "walker",
  andador: "walker",
  cane: "cane",
  "walking stick": "cane",
  bengala: "cane",
  scooter: "mobility_scooter",
  "mobility scooter": "mobility_scooter",
  "electric scooter": "mobility_scooter"
};

export function classifyMobilityLabel(label: string): MobilityType | null {
  return mobilityLabels[normalizeLabel(label)] ?? null;
}

function normalizeLabel(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
