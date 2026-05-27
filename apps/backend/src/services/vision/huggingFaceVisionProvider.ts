import type { CameraFramePayload, MobilityDetection, VisionResult } from "@motus/shared";
import { classifyMobilityLabel } from "../mobilityLabels.js";
import type { VisionProvider } from "./types.js";

type HuggingFacePrediction = {
  score?: number;
  label?: string;
  box?: {
    xmin?: number;
    ymin?: number;
    xmax?: number;
    ymax?: number;
  };
};

export class HuggingFaceVisionProvider implements VisionProvider {
  constructor(
    private readonly token: string,
    private readonly model: string
  ) {}

  async detect(frame: CameraFramePayload): Promise<VisionResult> {
    const response = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/octet-stream"
      },
      body: imageToBuffer(frame.image)
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Vision provider failed (${response.status}): ${message}`);
    }

    const predictions = (await response.json()) as HuggingFacePrediction[];
    const detections = Array.isArray(predictions)
      ? predictions.flatMap((prediction, index) => toDetection(prediction, index))
      : [];

    return {
      detections,
      sourceWidth: frame.sourceWidth,
      sourceHeight: frame.sourceHeight,
      processedAt: new Date().toISOString()
    };
  }
}

function toDetection(prediction: HuggingFacePrediction, index: number): MobilityDetection[] {
  const label = prediction.label ?? "";
  const mobilityType = classifyMobilityLabel(label);
  const box = prediction.box;

  if (!mobilityType || !box) {
    return [];
  }

  const x = Number(box.xmin ?? 0);
  const y = Number(box.ymin ?? 0);
  const width = Number(box.xmax ?? x) - x;
  const height = Number(box.ymax ?? y) - y;

  return [
    {
      id: `hf-${Date.now()}-${index}`,
      label,
      mobilityType,
      confidence: Number(prediction.score ?? 0),
      box: {
        x,
        y,
        width: Math.max(width, 1),
        height: Math.max(height, 1)
      }
    }
  ];
}

function imageToBuffer(image: string) {
  const base64 = image.includes(",") ? image.split(",").at(-1) : image;
  return Buffer.from(base64 ?? "", "base64");
}
