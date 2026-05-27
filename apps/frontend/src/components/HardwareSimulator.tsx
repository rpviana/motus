import type { HardwareCommandPayload } from "@motus/shared";
import { ArrowDown, DoorOpen, RadioTower } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  lastCommand: HardwareCommandPayload | null;
  commandEvents: HardwareCommandPayload[];
};

export function HardwareSimulator({ lastCommand, commandEvents }: Props) {
  const [doorOpen, setDoorOpen] = useState(false);
  const [floor, setFloor] = useState(3);
  const [elevatorMoving, setElevatorMoving] = useState(false);
  const processedCommandsRef = useRef(new Set<string>());
  const doorTimeoutRef = useRef<number | null>(null);
  const elevatorIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const nextCommands = commandEvents
      .filter((command) => !processedCommandsRef.current.has(commandKey(command)))
      .reverse();

    for (const command of nextCommands) {
      processedCommandsRef.current.add(commandKey(command));

      if (command.command === "OPEN_DOOR") {
        openDoor();
      }

      if (command.command === "CALL_ELEVATOR") {
        callElevator();
      }
    }
  }, [commandEvents]);

  useEffect(() => {
    return () => {
      if (doorTimeoutRef.current) {
        window.clearTimeout(doorTimeoutRef.current);
      }

      if (elevatorIntervalRef.current) {
        window.clearInterval(elevatorIntervalRef.current);
      }
    };
  }, []);

  function openDoor() {
    setDoorOpen(true);

    if (doorTimeoutRef.current) {
      window.clearTimeout(doorTimeoutRef.current);
    }

    doorTimeoutRef.current = window.setTimeout(() => setDoorOpen(false), 6000);
  }

  function callElevator() {
    if (elevatorIntervalRef.current) {
      window.clearInterval(elevatorIntervalRef.current);
    }

    setElevatorMoving(true);
    setFloor(3);

    elevatorIntervalRef.current = window.setInterval(() => {
      setFloor((current) => {
        if (current <= 0) {
          if (elevatorIntervalRef.current) {
            window.clearInterval(elevatorIntervalRef.current);
          }

          setElevatorMoving(false);
          return 0;
        }

        return current - 1;
      });
    }, 700);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-panel">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <RadioTower size={18} aria-hidden="true" />
          <h2 className="text-base font-semibold">Hardware Digital</h2>
        </div>
        <span className="rounded-lg border border-zinc-200 px-3 py-1 text-sm text-zinc-600">
          {lastCommand?.command ?? "A aguardar"}
        </span>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DoorOpen size={18} aria-hidden="true" />
              <h3 className="text-sm font-semibold">Portas automaticas</h3>
            </div>
            <span
              className={`rounded-lg px-3 py-1 text-sm font-medium ${
                doorOpen ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {doorOpen ? "Aberto" : "Fechado"}
            </span>
          </div>

          <div className="relative h-48 overflow-hidden rounded-lg border border-zinc-300 bg-zinc-900">
            <div className="absolute inset-x-8 top-5 h-8 rounded-lg bg-amber-300" />
            <div
              className={`absolute bottom-0 left-0 top-0 w-1/2 border-r border-zinc-700 bg-zinc-700 transition-transform duration-700 ${
                doorOpen ? "-translate-x-[86%]" : "translate-x-0"
              }`}
            />
            <div
              className={`absolute bottom-0 right-0 top-0 w-1/2 border-l border-zinc-700 bg-zinc-700 transition-transform duration-700 ${
                doorOpen ? "translate-x-[86%]" : "translate-x-0"
              }`}
            />
            <div className="absolute inset-x-1/2 top-0 h-full w-px bg-zinc-500" />
            <div className="absolute bottom-4 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-300 shadow-[0_0_24px_rgba(110,231,183,0.9)]" />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDown size={18} aria-hidden="true" />
              <h3 className="text-sm font-semibold">Elevador</h3>
            </div>
            <span
              className={`rounded-lg px-3 py-1 text-sm font-medium ${
                elevatorMoving ? "bg-cyan-100 text-cyan-800" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {elevatorMoving ? "A descer" : "Piso 0"}
            </span>
          </div>

          <div className="grid h-48 place-items-center rounded-lg border border-zinc-300 bg-zinc-950 p-4 text-white">
            <div className="w-full rounded-lg border border-cyan-400/50 bg-cyan-950/50 p-5 text-center shadow-[0_0_35px_rgba(34,211,238,0.22)]">
              <p className="text-sm text-cyan-200">Piso</p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <ArrowDown
                  size={34}
                  className={elevatorMoving ? "animate-bounce text-cyan-300" : "text-zinc-600"}
                  aria-hidden="true"
                />
                <span className="text-6xl font-bold tabular-nums">{floor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function commandKey(command: HardwareCommandPayload) {
  return `${command.createdAt}-${command.command}-${command.reason}`;
}
