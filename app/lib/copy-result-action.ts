export type CopyResultFeedbackStatus = 'idle' | 'success' | 'error';

export interface CopyResultFeedback {
  status: CopyResultFeedbackStatus;
  message: string | null;
}

export type CopyResultPayload =
  | {
      ok: true;
      text: string;
    }
  | {
      ok: false;
      feedback: CopyResultFeedback;
    };

export const COPY_RESULT_SUCCESS_MESSAGE = '결과를 클립보드에 복사했습니다.';
export const COPY_RESULT_ERROR_MESSAGE =
  '클립보드에 복사하지 못했습니다. 브라우저 권한을 확인해주세요.';
export const COPY_RESULT_EMPTY_MESSAGE = '복사할 결과가 없습니다.';

export function hasCopyResultValue(
  value: string | null | undefined | (() => string | null | undefined),
): boolean {
  if (typeof value === 'function') {
    return true;
  }

  return Boolean(value);
}

export function getCopyResultFeedback(
  status: Exclude<CopyResultFeedbackStatus, 'idle'>,
  message?: string,
): CopyResultFeedback {
  return {
    status,
    message:
      message ??
      (status === 'success' ? COPY_RESULT_SUCCESS_MESSAGE : COPY_RESULT_ERROR_MESSAGE),
  };
}

export function getCopyResultPayload(
  value: string | null | undefined,
  emptyMessage = COPY_RESULT_EMPTY_MESSAGE,
): CopyResultPayload {
  if (typeof value !== 'string' || value.length === 0) {
    return {
      ok: false,
      feedback: getCopyResultFeedback('error', emptyMessage),
    };
  }

  return {
    ok: true,
    text: value,
  };
}
