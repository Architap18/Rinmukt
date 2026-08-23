'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceState =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'processing'
  | 'transcript'
  | 'error'
  | 'unsupported';

export interface UseVoiceInputReturn {
  state: VoiceState;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startRecording: (lang?: string) => void;
  stopRecording: () => void;
  reset: () => void;
}

/**
 * Maps app language codes to BCP-47 language tags for Web Speech API.
 */
const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

// Minimal type shim so TypeScript is happy without @types/webspeech
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const interimRef = useRef('');
  // Track state in a ref so onend closure can read the latest value
  const stateRef = useRef<VoiceState>('idle');

  const syncState = (s: VoiceState) => {
    stateRef.current = s;
    setState(s);
  };

  useEffect(() => {
    setIsSupported(!!getSpeechRecognition());
    return () => {
      try { recognitionRef.current?.abort(); } catch (_) {}
    };
  }, []);

  const startRecording = useCallback((lang = 'en') => {
    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) {
      syncState('unsupported');
      return;
    }

    syncState('requesting-permission');
    setTranscript('');
    setError(null);
    interimRef.current = '';

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = LANG_MAP[lang] ?? 'en-IN';

      recognition.onstart = () => {
        syncState('recording');
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalChunk += result[0].transcript;
          } else {
            interimChunk += result[0].transcript;
          }
        }

        if (finalChunk) {
          interimRef.current = interimRef.current + finalChunk;
        }
        setTranscript(interimRef.current + interimChunk);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          syncState('error');
          setError('permission-denied');
        } else if (event.error === 'no-speech') {
          syncState('error');
          setError('no-speech');
        } else if (event.error === 'aborted') {
          // User explicitly stopped — not a real error
        } else {
          syncState('error');
          setError('general');
        }
      };

      recognition.onend = () => {
        const finalText = interimRef.current.trim();
        if (finalText) {
          setTranscript(finalText);
          syncState('transcript');
        } else if (stateRef.current !== 'error') {
          syncState('error');
          setError('no-speech');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (_err) {
      syncState('error');
      setError('general');
    }
  }, []);

  const stopRecording = useCallback(() => {
    syncState('processing');
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
  }, []);

  const reset = useCallback(() => {
    try { recognitionRef.current?.abort(); } catch (_) {}
    recognitionRef.current = null;
    interimRef.current = '';
    setTranscript('');
    setError(null);
    syncState('idle');
  }, []);

  return { state, transcript, error, isSupported, startRecording, stopRecording, reset };
}
