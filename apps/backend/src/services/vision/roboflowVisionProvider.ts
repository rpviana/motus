import type { CameraFramePayload, MobilityDetection, VisionResult } from "@motus/shared";
import { classifyMobilityLabel } from "../mobilityLabels.js";

type RoboflowPrediction = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  confidence?: number;
  class?: string;
  class_id?: number;
  detection_id?: string;
};

type RoboflowResponse = {
  predictions?: RoboflowPrediction[];
  image?: {
    width?: number;
    height?: number;
  };
};

export class RoboflowVisionProvider {
  constructor(
    private readonly modelUrl: string,
    private readonly apiKey: string
  ) {}

  async detect(frame: CameraFramePayload): Promise<VisionResult> {
    const response = await fetch(`${this.modelUrl}?api_key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: imageToBase64(frame.image)
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Roboflow provider failed (${response.status}): ${message}`);
    }

    const payload = (await response.json()) as RoboflowResponse;
    const sourceWidth = payload.image?.width ?? frame.sourceWidth;
    const sourceHeight = payload.image?.height ?? frame.sourceHeight;

    return {
      detections: (payload.predictions ?? []).flatMap((prediction, index) =>
        toDetection(prediction, index)
      ),
      sourceWidth,
      sourceHeight,
      processedAt: new Date().toISOString()
    };
  }
}

function toDetection(prediction: RoboflowPrediction, index: number): MobilityDetection[] {
  const label = prediction.class ?? "";
  const mobilityType = classifyMobilityLabel(label);
  const centerX = Number(prediction.x ?? 0);
  const centerY = Number(prediction.y ?? 0);
  const width = Number(prediction.width ?? 0);
  const height = Number(prediction.height ?? 0);

  if (!mobilityType || width <= 0 || height <= 0) {
    return [];
  }

  return [
    {
      id: prediction.detection_id ?? `roboflow-${Date.now()}-${index}`,
      label,
      mobilityType,
      confidence: Number(prediction.confidence ?? 0),
      box: {
        x: centerX - width / 2,
        y: centerY - height / 2,
        width,
        height
      }
    }
  ];
}

function imageToBase64(image: string) {
  return image.includes(",") ? image.split(",").at(-1) ?? "" : image;
}
