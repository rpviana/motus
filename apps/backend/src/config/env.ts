import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true, quiet: true });

type VisionProviderName = "mock" | "huggingface" | "roboflow";

function readNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readVisionProvider(): VisionProviderName {
  if (process.env.VISION_PROVIDER === "huggingface") {
    return "huggingface";
  }

  if (process.env.VISION_PROVIDER === "roboflow") {
    return "roboflow";
  }

  return "mock";
}

export const env = {
  port: readNumber("PORT", 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  visionProvider: readVisionProvider(),
  roboflowApiKey: process.env.ROBOFLOW_API_KEY ?? "",
  roboflowModelUrl:
    process.env.ROBOFLOW_MODEL_URL ?? "https://serverless.roboflow.com/motus-accessibility/2",
  huggingFaceApiToken: process.env.HUGGING_FACE_API_TOKEN ?? "",
  huggingFaceModel: process.env.HUGGING_FACE_MODEL ?? "facebook/detr-resnet-50",
  frameProcessIntervalMs: readNumber("FRAME_PROCESS_INTERVAL_MS", 1200)
};
