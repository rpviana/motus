import { describe, it, expect, vi } from 'vitest';
import { RoiTracker } from './roiTracker.js';

function makeResult(box: { x: number; y: number; width: number; height: number }) {
  return {
    detections: [
      {
        id: '1',
        label: 'person',
        confidence: 0.9,
        box,
        mobilityType: 'wheelchair'
      }
    ],
    sourceWidth: 100,
    sourceHeight: 100,
    processedAt: new Date().toISOString()
  } as any;
}

describe('RoiTracker', () => {
  it('triggers OPEN_DOOR for wheelchair or crutches above 75 percent confidence', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);

    const tracker = new RoiTracker();

    const accepted = tracker.evaluate({
      ...makeResult({ x: 80, y: 10, width: 10, height: 10 }),
      detections: [
        {
          id: '1',
          label: 'crutches',
          confidence: 0.8,
          box: { x: 80, y: 10, width: 10, height: 10 },
          mobilityType: 'crutches'
        }
      ]
    });

    expect(accepted.commands.length).toBe(1);
    expect(accepted.commands[0]?.command).toBe('OPEN_DOOR');
    expect(accepted.logs.some((l: any) => l.event === 'Detecao')).toBe(true);

    const rejectedLowConfidence = tracker.evaluate({
      ...makeResult({ x: 80, y: 10, width: 10, height: 10 }),
      detections: [
        {
          id: '2',
          label: 'wheelchair',
          confidence: 0.74,
          box: { x: 80, y: 10, width: 10, height: 10 },
          mobilityType: 'wheelchair'
        }
      ]
    });

    expect(rejectedLowConfidence.commands.length).toBe(0);

    const rejectedHumanLabel = tracker.evaluate({
      ...makeResult({ x: 80, y: 10, width: 10, height: 10 }),
      detections: [
        {
          id: '3',
          label: 'person',
          confidence: 0.95,
          box: { x: 80, y: 10, width: 10, height: 10 },
          mobilityType: null
        }
      ]
    });

    expect(rejectedHumanLabel.commands.length).toBe(0);

    vi.useRealTimers();
  });

  it('keeps the cooldown for repeated valid detections', () => {
    vi.useFakeTimers();
    vi.setSystemTime(2_000_000);

    const tracker = new RoiTracker();
    const box = { x: 80, y: 10, width: 10, height: 10 };
    const result = {
      ...makeResult(box),
      detections: [
        {
          id: '1',
          label: 'wheelchair',
          confidence: 0.9,
          box,
          mobilityType: 'wheelchair'
        }
      ]
    } as any;

    expect(tracker.evaluate(result).commands.length).toBe(1);

    vi.setSystemTime(2_000_000 + 15_001);
    expect(tracker.evaluate(result).commands.length).toBe(1);

    vi.useRealTimers();
  });
});
