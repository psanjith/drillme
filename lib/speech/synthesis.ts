import type { PanellistPersona } from "@/types";

const PANELLIST_VOICE_PREFS: Record<PanellistPersona, { pitch: number; rate: number; nameHints: string[] }> = {
  hiring_manager: {
    pitch: 1.05,
    rate: 0.92,
    nameHints: ["Samantha", "Karen", "Victoria", "Female", "en-US"],
  },
  senior_engineer: {
    pitch: 0.9,
    rate: 0.95,
    nameHints: ["Daniel", "David", "Alex", "Male", "en-GB"],
  },
  peer_engineer: {
    pitch: 1.0,
    rate: 1.0,
    nameHints: ["Google", "en-AU", "Moira", "Fiona"],
  },
};

let cachedVoices: SpeechSynthesisVoice[] = [];
const assignedVoices: Partial<Record<PanellistPersona, SpeechSynthesisVoice>> = {};
let currentOnEnd: (() => void) | null = null;
let keepaliveInterval: ReturnType<typeof setInterval> | null = null;

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve([]);

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      return resolve(voices);
    }

    // Timeout fallback — some browsers never fire onvoiceschanged
    const timeout = setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 3000);

    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout);
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
  });
}

function pickVoice(hints: string[]): SpeechSynthesisVoice | null {
  if (cachedVoices.length === 0) return null;

  for (const hint of hints) {
    const match = cachedVoices.find(
      (v) =>
        v.name.toLowerCase().includes(hint.toLowerCase()) ||
        v.lang.toLowerCase().includes(hint.toLowerCase())
    );
    if (match) return match;
  }

  return cachedVoices.find((v) => v.lang.startsWith("en")) || cachedVoices[0];
}

export function assignPanellistVoices(panellists: PanellistPersona[]) {
  const usedVoices = new Set<string>();

  for (const persona of panellists) {
    const prefs = PANELLIST_VOICE_PREFS[persona];
    let voice = pickVoice(prefs.nameHints);

    if (voice && usedVoices.has(voice.name)) {
      const alternatives = cachedVoices.filter((v) => !usedVoices.has(v.name) && v.lang.startsWith("en"));
      voice = alternatives[0] || voice;
    }

    if (voice) {
      assignedVoices[persona] = voice;
      usedVoices.add(voice.name);
    }
  }
}

function clearKeepalive() {
  if (keepaliveInterval) {
    clearInterval(keepaliveInterval);
    keepaliveInterval = null;
  }
}

export function speak(
  text: string,
  persona: PanellistPersona,
  onEnd?: () => void
): void {
  if (typeof window === "undefined") return;

  // Cancel any in-progress speech and fire its callback so callers don't get stuck
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  const prefs = PANELLIST_VOICE_PREFS[persona];

  const voice = assignedVoices[persona];
  if (voice) utterance.voice = voice;

  utterance.pitch = prefs.pitch;
  utterance.rate = prefs.rate;
  utterance.volume = 1;

  currentOnEnd = onEnd ?? null;

  utterance.onend = () => {
    clearKeepalive();
    const cb = currentOnEnd;
    currentOnEnd = null;
    cb?.();
  };

  utterance.onerror = (e) => {
    // "interrupted" fires when we cancel intentionally — don't treat as error
    if (e.error === "interrupted") return;
    clearKeepalive();
    const cb = currentOnEnd;
    currentOnEnd = null;
    cb?.();
  };

  window.speechSynthesis.speak(utterance);

  // Chrome silently stops TTS after ~15s — keepalive by pausing/resuming every 10s
  keepaliveInterval = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    } else {
      clearKeepalive();
    }
  }, 10000);
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  clearKeepalive();
  // Fire the pending callback before cancelling so isSpeaking resets
  const cb = currentOnEnd;
  currentOnEnd = null;
  window.speechSynthesis.cancel();
  cb?.();
}
