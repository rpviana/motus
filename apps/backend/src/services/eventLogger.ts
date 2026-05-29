import type { Prisma, MobilityEvent as PrismaMobilityEvent } from "@prisma/client";
import type {
  HardwareCommand,
  MobilityEventLog,
  MobilityType,
  RoiZone
} from "@motus/shared";
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

// Guarda o historico real no Neon e devolve o formato usado pelo frontend.
export async function createEventLog(draft: EventLogDraft): Promise<MobilityEventLog> {
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
}

export async function listEventLogs(limit = 50): Promise<MobilityEventLog[]> {
  const events = await prisma.mobilityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100)
  });

  return events.map(toLog);
}
