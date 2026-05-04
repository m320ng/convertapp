'use client';

import { useEffect, useState } from 'react';

import {
  COPY_RESULT_ERROR_MESSAGE,
  COPY_RESULT_SUCCESS_MESSAGE,
  CopyResultFeedback,
  getCopyResultFeedback,
  getCopyResultPayload,
  hasCopyResultValue,
} from '@/app/lib/copy-result-action';

interface CopyResultActionProps {
  value: string | null | undefined | (() => string | null | undefined);
  label?: string;
  copiedMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
}

const IDLE_FEEDBACK: CopyResultFeedback = {
  status: 'idle',
  message: null,
};

export function CopyResultAction({
  value,
  label = '결과 복사',
  copiedMessage = COPY_RESULT_SUCCESS_MESSAGE,
  emptyMessage,
  errorMessage = COPY_RESULT_ERROR_MESSAGE,
  disabled = false,
  className = '',
}: CopyResultActionProps) {
  const [feedback, setFeedback] = useState<CopyResultFeedback>(IDLE_FEEDBACK);

  useEffect(() => {
    if (feedback.status === 'idle') return;

    const timeout = window.setTimeout(() => {
      setFeedback(IDLE_FEEDBACK);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [feedback.status, feedback.message]);

  const handleCopy = async () => {
    const nextValue = typeof value === 'function' ? value() : value;
    const payload = getCopyResultPayload(nextValue, emptyMessage);

    if (!payload.ok) {
      setFeedback(payload.feedback);
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is not available.');
      }

      await navigator.clipboard.writeText(payload.text);
      setFeedback(getCopyResultFeedback('success', copiedMessage));
    } catch {
      setFeedback(getCopyResultFeedback('error', errorMessage));
    }
  };

  const feedbackColor =
    feedback.status === 'success'
      ? 'text-emerald-700'
      : feedback.status === 'error'
        ? 'text-red-600'
        : 'text-transparent';

  return (
    <div className="inline-flex w-full min-w-0 max-w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
      <button
        type="button"
        onClick={handleCopy}
        disabled={disabled || !hasCopyResultValue(value)}
        className={`min-w-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {label}
      </button>
      <p className={`min-h-5 max-w-full break-keep text-xs leading-5 ${feedbackColor}`} role="status" aria-live="polite">
        {feedback.message ?? ''}
      </p>
    </div>
  );
}
