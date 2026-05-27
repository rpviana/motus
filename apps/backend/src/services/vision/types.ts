import type { CameraFramePayload, VisionResult } from "@motus/shared";

export type VisionProvider = {
  detect(frame: CameraFramePayload): Promise<VisionResult>;
};
