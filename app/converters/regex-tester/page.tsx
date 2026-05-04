'use client';

import { useMemo, useState } from 'react';

import { CopyResultAction } from '@/app/components/copy-result-action';
import {
  regexFlagOptions,
  safeTestRegex,
  type RegexFlags,
  type RegexTestResult,
} from '@/app/lib/regex-tester';

const flagLabels: Array<{
  key: keyof RegexFlags;
  value: string;
  label: string;
  description: string;
}> = [
  {
    key: 'global',
    value: 'g',
    label: 'Global',
    description: '전체 일치 항목 찾기',
  },
  {
    key: 'ignoreCase',
    value: 'i',
    label: 'Ignore case',
    description: '대소문자 무시',
  },
  {
    key: 'multiline',
    value: 'm',
    label: 'Multiline',
    description: '^와 $를 각 줄에 적용',
  },
  {
    key: 'dotAll',
    value: 's',
    label: 'Dot all',
    description: '.이 줄바꿈까지 포함',
  },
  {
    key: 'unicode',
    value: 'u',
    label: 'Unicode',
    description: '유니코드 모드',
  },
  {
    key: 'sticky',
    value: 'y',
    label: 'Sticky',
    description: 'lastIndex 위치 고정 매칭',
  },
];

const samplePattern = '(?<protocol>https?)://(?<host>[^\\s/]+)';
const sampleText = 'https://convertapp.dev\nhttp://localhost:3000/tools';

function formatResultForCopy(result: RegexTestResult): string {
  if (!result.hasMatch) {
    return `flags: ${result.flags || '(none)'}\n일치 항목이 없습니다.`;
  }

  return [
    `flags: ${result.flags || '(none)'}`,
    `matches: ${result.matches.length}`,
    ...result.matches.map((match, index) => {
      const groups = match.groups.length > 0
        ? `\n  groups: ${match.groups.map((group) => group || '(empty)').join(', ')}`
        : '';

      return `${index + 1}. [${match.index}-${match.endIndex}] ${match.value}${groups}`;
    }),
  ].join('\n');
}

function buildHighlightedSegments(text: string, result: RegexTestResult) {
  if (!text || result.matches.length === 0) {
    return [{ type: 'plain' as const, value: text, index: 0, endIndex: text.length }];
  }

  const segments: Array<{
    type: 'plain' | 'match';
    value: string;
    index: number;
    endIndex: number;
  }> = [];
  let cursor = 0;

  result.matches.forEach((match) => {
    if (cursor < match.index) {
      segments.push({
        type: 'plain',
        value: text.slice(cursor, match.index),
        index: cursor,
        endIndex: match.index,
      });
    }

    segments.push({
      type: 'match',
      value: match.value || '(empty match)',
      index: match.index,
      endIndex: match.endIndex,
    });
    cursor = Math.max(cursor, match.endIndex);
  });

  if (cursor < text.length) {
    segments.push({
      type: 'plain',
      value: text.slice(cursor),
      index: cursor,
      endIndex: text.length,
    });
  }

  return segments;
}

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('');
  const [testText, setTestText] = useState('');
  const [flags, setFlags] = useState<RegexFlags>(regexFlagOptions);
  const [result, setResult] = useState<RegexTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeFlags = useMemo(
    () =>
      flagLabels
        .filter((flag) => flags[flag.key])
        .map((flag) => flag.value)
        .join(''),
    [flags],
  );

  const highlightedSegments = useMemo(
    () => (result ? buildHighlightedSegments(testText, result) : []),
    [result, testText],
  );

  const handleFlagChange = (flagName: keyof RegexFlags) => {
    setFlags((currentFlags) => ({
      ...currentFlags,
      [flagName]: !currentFlags[flagName],
    }));
    setResult(null);
    setError(null);
  };

  const handleTest = () => {
    const nextOutcome = safeTestRegex({
      pattern,
      text: testText,
      flags,
    });

    if (nextOutcome.ok) {
      setResult(nextOutcome.result);
      setError(null);
      return;
    }

    setResult(null);
    setError(nextOutcome.error);
  };

  const handleSample = () => {
    setPattern(samplePattern);
    setTestText(sampleText);
    setFlags({
      ...regexFlagOptions,
      global: true,
      ignoreCase: true,
    });
    setResult(null);
    setError(null);
  };

  const handleClear = () => {
    setPattern('');
    setTestText('');
    setFlags(regexFlagOptions);
    setResult(null);
    setError(null);
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-7">
          <p className="text-sm font-bold text-blue-700">브라우저 로컬 정규식 검사</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Regex 테스트
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                패턴, 테스트 텍스트, 플래그를 한 화면에서 조정하고 일치 항목과 위치를 확인합니다.
                입력값은 브라우저에서만 처리되며 저장하지 않습니다.
              </p>
            </div>
            <div className="min-w-0 max-w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-slate-600">
              <span className="block max-w-full truncate">/{pattern || 'pattern'}/{activeFlags}</span>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">입력</h2>
                <p className="mt-1 text-sm text-slate-500">슬래시 없이 패턴만 입력하세요.</p>
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

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">정규식 패턴</span>
              <input
                value={pattern}
                onChange={(event) => {
                  setPattern(event.target.value);
                  setResult(null);
                  setError(null);
                }}
                placeholder="예: \\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b"
                spellCheck={false}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">테스트 텍스트</span>
              <textarea
                value={testText}
                onChange={(event) => {
                  setTestText(event.target.value);
                  setResult(null);
                  setError(null);
                }}
                placeholder="정규식으로 검사할 텍스트를 입력하세요."
                spellCheck={false}
                className="h-72 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div>
              <h3 className="text-sm font-semibold text-slate-700">Regex flags</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {flagLabels.map((flag) => (
                  <label
                    key={flag.key}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <input
                      type="checkbox"
                      checked={flags[flag.key]}
                      onChange={() => handleFlagChange(flag.key)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800">
                        {flag.value} · {flag.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                        {flag.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleTest}
              className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
            >
              정규식 테스트
            </button>
          </div>

          <div className="min-w-0 space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">결과</h2>
                <p className="mt-1 text-sm text-slate-500">
                  일치 항목, 시작 위치, 캡처 그룹을 확인합니다.
                </p>
              </div>
              <CopyResultAction
                value={() => (result ? formatResultForCopy(result) : '')}
                label="결과 복사"
                copiedMessage="테스트 결과를 클립보드에 복사했습니다."
                emptyMessage="복사할 테스트 결과가 없습니다."
                disabled={!result}
                className="w-full rounded-lg border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-fit"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {!result && !error && (
              <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-medium leading-6 text-slate-500">
                  패턴과 테스트 텍스트를 입력한 뒤 정규식 테스트를 실행하세요.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Flags</p>
                    <p className="mt-2 font-mono text-lg font-semibold text-slate-950">
                      {result.flags || '(none)'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Matches</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{result.matches.length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {result.hasMatch ? '일치' : '불일치'}
                    </p>
                  </div>
                </div>

                {result.matches.length > 0 ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-950">Matched segments</h3>
                        <span className="text-xs font-semibold text-blue-700">
                          {result.matches.length}개 일치
                        </span>
                      </div>
                      <div className="result-output mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-blue-100 bg-white p-3 font-mono text-sm leading-7 text-slate-700">
                        {highlightedSegments.map((segment, index) =>
                          segment.type === 'match' ? (
                            <mark
                              key={`${segment.index}-${segment.endIndex}-${index}`}
                              className="rounded bg-blue-200 px-1 py-0.5 font-semibold text-blue-950"
                              title={`${segment.index}-${segment.endIndex}`}
                            >
                              {segment.value}
                            </mark>
                          ) : (
                            <span key={`${segment.index}-${segment.endIndex}-${index}`}>
                              {segment.value}
                            </span>
                          ),
                        )}
                      </div>
                    </div>

                    {result.matches.map((match, index) => (
                      <article
                        key={`${match.index}-${index}`}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="min-w-0 text-sm font-semibold text-slate-950">Match {index + 1}</h3>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {match.index}-{match.endIndex}
                          </span>
                        </div>
                        <pre className="result-output mt-3 max-h-36 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-sm leading-6 text-slate-50">
                          {match.value}
                        </pre>
                        {match.groups.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Capture groups
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {match.groups.map((group, groupIndex) => (
                                <span
                                  key={`${groupIndex}-${group}`}
                                  className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700"
                                >
                                  ${groupIndex + 1}: {group || '(empty)'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-600">
                    일치하는 텍스트가 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
