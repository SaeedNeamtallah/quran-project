type AlarmController = {
  prime: () => Promise<void>;
  play: () => void;
};

let controller: AlarmController | null = null;

export function registerAlarmController(nextController: AlarmController) {
  controller = nextController;
}

export async function primeGlobalAlarm() {
  if (!controller) return;
  await controller.prime();
}

export function playGlobalAlarm() {
  controller?.play();
}
