'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Pause, Play, RotateCcw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Language } from '@/lib/translations';

interface VoiceExplanationPlayerProps {
  text: string;
  language: Language;
  title?: string;
  isHighConfidence?: boolean;
  hasAssumptions?: boolean;
  assumptionNotes?: string[];
  className?: string;
}

const LANG_CODE_MAP: Record<Language, string[]> = {
  en: ['en-IN', 'en-GB', 'en-US', 'en'],
  hinglish: ['en-IN', 'hi-IN', 'en-US', 'en'],
  hi: ['hi-IN', 'hi'],
  mr: ['mr-IN', 'mr', 'hi-IN'],
  bn: ['bn-IN', 'bn-BD', 'bn', 'hi-IN'],
  pa: ['pa-IN', 'pa', 'hi-IN'],
  gu: ['gu-IN', 'gu', 'hi-IN'],
};

export function VoiceExplanationPlayer({
  text,
  language,
  title,
  isHighConfidence = true,
  hasAssumptions = false,
  assumptionNotes,
  className = '',
}: VoiceExplanationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      setIsSupported(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Pick best available voice for language
    const voices = window.speechSynthesis.getVoices();
    const targetCodes = LANG_CODE_MAP[language] || ['en-IN', 'en'];

    let selectedVoice: SpeechSynthesisVoice | null = null;
    for (const code of targetCodes) {
      const match = voices.find((v) => v.lang.toLowerCase().startsWith(code.toLowerCase()));
      if (match) {
        selectedVoice = match;
        break;
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      setVoiceNotice(null);
    } else {
      utterance.lang = targetCodes[0];
      if (language !== 'en' && language !== 'hinglish') {
        setVoiceNotice('Using default voice (browser lacks regional language voice pack).');
      }
    }

    utterance.rate = 0.95; // Steady, calm pacing

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <div className={`rounded-3xl bg-card p-5 sm:p-6 border border-border shadow-md space-y-4 ${className}`}>
      {/* Header & Confidence Tag */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-foreground">
            {title || 'Plain Language Explanation'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasAssumptions ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              Includes an Assumption
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Based on Confirmed Details
            </span>
          )}
        </div>
      </div>

      {/* Explanation Text */}
      <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
        {text}
      </p>

      {/* Assumption Details Note */}
      {hasAssumptions && assumptionNotes && assumptionNotes.length > 0 && (
        <div className="text-xs text-muted-foreground italic border-l-2 border-amber-500/50 pl-3 py-1 mt-1">
          {assumptionNotes.join(' ')}
        </div>
      )}

      {/* Audio Controls */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          {isSupported ? (
            <>
              {!isPlaying ? (
                <button
                  type="button"
                  onClick={handlePlay}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all min-h-[44px]"
                  aria-label="Explain this to me aloud"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isPaused ? 'Resume Voice' : 'Listen to Explanation'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors animate-pulse min-h-[44px]"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Audio</span>
                </button>
              )}

              {(isPlaying || isPaused) && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Stop audio"
                  aria-label="Stop audio"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground font-medium">Voice playback not supported in this browser</span>
          )}
        </div>

        {voiceNotice && (
          <span className="text-[11px] text-muted-foreground font-medium">{voiceNotice}</span>
        )}
      </div>
    </div>
  );
}
