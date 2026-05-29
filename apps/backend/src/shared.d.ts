declare module "@motus/shared" {
  export type MobilityType =
    | "wheelchair"
    | "crutches"
    | "walker"
    | "cane"
    | "mobility_scooter"
    | "unknown";

  export type RoiZone = "ENTRY" | "ELEVATOR_PATH";

  export type HardwareCommand = "OPEN_DOOR" | "CALL_ELEVATOR";

  export type BoundingBox = {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  export type MobilityDetection = {
    id: string;
    label: string;
    confidence: number;
    box: BoundingBox;
    mobilityType: MobilityType;
    zone?: RoiZone;
  };

  export type CameraFramePayload = {
    image: string;
    capturedAt: string;
    sourceWidth: number;
    sourceHeight: number;
  };

  export type VisionResult = {
    detections: MobilityDetection[];
    sourceWidth: number;
    sourceHeight: number;
    processedAt: string;
  };

  export type MobilityEventLog = {
    id: string;
    event: string;
    mobilityType?: MobilityType | null;
    zone?: RoiZone | null;
    command?: HardwareCommand | null;
    confidence?: number | null;
    createdAt: string;
  };

  export type HardwareCommandPayload = {
    command: HardwareCommand;
    reason: string;
    createdAt: string;
  };
}