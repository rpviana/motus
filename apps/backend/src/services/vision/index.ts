import { env } from "../../config/env.js";
import { HuggingFaceVisionProvider } from "./huggingFaceVisionProvider.js";
import { MockVisionProvider } from "./mockVisionProvider.js";
import type { VisionProvider } from "./types.js";

export function createVisionProvider(): VisionProvider {
  if (env.visionProvider === "huggingface" && env.huggingFaceApiToken) {
    return new HuggingFaceVisionProvider(env.huggingFaceApiToken, env.huggingFaceModel);
  }

  if (env.visionProvider === "huggingface") {
    console.warn("HUGGING_FACE_API_TOKEN is empty. Falling back to mock vision provider.");
  }

  return new MockVisionProvider();
}
