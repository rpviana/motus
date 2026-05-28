import { env } from "../../config/env.js";
import { HuggingFaceVisionProvider } from "./huggingFaceVisionProvider.js";
import { MockVisionProvider } from "./mockVisionProvider.js";
import { RoboflowVisionProvider } from "./roboflowVisionProvider.js";
import type { VisionProvider } from "./types.js";

export function createVisionProvider(): VisionProvider {
  if (env.visionProvider === "roboflow" && env.roboflowApiKey) {
    return new RoboflowVisionProvider(env.roboflowModelUrl, env.roboflowApiKey);
  }

  if (env.visionProvider === "roboflow") {
    console.warn("ROBOFLOW_API_KEY is empty. Falling back to mock vision provider.");
  }

  if (env.visionProvider === "huggingface" && env.huggingFaceApiToken) {
    return new HuggingFaceVisionProvider(env.huggingFaceApiToken, env.huggingFaceModel);
  }

  if (env.visionProvider === "huggingface") {
    console.warn("HUGGING_FACE_API_TOKEN is empty. Falling back to mock vision provider.");
  }

  return new MockVisionProvider();
}
