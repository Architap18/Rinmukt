'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import {
  Mic,
  MicOff,
  Square,
  RotateCcw,
  CheckCircle,
  X,
  AlertCircle,
  Keyboard,
} from 'lucide-react';

interface VoiceInputProps {
  /** Called when the user accepts a transcript (voice or typed). */
  onTranscriptAccepted: (text: string) => void;
  /** Called when the user fully cancels the voice flow. */
  onCancel: () => void;
}

export function VoiceInput({ onTranscriptAccepted, onCancel }: VoiceInputProps) {
  const { t, language } = useLanguage();
  const { state, transcript, error, isSupported, startRecording, stopRecording, reset } =
    useVoiceInput();

  const [fallbackText, setFallbackText] = useState('');
  const [showFallback, setShowFallback] = useState(false);

  // Auto-show fallback if browser doesn't support speech API
  useEffect(() => {
    if (state === 'unsupported' || !isSupported) {
      setShowFallback(true);
    }
  }, [state, isSupported]);

  const handleStart = () => {
    reset();
    setShowFallback(false);
    startRecording(language);
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleUseThis = () => {
    const text = (showFallback ? fallbackText : transcript).trim();
    if (text) {
      onTranscriptAccepted(text);
    }
  };

  const handleRecordAgain = () => {
    reset();
    setShowFallback(false);
    setFallbackText('');
  };

  const handleCancel = () => {
    reset();
    setShowFallback(false);
    setFallbackText('');
    onCancel();
  };

  // ─── Determine error message ────────────────────────────────────────────────
  const getErrorMessage = () => {
    if (error === 'permission-denied') return t('voicePermissionDenied');
    if (error === 'no-speech') return t('voiceEmptyTranscript');
    return t('voiceError');
  };

  // ─── States ────────────────────────────────────────────────────────────────

  const isRecording = state === 'recording';
  const isRequestingPermission = state === 'requesting-permission';
  const isProcessing = state === 'processing';
  const hasTranscript = state === 'transcript';
  const hasError = state === 'error';
  const isIdle = state === 'idle';

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-border px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">
            {t('voiceInputTitle')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('voiceInputSubtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Close voice input"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* ─── IDLE: Start recording or fallback ─── */}
        {(isIdle || state === 'unsupported') && !showFallback && (
          <div className="flex flex-col items-center gap-4 py-4">
            {isSupported ? (
              <>
                <button
                  type="button"
                  onClick={handleStart}
                  className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg shadow-amber-600/30 hover:bg-amber-700 hover:scale-105 transition-all duration-200"
                  aria-label={t('voiceStartLabel')}
                >
                  <Mic className="w-9 h-9" />
                  <span className="absolute inset-0 rounded-full border-4 border-amber-400/50 scale-110 group-hover:scale-125 transition-transform duration-300"></span>
                </button>
                <p className="text-sm font-semibold text-foreground">{t('voiceStartLabel')}</p>
                <button
                  type="button"
                  onClick={() => setShowFallback(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  {t('voiceOrType')}
                </button>
              </>
            ) : (
              // Browser not supported — go straight to fallback
              <FallbackTextInput
                value={fallbackText}
                onChange={setFallbackText}
                label={t('voiceFallbackLabel')}
                placeholder={t('voiceFallbackPlaceholder')}
                notSupportedMsg={t('voiceNotSupported')}
                onUseThis={handleUseThis}
                onCancel={handleCancel}
                useThisLabel={t('voiceUseThis')}
                cancelLabel={t('voiceCancel')}
              />
            )}
          </div>
        )}

        {/* ─── FALLBACK TEXT INPUT (supported but user chose to type) ─── */}
        {isSupported && showFallback && !isRecording && !isRequestingPermission && !isProcessing && !hasTranscript && !hasError && (
          <FallbackTextInput
            value={fallbackText}
            onChange={setFallbackText}
            label={t('voiceFallbackLabel')}
            placeholder={t('voiceFallbackPlaceholder')}
            onUseThis={handleUseThis}
            onCancel={handleCancel}
            useThisLabel={t('voiceUseThis')}
            cancelLabel={t('voiceCancel')}
            onSwitchToVoice={() => { setShowFallback(false); setFallbackText(''); }}
          />
        )}

        {/* ─── REQUESTING PERMISSION ─── */}
        {isRequestingPermission && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              <Mic className="w-8 h-8 text-amber-600 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Requesting microphone permission…</p>
          </div>
        )}

        {/* ─── RECORDING ─── */}
        {isRecording && (
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Animated mic + ripple rings */}
            <div className="relative flex items-center justify-center">
              <span className="absolute h-24 w-24 rounded-full bg-red-500/10 animate-ping"></span>
              <span className="absolute h-20 w-20 rounded-full bg-red-500/15 animate-ping [animation-delay:150ms]"></span>
              <div className="relative z-10 h-16 w-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Mic className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Listening label with dot indicator */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-sm font-semibold text-foreground">{t('voiceListening')}</span>
            </div>

            {/* Live interim transcript preview */}
            {transcript && (
              <div className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-sm text-muted-foreground italic max-h-24 overflow-y-auto text-center">
                {transcript}
              </div>
            )}

            {/* Stop button */}
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Square className="w-4 h-4 fill-white" />
              {t('voiceStop')}
            </button>
          </div>
        )}

        {/* ─── PROCESSING ─── */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-12 w-12 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin"></div>
            <p className="text-sm text-muted-foreground">Processing…</p>
          </div>
        )}

        {/* ─── TRANSCRIPT ─── */}
        {hasTranscript && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('voiceTranscriptLabel')}
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-foreground leading-relaxed max-h-40 overflow-y-auto">
              {transcript}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleUseThis}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                {t('voiceUseThis')}
              </button>
              <button
                type="button"
                onClick={handleRecordAgain}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/70 text-foreground font-semibold text-sm border border-border transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {t('voiceRecordAgain')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted font-semibold text-sm transition-all"
              >
                {t('voiceCancel')}
              </button>
            </div>
          </div>
        )}

        {/* ─── ERROR ─── */}
        {hasError && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{getErrorMessage()}</p>
            </div>

            {/* If permission denied, don't show "try again" mic button */}
            {error !== 'permission-denied' ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('voiceRecordAgain')}
                </button>
                <button
                  type="button"
                  onClick={() => { reset(); setShowFallback(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground font-semibold text-sm transition-all"
                >
                  <Keyboard className="w-4 h-4" />
                  {t('voiceOrType')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted text-sm font-semibold transition-all"
                >
                  {t('voiceCancel')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { reset(); setShowFallback(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground font-semibold text-sm transition-all"
                >
                  <Keyboard className="w-4 h-4" />
                  {t('voiceOrType')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted text-sm font-semibold transition-all"
                >
                  {t('voiceCancel')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fallback text-input sub-component ──────────────────────────────────────

interface FallbackTextInputProps {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
  notSupportedMsg?: string;
  onUseThis: () => void;
  onCancel: () => void;
  useThisLabel: string;
  cancelLabel: string;
  onSwitchToVoice?: () => void;
}

function FallbackTextInput({
  value,
  onChange,
  label,
  placeholder,
  notSupportedMsg,
  onUseThis,
  onCancel,
  useThisLabel,
  cancelLabel,
  onSwitchToVoice,
}: FallbackTextInputProps) {
  return (
    <div className="space-y-3 w-full">
      {notSupportedMsg && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
          <MicOff className="w-4 h-4 shrink-0 mt-0.5" />
          {notSupportedMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </label>
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none transition-all"
          autoFocus
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onUseThis}
          disabled={!value.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm transition-all"
        >
          <CheckCircle className="w-4 h-4" />
          {useThisLabel}
        </button>

        {onSwitchToVoice && (
          <button
            type="button"
            onClick={onSwitchToVoice}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground font-semibold text-sm transition-all"
          >
            <Mic className="w-4 h-4 text-amber-600" />
            Use Mic
          </button>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted text-sm font-semibold transition-all"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
