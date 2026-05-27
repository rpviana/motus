import type { CameraFramePayload, VisionResult } from "@motus/shared";
import { Camera, RefreshCw, ScanSearch } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { RoiZoneDefinition } from "../hooks/useMotusSocket";

type Props = {
  socket: Socket | null;
  connected: boolean;
  frameIntervalMs: number;
  result: VisionResult | null;
  roiZones: RoiZoneDefinition[];
  onVisionResult: (result: VisionResult) => void;
};

export function CameraMonitor({
  socket,
  connected,
  frameIntervalMs,
  result,
  roiZones,
  onVisionResult
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function openCamera() {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment"
          },
          audio: false
        });

        if (!cancelled && videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        setCameraReady(false);
        setCameraError("Camara indisponivel");
      }
    }

    void openCamera();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!socket || !connected || !cameraReady) {
      return;
    }

    const interval = window.setInterval(() => {
      const frame = captureFrame(videoRef.current, captureCanvasRef.current);

      if (!frame) {
        return;
      }

      captureCanvasRef.current = frame.canvas;
      setVideoSize({ width: frame.payload.sourceWidth, height: frame.payload.sourceHeight });

      socket.emit(
        "camera:frame",
        frame.payload,
        (response: { ok: boolean; result?: VisionResult; error?: string }) => {
          if (response.ok && response.result) {
            onVisionResult(response.result);
          }
        }
      );
    }, frameIntervalMs);

    return () => window.clearInterval(interval);
  }, [cameraReady, connected, frameIntervalMs, onVisionResult, socket]);

  const viewBox = useMemo(() => {
    const width = result?.sourceWidth ?? videoSize.width;
    const height = result?.sourceHeight ?? videoSize.height;
    return `0 0 ${width} ${height}`;
  }, [result?.sourceHeight, result?.sourceWidth, videoSize.height, videoSize.width]);

  const sourceWidth = result?.sourceWidth ?? videoSize.width;
  const sourceHeight = result?.sourceHeight ?? videoSize.height;

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 shadow-panel md:min-h-[540px]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Camera size={18} aria-hidden="true" />
          <h2 className="text-base font-semibold">Monitor da Camara Real</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <ScanSearch size={16} aria-hidden="true" />
          <span>{result?.detections.length ?? 0} deteccoes</span>
        </div>
      </div>

      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full object-contain"
          onLoadedMetadata={(event) => {
            setVideoSize({
              width: event.currentTarget.videoWidth || 1280,
              height: event.currentTarget.videoHeight || 720
            });
          }}
        />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {roiZones.map((zone) => (
            <rect
              key={zone.id}
              x={zone.xMin * sourceWidth}
              y={zone.yMin * sourceHeight}
              width={(zone.xMax - zone.xMin) * sourceWidth}
              height={(zone.yMax - zone.yMin) * sourceHeight}
              fill="transparent"
              stroke={zone.id === "ENTRY" ? "#f59e0b" : "#14b8a6"}
              strokeDasharray="12 10"
              strokeWidth="4"
            />
          ))}

          {result?.detections.map((detection) => {
            const color = detection.zone === "ELEVATOR_PATH" ? "#14b8a6" : "#f59e0b";
            const labelY = Math.max(detection.box.y - 28, 18);
            const label = `${detection.label} ${(detection.confidence * 100).toFixed(0)}%`;

            return (
              <g key={detection.id}>
                <rect
                  x={detection.box.x}
                  y={detection.box.y}
                  width={detection.box.width}
                  height={detection.box.height}
                  fill="transparent"
                  stroke={color}
                  strokeWidth="5"
                />
                <rect
                  x={detection.box.x}
                  y={labelY - 18}
                  width={Math.max(label.length * 12, 120)}
                  height="26"
                  rx="4"
                  fill={color}
                />
                <text
                  x={detection.box.x + 8}
                  y={labelY}
                  fill="#111827"
                  fontSize="18"
                  fontWeight="700"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        {cameraError ? (
          <div className="absolute inset-0 grid place-items-center bg-zinc-950/90 text-white">
            <div className="flex flex-col items-center gap-3 text-center">
              <Camera size={34} aria-hidden="true" />
              <p className="text-lg font-semibold">{cameraError}</p>
              <button
                type="button"
                title="Recarregar"
                aria-label="Recarregar camara"
                onClick={() => window.location.reload()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-zinc-950 transition hover:bg-zinc-200"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function captureFrame(
  video: HTMLVideoElement | null,
  existingCanvas: HTMLCanvasElement | null
): { payload: CameraFramePayload; canvas: HTMLCanvasElement } | null {
  if (!video || !video.videoWidth || !video.videoHeight) {
    return null;
  }

  const canvas = existingCanvas ?? document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return {
    canvas,
    payload: {
      image: canvas.toDataURL("image/jpeg", 0.7),
      capturedAt: new Date().toISOString(),
      sourceWidth: canvas.width,
      sourceHeight: canvas.height
    }
  };
}
