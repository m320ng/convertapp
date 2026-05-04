'use client';

import { useMemo, useState } from 'react';

import { CopyResultAction } from '@/app/components/copy-result-action';
import {
  formatEnvValidationResult,
  getEnvIssueFeedback,
  parseEnvContent,
  type EnvValidationResult,
} from '@/app/lib/env-validator';

const sampleEnv = `# 브라우저에서만 검사됩니다.
APP_NAME="ConvertApp"
PUBLIC_API_URL=https://api.example.com/v1
FEATURE_FLAG=true
WELCOME_MESSAGE="hello\\nworld"
EMPTY_VALUE=`;

export default function EnvValidatorPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<EnvValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const issueCount = result?.issues.length ?? 0;
  const entryCount = result?.entries.length ?? 0;
  const hiddenValueSummary = useMemo(
    () => (result ? formatEnvValidationResult(result) : ''),
    [result],
  );

  const clearTransientState = () => {
    setResult(null);
    setError(null);
  };

  const handleValidate = (value = input) => {
    try {
      const nextResult = parseEnvContent(value);
      setResult(nextResult);
      setError(null);
    } catch (validationError) {
      setResult(null);
      setError(
        validationError instanceof Error
          ? validationError.message
          : '.env 내용을 검사하는 중 오류가 발생했습니다.',
      );
    }
  };

  const handleSample = () => {
    setInput(sampleEnv);
    handleValidate(sampleEnv);
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-7">
          <p className="text-sm font-bold text-zinc-700">브라우저 로컬 .env 검사</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                .env 검사기
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                변수 이름, 중복 키, 따옴표, 공백 포함 문자열, 이스케이프 문자를 검사합니다.
                입력한 값은 저장하지 않고 브라우저에서만 처리합니다.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 text-sm sm:w-auto sm:grid-cols-3">
              <StatusPill label="변수" value={`${entryCount}개`} />
              <StatusPill label="문제" value={`${issueCount}개`} />
              <StatusPill label="처리" value="Local" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,520px)_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">입력</h2>
                <p className="mt-1 text-sm text-slate-500">검사할 .env 내용을 붙여넣으세요.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSample}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  샘플
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  지우기
                </button>
              </div>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-semibold text-slate-700">.env 내용</span>
              <textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  clearTransientState();
                }}
                placeholder={'APP_NAME="ConvertApp"\\nAPI_URL=https://example.com'}
                spellCheck={false}
                className="h-[28rem] w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
              />
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleValidate()}
                className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
              >
                검사 실행
              </button>
              <CopyResultAction
                value={hiddenValueSummary}
                label="결과 복사"
                copiedMessage="검사 결과를 클립보드에 복사했습니다."
                emptyMessage="복사할 검사 결과가 없습니다."
                disabled={!result}
                className="w-full rounded-lg border-slate-200 px-4 py-3 font-semibold"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">검사 결과</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {result
                    ? result.valid
                      ? '문자열 관련 문제가 발견되지 않았습니다.'
                      : '수정이 필요한 항목을 확인하세요.'
                    : '검사를 실행하면 문제와 변수 요약이 표시됩니다.'}
                </p>
              </div>
              {result && (
                <span
                  className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                    result.valid
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {result.valid ? '통과' : '확인 필요'}
                </span>
              )}
            </div>

            <div className="space-y-5 p-5">
              {!result ? (
                <div className="grid min-h-96 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                  민감한 값은 서버로 전송되지 않으며 검사 결과 복사본에도 실제 값이 포함되지 않습니다.
                </div>
              ) : (
                <>
                  {result.issues.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-red-700">문제</h3>
                      <div className="mt-3 space-y-2">
                        {result.issues.map((issue) => {
                          const feedback = getEnvIssueFeedback(issue);

                          return (
                            <div
                              key={`${issue.line}-${issue.column}-${issue.code}-${issue.key ?? ''}`}
                              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-red-900">
                                    {feedback.title}
                                  </p>
                                  <p className="mt-1 text-sm leading-6 text-red-800">
                                    {feedback.message}
                                  </p>
                                </div>
                                <span className="w-fit rounded-md bg-white/80 px-2 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100">
                                  {feedback.location}
                                </span>
                              </div>
                              <p className="mt-3 rounded-md bg-white/70 px-3 py-2 text-sm font-medium leading-6 text-red-800">
                                {feedback.suggestion}
                              </p>
                              {issue.key && (
                                <p className="mt-2 text-xs font-semibold text-red-600">
                                  변수: <span className="font-mono">{issue.key}</span>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {result.entries.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Variables</h3>
                      <div className="result-output mt-3 overflow-x-auto rounded-lg border border-slate-200">
                        <div className="grid grid-cols-[minmax(0,1fr)_96px_96px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          <span>Key</span>
                          <span>문자열</span>
                          <span>형식</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {result.entries.map((entry) => (
                            <div
                              key={`${entry.line}-${entry.key}`}
                              className="grid grid-cols-[minmax(0,1fr)_96px_96px] gap-3 px-4 py-3 text-sm"
                            >
                              <span className="min-w-0 truncate font-mono font-semibold text-slate-950">
                                {entry.key}
                              </span>
                              <span className="font-medium text-slate-600">{entry.value.length}자</span>
                              <span className="font-medium text-slate-600">{formatQuote(entry.quote)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="result-output overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
                      <h3 className="min-w-0 text-sm font-bold text-slate-100">복사 미리보기</h3>
                      <CopyResultAction
                        value={hiddenValueSummary}
                        label="복사"
                        copiedMessage="검사 결과를 클립보드에 복사했습니다."
                        emptyMessage="복사할 검사 결과가 없습니다."
                        className="w-full border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 sm:w-fit"
                      />
                    </div>
                    <pre className="result-output max-h-72 overflow-auto p-4 text-sm leading-6 text-slate-100">
                      <code className="font-mono">{hiddenValueSummary}</code>
                    </pre>
                  </section>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="block text-xs font-semibold text-slate-500">{label}</span>
      <span className="mt-0.5 block font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function formatQuote(quote: 'none' | 'single' | 'double') {
  if (quote === 'single') return '작은따옴표';
  if (quote === 'double') return '큰따옴표';
  return '없음';
}
