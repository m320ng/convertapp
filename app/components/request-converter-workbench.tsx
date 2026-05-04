'use client';

import { useMemo, useState } from 'react';

import { CopyResultAction } from '@/app/components/copy-result-action';
import {
  convertCodeToCurl,
  type CodeToCurlInputLanguage,
  type CodeToCurlResult,
} from '@/app/lib/code-to-curl';
import {
  generateCodeFromCurl,
  type CurlToCodeLanguage,
  type CurlToCodeResult,
} from '@/app/lib/curl-to-code';
import {
  getDefaultLanguageForDirection,
  getRequestConverterDirections,
  getRequestConverterLanguageOptions,
  type RequestConverterDirection,
} from '@/app/lib/request-converter-ui';

const CURL_SAMPLE = String.raw`curl -X POST "https://api.example.com/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"name":"홍길동","role":"admin"}' \
  --location --compressed`;

const CODE_SAMPLES: Record<CodeToCurlInputLanguage, string> = {
  'javascript-fetch': `await fetch("https://api.example.com/users?active=true", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ name: "홍길동", role: "admin" })
});`,
  'python-requests': `requests.post(
  "https://api.example.com/search",
  params={"q": "convert app", "page": 2},
  headers={"X-Api-Key": "YOUR_API_KEY"},
  json={"enabled": True, "count": 3},
  timeout=15,
  allow_redirects=False,
)`,
  http: `PUT /tasks/1 HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{"done":true}`,
};

type RequestConverterResult =
  | { direction: 'curl-to-code'; value: CurlToCodeResult }
  | { direction: 'code-to-curl'; value: CodeToCurlResult };

export function RequestConverterWorkbench({
  initialDirection = 'curl-to-code',
}: {
  initialDirection?: RequestConverterDirection;
}) {
  const directions = useMemo(() => getRequestConverterDirections(), []);
  const [direction, setDirection] = useState<RequestConverterDirection>(initialDirection);
  const [curlLanguage, setCurlLanguage] = useState<CurlToCodeLanguage>(
    getDefaultLanguageForDirection('curl-to-code'),
  );
  const [codeLanguage, setCodeLanguage] = useState<CodeToCurlInputLanguage>(
    getDefaultLanguageForDirection('code-to-curl'),
  );
  const [input, setInput] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const [includeTimeout, setIncludeTimeout] = useState(true);
  const [includeComments, setIncludeComments] = useState(false);
  const [includeAsyncWrapper, setIncludeAsyncWrapper] = useState(false);
  const [redactSensitiveValues, setRedactSensitiveValues] = useState(true);
  const [multiline, setMultiline] = useState(true);
  const [followRedirects, setFollowRedirects] = useState(false);
  const [includeCompressed, setIncludeCompressed] = useState(false);
  const [result, setResult] = useState<RequestConverterResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeDirection = directions.find((item) => item.id === direction) ?? directions[0];
  const languageOptions = getRequestConverterLanguageOptions(direction);
  const selectedLanguage = direction === 'curl-to-code' ? curlLanguage : codeLanguage;
  const output = getOutput(result);
  const summary = result?.value.summary ?? '입력을 변환하면 결과가 여기에 표시됩니다.';

  const clearTransientState = () => {
    setResult(null);
    setError(null);
  };

  const handleDirectionChange = (nextDirection: RequestConverterDirection) => {
    setDirection(nextDirection);
    setInput('');
    clearTransientState();
  };

  const handleConvert = (value = input) => {
    try {
      if (direction === 'curl-to-code') {
        setResult({
          direction,
          value: generateCodeFromCurl(value, {
            language: curlLanguage,
            indentSize,
            includeTimeout,
            timeoutSeconds,
            includeComments,
            includeAsyncWrapper,
            redactSensitiveValues,
          }),
        });
      } else {
        setResult({
          direction,
          value: convertCodeToCurl(value, {
            language: codeLanguage,
            multiline,
            followRedirects,
            includeCompressed,
            includeTimeout,
            redactSensitiveValues,
          }),
        });
      }

      setError(null);
    } catch (conversionError) {
      setResult(null);
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : '요청 변환 중 오류가 발생했습니다.',
      );
    }
  };

  const handleSample = () => {
    const nextInput = direction === 'curl-to-code' ? CURL_SAMPLE : CODE_SAMPLES[codeLanguage];
    setInput(nextInput);
    handleConvert(nextInput);
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-7">
          <p className="text-sm font-bold text-blue-700">브라우저 로컬 변환</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                API 요청 변환기
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                curl과 요청 코드 사이를 양방향으로 변환합니다. 입력값, 토큰, 결과는 브라우저에서만 처리되며 저장하지 않습니다.
              </p>
            </div>
            <div className="w-fit max-w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              {activeDirection.label}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,440px)_1fr]">
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">변환 방향</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {directions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleDirectionChange(item.id)}
                    className={`rounded-lg border px-3 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      direction === item.id
                        ? 'border-blue-300 bg-blue-50 text-blue-950'
                        : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs font-medium text-slate-500">{item.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">{activeDirection.inputLabel}</h2>
                  <p className="mt-1 text-sm text-slate-500">샘플 또는 직접 입력한 값은 저장되지 않습니다.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSample}
                  className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  샘플 입력
                </button>
              </div>

              <textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  clearTransientState();
                }}
                placeholder={
                  direction === 'curl-to-code'
                    ? 'curl -X POST "https://api.example.com" -H "Content-Type: application/json" -d \'{"ok":true}\''
                    : 'await fetch("https://api.example.com/users", { method: "POST", body: JSON.stringify({ ok: true }) })'
                }
                spellCheck={false}
                className="mt-5 h-72 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                aria-label={activeDirection.inputLabel}
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleConvert()}
                  className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  변환 실행
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput('');
                    clearTransientState();
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  지우기
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">언어와 옵션</h2>

              <fieldset className="mt-5">
                <legend className="text-sm font-semibold text-slate-700">
                  {direction === 'curl-to-code' ? '대상 언어' : '입력 형식'}
                </legend>
                <div className="mt-3 grid gap-2">
                  {languageOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (direction === 'curl-to-code') {
                          setCurlLanguage(item.id as CurlToCodeLanguage);
                        } else {
                          setCodeLanguage(item.id as CodeToCurlInputLanguage);
                        }
                        clearTransientState();
                      }}
                      className={`rounded-lg border px-3 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                        selectedLanguage === item.id
                          ? 'border-blue-300 bg-blue-50 text-blue-950'
                          : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-1 block text-xs font-medium text-slate-500">{item.description}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {direction === 'curl-to-code' ? (
                <CurlToCodeOptions
                  indentSize={indentSize}
                  timeoutSeconds={timeoutSeconds}
                  includeTimeout={includeTimeout}
                  includeComments={includeComments}
                  includeAsyncWrapper={includeAsyncWrapper}
                  redactSensitiveValues={redactSensitiveValues}
                  onIndentSizeChange={(value) => {
                    setIndentSize(value);
                    clearTransientState();
                  }}
                  onTimeoutSecondsChange={(value) => {
                    setTimeoutSeconds(value);
                    clearTransientState();
                  }}
                  onIncludeTimeoutChange={(value) => {
                    setIncludeTimeout(value);
                    clearTransientState();
                  }}
                  onIncludeCommentsChange={(value) => {
                    setIncludeComments(value);
                    clearTransientState();
                  }}
                  onIncludeAsyncWrapperChange={(value) => {
                    setIncludeAsyncWrapper(value);
                    clearTransientState();
                  }}
                  onRedactSensitiveValuesChange={(value) => {
                    setRedactSensitiveValues(value);
                    clearTransientState();
                  }}
                />
              ) : (
                <CodeToCurlOptions
                  multiline={multiline}
                  followRedirects={followRedirects}
                  includeCompressed={includeCompressed}
                  includeTimeout={includeTimeout}
                  redactSensitiveValues={redactSensitiveValues}
                  onMultilineChange={(value) => {
                    setMultiline(value);
                    clearTransientState();
                  }}
                  onFollowRedirectsChange={(value) => {
                    setFollowRedirects(value);
                    clearTransientState();
                  }}
                  onIncludeCompressedChange={(value) => {
                    setIncludeCompressed(value);
                    clearTransientState();
                  }}
                  onIncludeTimeoutChange={(value) => {
                    setIncludeTimeout(value);
                    clearTransientState();
                  }}
                  onRedactSensitiveValuesChange={(value) => {
                    setRedactSensitiveValues(value);
                    clearTransientState();
                  }}
                />
              )}
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">{activeDirection.outputLabel}</h2>
                <p className="mt-1 text-sm text-slate-500">{summary}</p>
              </div>
              <CopyResultAction
                value={output}
                label="결과 복사"
                copiedMessage={`${activeDirection.outputLabel}를 복사했습니다.`}
                emptyMessage="복사할 변환 결과가 없습니다."
                disabled={!output}
                className="w-full rounded-lg border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-45 sm:w-fit"
              />
            </div>

            <div className="space-y-4 p-5">
              {result?.value.warnings.length ? (
                <div className="space-y-2">
                  {result.value.warnings.map((warning) => (
                    <div
                      key={warning}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
                    >
                      {warning}
                    </div>
                  ))}
                </div>
              ) : null}

              {!output ? (
                <div className="grid min-h-96 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                  변환 결과는 브라우저에만 표시되며 자동 저장되지 않습니다.
                </div>
              ) : (
                <section className="result-output overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
                    <h3 className="min-w-0 text-sm font-bold text-slate-100">{result?.value.languageLabel}</h3>
                    <CopyResultAction
                      value={output}
                      label="복사"
                      copiedMessage={`${activeDirection.outputLabel}를 복사했습니다.`}
                      emptyMessage="복사할 변환 결과가 없습니다."
                      className="w-full rounded-md border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-100 hover:bg-slate-700 sm:w-fit"
                    />
                  </div>
                  <pre className="result-output max-h-[680px] overflow-auto p-4 text-sm leading-6 text-slate-100">
                    <code className="font-mono">{output}</code>
                  </pre>
                </section>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function CurlToCodeOptions({
  indentSize,
  timeoutSeconds,
  includeTimeout,
  includeComments,
  includeAsyncWrapper,
  redactSensitiveValues,
  onIndentSizeChange,
  onTimeoutSecondsChange,
  onIncludeTimeoutChange,
  onIncludeCommentsChange,
  onIncludeAsyncWrapperChange,
  onRedactSensitiveValuesChange,
}: {
  indentSize: number;
  timeoutSeconds: number;
  includeTimeout: boolean;
  includeComments: boolean;
  includeAsyncWrapper: boolean;
  redactSensitiveValues: boolean;
  onIndentSizeChange: (value: number) => void;
  onTimeoutSecondsChange: (value: number) => void;
  onIncludeTimeoutChange: (value: boolean) => void;
  onIncludeCommentsChange: (value: boolean) => void;
  onIncludeAsyncWrapperChange: (value: boolean) => void;
  onRedactSensitiveValuesChange: (value: boolean) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <label className="block space-y-2">
        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
          들여쓰기
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{indentSize}칸</span>
        </span>
        <input
          type="range"
          min={2}
          max={8}
          step={2}
          value={indentSize}
          onChange={(event) => onIndentSizeChange(Number(event.target.value))}
          className="w-full accent-blue-600"
        />
      </label>

      <label className="block space-y-2">
        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
          타임아웃
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{timeoutSeconds}초</span>
        </span>
        <input
          type="number"
          min={1}
          max={600}
          value={timeoutSeconds}
          onChange={(event) => onTimeoutSecondsChange(Number(event.target.value))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <OptionCheckbox checked={includeTimeout} label="타임아웃 코드 포함" onChange={onIncludeTimeoutChange} />
      <OptionCheckbox checked={redactSensitiveValues} label="Authorization, Cookie, API Key 헤더를 자리표시자로 대체" onChange={onRedactSensitiveValuesChange} />
      <OptionCheckbox checked={includeComments} label="주의 주석 포함" onChange={onIncludeCommentsChange} />
      <OptionCheckbox checked={includeAsyncWrapper} label="JavaScript 출력에 async 함수 래퍼 포함" onChange={onIncludeAsyncWrapperChange} />
    </div>
  );
}

function CodeToCurlOptions({
  multiline,
  followRedirects,
  includeCompressed,
  includeTimeout,
  redactSensitiveValues,
  onMultilineChange,
  onFollowRedirectsChange,
  onIncludeCompressedChange,
  onIncludeTimeoutChange,
  onRedactSensitiveValuesChange,
}: {
  multiline: boolean;
  followRedirects: boolean;
  includeCompressed: boolean;
  includeTimeout: boolean;
  redactSensitiveValues: boolean;
  onMultilineChange: (value: boolean) => void;
  onFollowRedirectsChange: (value: boolean) => void;
  onIncludeCompressedChange: (value: boolean) => void;
  onIncludeTimeoutChange: (value: boolean) => void;
  onRedactSensitiveValuesChange: (value: boolean) => void;
}) {
  return (
    <div className="mt-6 space-y-3">
      <OptionCheckbox checked={multiline} label="여러 줄 curl로 출력" onChange={onMultilineChange} />
      <OptionCheckbox checked={redactSensitiveValues} label="Authorization, Cookie, API Key 헤더를 자리표시자로 대체" onChange={onRedactSensitiveValuesChange} />
      <OptionCheckbox checked={followRedirects} label="--location 옵션 포함" onChange={onFollowRedirectsChange} />
      <OptionCheckbox checked={includeCompressed} label="--compressed 옵션 포함" onChange={onIncludeCompressedChange} />
      <OptionCheckbox checked={includeTimeout} label="Python requests timeout을 --max-time으로 반영" onChange={onIncludeTimeoutChange} />
    </div>
  );
}

function OptionCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
      />
      <span className="min-w-0 break-keep leading-5">{label}</span>
    </label>
  );
}

function getOutput(result: RequestConverterResult | null) {
  if (!result) {
    return '';
  }

  return result.direction === 'curl-to-code' ? result.value.code : result.value.command;
}
