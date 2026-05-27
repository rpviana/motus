import type {
  HardwareCommandPayload,
  MobilityEventLog,
  RoiZone,
  VisionResult
} from "@motus/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";

export type RoiZoneDefinition = {
  id: RoiZone;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

type SystemReadyPayload = {
  frameProcessIntervalMs?: number;
  roiZones?: RoiZoneDefinition[];
};

const fallbackApiUrl = "http://localhost:4000";

export function useMotusSocket() {
  const apiUrl = useMemo(
    () => import.meta.env.VITE_API_URL?.replace(/\/$/, "") || fallbackApiUrl,
    []
  );
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [frameIntervalMs, setFrameIntervalMs] = useState(1200);
  const [roiZones, setRoiZones] = useState<RoiZoneDefinition[]>([]);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const [logs, setLogs] = useState<MobilityEventLog[]>([]);
  const [commandEvents, setCommandEvents] = useState<HardwareCommandPayload[]>([]);
  const [lastCommand, setLastCommand] = useState<HardwareCommandPayload | null>(null);

  const prependLog = useCallback((log: MobilityEventLog) => {
    setLogs((current) => {
      const next = [log, ...current.filter((item) => item.id !== log.id)];
      return next.slice(0, 60);
    });
  }, []);

  useEffect(() => {
    const connection = io(apiUrl, {
      transports: ["websocket", "polling"]
    });

    setSocket(connection);

    connection.on("connect", () => setConnected(true));
    connection.on("disconnect", () => setConnected(false));
    connection.on("system:ready", (payload: SystemReadyPayload) => {
      if (payload.frameProcessIntervalMs) {
        setFrameIntervalMs(payload.frameProcessIntervalMs);
      }

      if (payload.roiZones) {
        setRoiZones(payload.roiZones);
      }
    });
    connection.on("vision:detections", (result: VisionResult) => setVisionResult(result));
    connection.on("hardware:command", (command: HardwareCommandPayload) => {
      setLastCommand(command);
      setCommandEvents((current) => [command, ...current].slice(0, 20));
    });
    connection.on("log:created", prependLog);

    void fetch(`${apiUrl}/api/logs?limit=40`)
      .then((response) => (response.ok ? response.json() : []))
      .then((items: MobilityEventLog[]) => setLogs(items))
      .catch(() => setLogs([]));

    return () => {
      connection.disconnect();
      setSocket(null);
    };
  }, [apiUrl, prependLog]);

  return {
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
  };
}
