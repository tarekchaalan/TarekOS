const SOUNDS = {
  startup: "/assets/sounds/Windows Logon Sound.wav",
  shutdown: "/assets/sounds/Windows Logoff Sound.wav",
  error: "/assets/sounds/Windows Error.wav",
  notify: "/assets/sounds/Windows Notify.wav",
  click: "/assets/sounds/Windows Navigation Start.wav",
  recycle: "/assets/sounds/Windows Recycle.wav",
  minimize: "/assets/sounds/Windows Minimize.wav",
  ding: "/assets/sounds/Windows Ding.wav",
  exclaim: "/assets/sounds/Windows Exclamation.wav",
} as const;

let muted = false;

export function playSound(name: keyof typeof SOUNDS) {
  if (muted) return;
  try {
    const audio = new Audio(SOUNDS[name]);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {
    // Ignore — audio not supported or blocked
  }
}

export function setMuted(m: boolean) {
  muted = m;
}

export function isMuted(): boolean {
  return muted;
}
