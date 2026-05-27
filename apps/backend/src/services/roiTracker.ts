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
  entrySeenAt?: number;
  detectionLoggedAt?: number;
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

const detectionCooldownMs = 5000;
const commandCooldownMs = 15000;
const intentWindowMs = 14000;

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
      if (!detection.zone) {
        continue;
      }

      const state = this.stateFor(detection.mobilityType);

      if (detection.zone === "ENTRY") {
        state.entrySeenAt = now;

        if (!state.detectionLoggedAt || now - state.detectionLoggedAt > detectionCooldownMs) {
          state.detectionLoggedAt = now;
          logs.push({
            event: "Detecao",
            mobilityType: detection.mobilityType,
            zone: detection.zone,
            confidence: detection.confidence,
            metadata: {
              label: detection.label,
              box: detection.box
            }
          });
        }
      }

      if (detection.zone === "ELEVATOR_PATH" && this.hasRecentEntry(state, now)) {
        if (!state.commandSentAt || now - state.commandSentAt > commandCooldownMs) {
          state.commandSentAt = now;
          logs.push({
            event: "Intencao confirmada",
            mobilityType: detection.mobilityType,
            zone: detection.zone,
            confidence: detection.confidence,
            metadata: {
              label: detection.label,
              box: detection.box
            }
          });

          for (const command of ["OPEN_DOOR", "CALL_ELEVATOR"] as const) {
            commands.push({
              command,
              reason: `${detection.mobilityType} moved from ENTRY to ELEVATOR_PATH`,
              createdAt: new Date(now).toISOString()
            });
            logs.push({
              event: "Comando emitido",
              mobilityType: detection.mobilityType,
              zone: detection.zone,
              command,
              confidence: detection.confidence
            });
          }
        }
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

  private hasRecentEntry(state: MobilityState, now: number) {
    return Boolean(state.entrySeenAt && now - state.entrySeenAt <= intentWindowMs);
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
