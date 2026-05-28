import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearElevatorCallSchedule, elevatorCallDelayMs, scheduleElevatorCall } from './elevatorCallScheduler.js';

afterEach(() => {
  clearElevatorCallSchedule();
  vi.useRealTimers();
});

describe('elevatorCallScheduler', () => {
  it('runs the callback after 6 seconds', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    scheduleElevatorCall(callback);

    vi.advanceTimersByTime(elevatorCallDelayMs - 1);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('replaces a pending callback when scheduled again', () => {
    vi.useFakeTimers();

    const first = vi.fn();
    const second = vi.fn();

    scheduleElevatorCall(first);
    scheduleElevatorCall(second);

    vi.advanceTimersByTime(elevatorCallDelayMs);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
