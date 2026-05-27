import type { Prisma, MobilityEvent as PrismaMobilityEvent } from "@prisma/client";
import type {
  HardwareCommand,
  MobilityEventLog,
  MobilityType,
  RoiZone
} from "@motus/shared";
import { randomUUID } from "node:crypto";
import { prisma } from "../db/prisma.js";

export type EventLogDraft = {
  event: string;
  mobilityType?: MobilityType;
  zone?: RoiZone;
  command?: HardwareCommand;
  confidence?: number;
  metadata?: Prisma.InputJsonValue;
};

function toLog(event: PrismaMobilityEvent): MobilityEventLog {
  return {
    id: event.id,
    event: event.event,
    mobilityType: event.mobilityType as MobilityType | null,
    zone: event.zone as RoiZone | null,
    command: event.command as HardwareCommand | null,
    confidence: event.confidence,
    createdAt: event.createdAt.toISOString()
  };
}

function fallbackLog(draft: EventLogDraft): MobilityEventLog {
  return {
    id: `memory-${randomUUID()}`,
    event: draft.event,
    mobilityType: draft.mobilityType ?? null,
    zone: draft.zone ?? null,
    command: draft.command ?? null,
    confidence: draft.confidence ?? null,
    createdAt: new Date().toISOString()
  };
}

export async function createEventLog(draft: EventLogDraft): Promise<MobilityEventLog> {
  try {
    const event = await prisma.mobilityEvent.create({
      data: {
        event: draft.event,
        mobilityType: draft.mobilityType,
        zone: draft.zone,
        command: draft.command,
        confidence: draft.confidence,
        metadata: draft.metadata
      }
    });

    return toLog(event);
  } catch (error) {
    console.warn("Prisma log write failed, keeping realtime fallback log", error);
    return fallbackLog(draft);
  }
}

export async function listEventLogs(limit = 50): Promise<MobilityEventLog[]> {
  try {
    const events = await prisma.mobilityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100)
    });

    return events.map(toLog);
  } catch (error) {
    console.warn("Prisma log read failed", error);
    return [];
  }
}
