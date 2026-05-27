import type { HardwareCommand, MobilityEventLog, MobilityType, RoiZone } from "@motus/shared";
import { ClipboardList } from "lucide-react";

type Props = {
  logs: MobilityEventLog[];
};

const mobilityLabels: Record<MobilityType, string> = {
  wheelchair: "Cadeira de rodas",
  crutches: "Muletas",
  walker: "Andador",
  cane: "Bengala",
  mobility_scooter: "Scooter",
  unknown: "Desconhecido"
};

const zoneLabels: Record<RoiZone, string> = {
  ENTRY: "Entrada",
  ELEVATOR_PATH: "Trajeto elevador"
};

const commandLabels: Record<HardwareCommand, string> = {
  OPEN_DOOR: "Abrir portas",
  CALL_ELEVATOR: "Chamar elevador"
};

export function LogsPanel({ logs }: Props) {
  return (
    <section className="min-h-[360px] rounded-lg border border-zinc-200 bg-white shadow-panel">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} aria-hidden="true" />
          <h2 className="text-base font-semibold">Eventos</h2>
        </div>
        <span className="rounded-lg border border-zinc-200 px-3 py-1 text-sm text-zinc-600">
          {logs.length}
        </span>
      </div>

      <div className="max-h-[420px] overflow-y-auto p-2">
        {logs.length === 0 ? (
          <div className="grid min-h-[260px] place-items-center text-sm text-zinc-500">
            Sem eventos
          </div>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-950">{log.event}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatMobility(log.mobilityType)}
                      {log.zone ? ` · ${zoneLabels[log.zone]}` : ""}
                      {log.command ? ` · ${commandLabels[log.command]}` : ""}
                    </p>
                  </div>
                  <time className="shrink-0 text-sm tabular-nums text-zinc-500">
                    {formatTime(log.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function formatMobility(type: MobilityType | null | undefined) {
  return type ? mobilityLabels[type] : "Sistema";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}
