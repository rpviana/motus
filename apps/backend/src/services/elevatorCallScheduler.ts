export const elevatorCallDelayMs = 6000;

let pendingElevatorTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleElevatorCall(callback: () => void) {
  if (pendingElevatorTimer) {
    clearTimeout(pendingElevatorTimer);
  }

  pendingElevatorTimer = setTimeout(() => {
    pendingElevatorTimer = null;
    callback();
  }, elevatorCallDelayMs);
}

export function clearElevatorCallSchedule() {
  if (pendingElevatorTimer) {
    clearTimeout(pendingElevatorTimer);
    pendingElevatorTimer = null;
  }
}
