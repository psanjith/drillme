export type RecognitionState = "idle" | "listening" | "processing" | "error";

interface RecognitionOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onStateChange: (state: RecognitionState) => void;
  onError: (error: string) => void;
}

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    SpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

export class SpeechRecognitionManager {
  private recognition: BrowserSpeechRecognition | null = null;
  private options: RecognitionOptions;
  private finalTranscript = "";
  private listening = false; // user intent: should we be recording?
  private active = false;    // is the browser engine actually running right now?

  constructor(options: RecognitionOptions) {
    this.options = options;
    this.init();
  }

  private init() {
    if (typeof window === "undefined") return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      this.options.onError("Speech recognition not supported in this browser");
      return;
    }

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      let interim = "";
      this.finalTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          this.finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      const combined = (this.finalTranscript + interim).trim();
      this.options.onTranscript(combined, false);
    };

    this.recognition.onerror = (event) => {
      if (event.error === "no-speech") return;
      this.listening = false;
      this.active = false;
      this.options.onStateChange("error");
      this.options.onError(`Recognition error: ${event.error}`);
    };

    // Chrome stops recognition after silence — restart automatically if still meant to be listening
    this.recognition.onend = () => {
      this.active = false;
      if (this.listening) {
        try {
          this.active = true;
          this.recognition?.start();
        } catch {
          this.listening = false;
          this.active = false;
          this.options.onStateChange("idle");
        }
      } else {
        this.options.onStateChange("idle");
      }
    };
  }

  start() {
    if (!this.recognition) {
      this.options.onError("Speech recognition not available");
      return;
    }
    if (this.active) return; // already running, don't call start() again
    this.finalTranscript = "";
    this.listening = true;
    this.active = true;
    this.recognition.start();
    this.options.onStateChange("listening");
  }

  stop(): string {
    this.listening = false;
    this.active = false;
    if (this.recognition) {
      this.recognition.stop();
    }
    this.options.onStateChange("processing");
    return this.finalTranscript.trim();
  }

  getFinalTranscript(): string {
    return this.finalTranscript.trim();
  }

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}
