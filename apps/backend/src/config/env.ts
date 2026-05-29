import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true, quiet: true });

function readNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readRequired(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export const env = {
  port: readNumber("PORT", 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  roboflowApiKey: readRequired("ROBOFLOW_API_KEY"),
  roboflowModelUrl:
    process.env.ROBOFLOW_MODEL_URL ?? "https://serverless.roboflow.com/motus-accessibility/2",
  frameProcessIntervalMs: readNumber("FRAME_PROCESS_INTERVAL_MS", 1200)
};
