import { Activity, Wifi, WifiOff } from "lucide-react";
import { CameraMonitor } from "./components/CameraMonitor";
import { HardwareSimulator } from "./components/HardwareSimulator";
import { LogsPanel } from "./components/LogsPanel";
import { useMotusSocket } from "./hooks/useMotusSocket";
import "./styles.css";

export function App() {
  const {
    apiUrl,
    connected,
    frameIntervalMs,
    commandEvents,
    lastCommand,
    logs,
    roiZones,
    socket,
    visionResult,
    setVisionResult
  } = useMotusSocket();

  return (
    <main className="min-h-screen bg-[#eef2ef] text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <Activity size={22} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Motus</h1>
              <p className="text-sm text-zinc-500">Acessibilidade preditiva</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-500 sm:inline">{apiUrl}</span>
            <span
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-medium ${
                connected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
              {connected ? "Ligado" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 p-4 md:p-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.8fr)]">
        <CameraMonitor
          socket={socket}
          connected={connected}
          frameIntervalMs={frameIntervalMs}
          result={visionResult}
          roiZones={roiZones}
          onVisionResult={setVisionResult}
        />

        <div className="grid min-h-0 gap-4">
          <HardwareSimulator lastCommand={lastCommand} commandEvents={commandEvents} />
          <LogsPanel logs={logs} />
        </div>
      </section>
    </main>
  );
}
