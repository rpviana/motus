import type {
  HardwareCommandPayload,
  MobilityDetection,
  MobilityType,
  RoiZone,
  VisionResult
} from "@motus/shared";
import type { EventLogDraft } from "./eventLogger.js";

type NormalizedZone = {
  id: RoiZone;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

type MobilityState = {
  commandSentAt?: number;
};

export type RoiDecision = {
  result: VisionResult;
  logs: EventLogDraft[];
  commands: HardwareCommandPayload[];
};

export const roiZones: NormalizedZone[] = [
  { id: "ENTRY", xMin: 0.04, xMax: 0.42, yMin: 0.18, yMax: 0.98 },
  { id: "ELEVATOR_PATH", xMin: 0.43, xMax: 0.96, yMin: 0.18, yMax: 0.98 }
];

const commandCooldownMs = 15000;
const minimumConfidence = 0.75;
const autoOpenTypes = new Set<MobilityType>(["wheelchair", "crutches"]);

export class RoiTracker {
  private readonly state = new Map<MobilityType, MobilityState>();

  evaluate(result: VisionResult): RoiDecision {
    const now = Date.now();
    const logs: EventLogDraft[] = [];
    const commands: HardwareCommandPayload[] = [];
    const detections = result.detections.map((detection) => ({
      ...detection,
      zone: detectZone(detection, result.sourceWidth, result.sourceHeight)
    }));

    for (const detection of detections) {
      if (!detection.mobilityType) {
        continue;
      }

      if (!autoOpenTypes.has(detection.mobilityType) || detection.confidence < minimumConfidence) {
        continue;
      }

      const state = this.stateFor(detection.mobilityType);
      const zone = detection.zone ?? "ENTRY";

      if (!state.commandSentAt || now - state.commandSentAt > commandCooldownMs) {
        state.commandSentAt = now;
        logs.push({
          event: "Detecao",
          mobilityType: detection.mobilityType,
          zone,
          confidence: detection.confidence,
          metadata: {
            label: detection.label,
            box: detection.box
          }
        });

        commands.push({
          command: "OPEN_DOOR",
          reason: `${detection.mobilityType} detected in ${zone}`,
          createdAt: new Date(now).toISOString()
        });

        logs.push({
          event: "Comando emitido",
          mobilityType: detection.mobilityType,
          zone,
          command: "OPEN_DOOR",
          confidence: detection.confidence
        });
      }
    }

    return {
      result: {
        ...result,
        detections
      },
      logs,
      commands
    };
  }

  private stateFor(type: MobilityType) {
    const existing = this.state.get(type);

    if (existing) {
      return existing;
    }

    const created: MobilityState = {};
    this.state.set(type, created);
    return created;
  }
}

function detectZone(
  detection: MobilityDetection,
  sourceWidth: number,
  sourceHeight: number
): RoiZone | undefined {
  const safeWidth = Math.max(sourceWidth, 1);
  const safeHeight = Math.max(sourceHeight, 1);
  const centerX = (detection.box.x + detection.box.width / 2) / safeWidth;
  const centerY = (detection.box.y + detection.box.height / 2) / safeHeight;

  return roiZones.find(
    (zone) =>
      centerX >= zone.xMin &&
      centerX <= zone.xMax &&
      centerY >= zone.yMin &&
      centerY <= zone.yMax
  )?.id;
}
