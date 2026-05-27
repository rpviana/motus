import type { MobilityDetection, VisionResult } from "@motus/shared";
import type { VisionProvider } from "./types.js";

let frameIndex = 0;

export class MockVisionProvider implements VisionProvider {
  async detect(frame: { sourceWidth: number; sourceHeight: number }): Promise<VisionResult> {
    frameIndex += 1;

    const sourceWidth = Math.max(frame.sourceWidth, 640);
    const sourceHeight = Math.max(frame.sourceHeight, 360);
    const phase = frameIndex % 8;
    const x = phase < 4 ? sourceWidth * 0.16 : sourceWidth * 0.58;

    const detection: MobilityDetection = {
      id: `mock-${frameIndex}`,
      label: "wheelchair",
      confidence: 0.92,
      mobilityType: "wheelchair",
      box: {
        x,
        y: sourceHeight * 0.34,
        width: sourceWidth * 0.16,
        height: sourceHeight * 0.42
      }
    };

    return {
      detections: [detection],
      sourceWidth,
      sourceHeight,
      processedAt: new Date().toISOString()
    };
  }
}
