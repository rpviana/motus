import "dotenv/config";

type VisionProviderName = "mock" | "huggingface";

function readNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readVisionProvider(): VisionProviderName {
  return process.env.VISION_PROVIDER === "huggingface" ? "huggingface" : "mock";
}

export const env = {
  port: readNumber("PORT", 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  visionProvider: readVisionProvider(),
  huggingFaceApiToken: process.env.HUGGING_FACE_API_TOKEN ?? "",
  huggingFaceModel: process.env.HUGGING_FACE_MODEL ?? "facebook/detr-resnet-50",
  frameProcessIntervalMs: readNumber("FRAME_PROCESS_INTERVAL_MS", 1200)
};
