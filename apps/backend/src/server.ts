import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import type { CameraFramePayload, HardwareCommandPayload, VisionResult } from "@motus/shared";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";
import { createEventLog, listEventLogs } from "./services/eventLogger.js";
import { clearElevatorCallSchedule, scheduleElevatorCall } from "./services/elevatorCallScheduler.js";
import { RoiTracker, roiZones } from "./services/roiTracker.js";
import { RoboflowVisionProvider } from "./services/vision/roboflowVisionProvider.js";

type FrameAck = (response: { ok: boolean; result?: VisionResult; error?: string }) => void;

const app = express();
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "12mb" }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.clientOrigin
  }
});

const visionProvider = new RoboflowVisionProvider(env.roboflowModelUrl, env.roboflowApiKey);
const roiTracker = new RoiTracker();

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "motus-backend",
    provider: "roboflow"
  });
});

app.get("/api/logs", async (request, response) => {
  const limit = Number(request.query.limit ?? 50);
  response.json(await listEventLogs(limit));
});

app.get("/api/roi-zones", (_request, response) => {
  response.json(roiZones);
});

app.post("/api/camera/frame", async (request, response) => {
  try {
    const result = await processFrame(request.body as CameraFramePayload);
    response.json(result);
  } catch (error) {
    response.status(422).json({ error: error instanceof Error ? error.message : "Invalid frame" });
  }
});

io.on("connection", (socket) => {
  socket.emit("system:ready", {
    connectedAt: new Date().toISOString(),
    frameProcessIntervalMs: env.frameProcessIntervalMs,
    roiZones
  });

  socket.on("camera:frame", async (payload: CameraFramePayload, ack?: FrameAck) => {
    try {
      const result = await processFrame(payload);
      ack?.({ ok: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Frame processing failed";
      ack?.({ ok: false, error: message });
      socket.emit("vision:error", { message });
    }
  });
});

async function processFrame(payload: CameraFramePayload) {
  validateFrame(payload);

  const rawResult = await visionProvider.detect(payload);
  const decision = roiTracker.evaluate(rawResult);

  io.emit("vision:detections", decision.result);

  for (const logDraft of decision.logs) {
    const log = await createEventLog(logDraft);
    io.emit("log:created", log);
  }

  for (const command of decision.commands) {
    emitHardwareCommand(command);

    if (command.command === "OPEN_DOOR") {
      scheduleElevatorCall(() => {
        const elevatorCommand: HardwareCommandPayload = {
          command: "CALL_ELEVATOR",
          reason: `${command.reason} after 6 seconds`,
          createdAt: new Date().toISOString()
        };

        void createEventLog({
          event: "Comando emitido",
          command: elevatorCommand.command
        }).then((log) => io.emit("log:created", log));

        emitHardwareCommand(elevatorCommand);
      });
    }
  }

  return decision.result;
}

function emitHardwareCommand(command: HardwareCommandPayload) {
  io.emit("hardware:command", command);
}

function validateFrame(payload: CameraFramePayload) {
  if (!payload?.image || !payload.image.includes("base64")) {
    throw new Error("Frame image must be a base64 data URL.");
  }

  if (!payload.sourceWidth || !payload.sourceHeight) {
    throw new Error("Frame dimensions are required.");
  }
}

function shutdown() {
  clearElevatorCallSchedule();
  void prisma.$disconnect().finally(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

httpServer.listen(env.port, () => {
  console.log(`Motus backend listening on http://localhost:${env.port}`);
});
