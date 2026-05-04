'use client';

import { useMemo, useState } from 'react';

import { CopyResultAction } from '@/app/components/copy-result-action';
import {
  formatRandomTokenResults,
  generateRandomTokens,
  getRandomTokenCharacterPool,
  type RandomTokenCopyFormat,
  type RandomTokenCharacterSets,
} from '@/app/lib/random-token';

const DEFAULT_CHARACTER_SETS: RandomTokenCharacterSets = {
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: false,
};

const CHARACTER_SET_OPTIONS = [
  { id: 'lowercase', label: '소문자', sample: 'a-z' },
  { id: 'uppercase', label: '대문자', sample: 'A-Z' },
  { id: 'numbers', label: '숫자', sample: '0-9' },
  { id: 'symbols', label: '기호', sample: '!@#' },
] satisfies Array<{
  id: keyof RandomTokenCharacterSets;
  label: string;
  sample: string;
}>;

const TOKEN_PRESETS = [
  {
    id: 'api',
    label: 'API 키',
    description: '32자, 영문/숫자',
    length: 32,
    quantity: 5,
    characterSets: DEFAULT_CHARACTER_SETS,
    excludeAmbiguous: true,
  },
  {
    id: 'secret',
    label: '강한 시크릿',
    description: '64자, 기호 포함',
    length: 64,
    quantity: 3,
    characterSets: {
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true,
    },
    excludeAmbiguous: true,
  },
  {
    id: 'numeric',
    label: '숫자 코드',
    description: '6자리, 숫자만',
    length: 6,
    quantity: 10,
    characterSets: {
      lowercase: false,
      uppercase: false,
      numbers: true,
      symbols: false,
    },
    excludeAmbiguous: false,
  },
] satisfies Array<{
  id: string;
  label: string;
  description: string;
  length: number;
  quantity: number;
  characterSets: RandomTokenCharacterSets;
  excludeAmbiguous: boolean;
}>;

const OUTPUT_ACTIONS = [
  { format: 'newline', label: '줄바꿈 복사', message: '줄바꿈 형식으로 복사했습니다.' },
  { format: 'json', label: 'JSON 복사', message: 'JSON 배열로 복사했습니다.' },
  { format: 'env', label: '.env 복사', message: '.env 형식으로 복사했습니다.' },
  { format: 'csv', label: 'CSV 복사', message: 'CSV 형식으로 복사했습니다.' },
] satisfies Array<{
  format: RandomTokenCopyFormat;
  label: string;
  message: string;
}>;

export default function RandomTokenGenerator() {
  const [length, setLength] = useState(32);
  const [quantity, setQuantity] = useState(5);
  const [characterSets, setCharacterSets] = useState(DEFAULT_CHARACTER_SETS);
  const [excludeCharacters, setExcludeCharacters] = useState('');
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [tokens, setTokens] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const availableCharacterCount = useMemo(
    () =>
      getRandomTokenCharacterPool(characterSets, {
        excludeCharacters,
        excludeAmbiguous,
      }).length,
    [characterSets, excludeAmbiguous, excludeCharacters],
  );

  const handleCharacterSetChange = (id: keyof RandomTokenCharacterSets) => {
    setCharacterSets((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const applyPreset = (preset: (typeof TOKEN_PRESETS)[number]) => {
    setLength(preset.length);
    setQuantity(preset.quantity);
    setCharacterSets(preset.characterSets);
    setExcludeAmbiguous(preset.excludeAmbiguous);
    setExcludeCharacters('');
    setError(null);
  };

  const handleGenerate = () => {
    try {
      const nextTokens = generateRandomTokens({
        length,
        quantity,
        characterSets,
        excludeCharacters,
        excludeAmbiguous,
      });

      setTokens(nextTokens);
      setError(null);
    } catch (generationError) {
      setTokens([]);
      setError(
        generationError instanceof Error
          ? generationError.message
          : '토큰을 생성하는 중 오류가 발생했습니다.',
      );
    }
  };

  const handleClear = () => {
    setTokens([]);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-7">
          <p className="text-sm font-bold text-blue-700">브라우저 로컬 생성</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Random Token 생성기
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                API 키 샘플, 테스트 시크릿, 임시 식별자에 사용할 무작위 토큰을 로컬에서 생성합니다.
              </p>
            </div>
            <div className="w-fit max-w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              사용 가능 문자 {availableCharacterCount}개
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">생성 옵션</h2>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-slate-700">빠른 프리셋</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                {TOKEN_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    <span className="block text-sm font-semibold text-slate-900">{preset.label}</span>
                    <span className="mt-1 block text-xs font-medium text-slate-500">{preset.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <label className="space-y-2">
                <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  토큰 길이
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                    {length}자
                  </span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={128}
                  value={Math.min(length, 128)}
                  onChange={(event) => setLength(Number(event.target.value))}
                  className="w-full accent-blue-600"
                />
                <input
                  type="number"
                  min={1}
                  max={4096}
                  value={length}
                  onChange={(event) => setLength(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-2">
                <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  생성 개수
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                    {quantity}개
                  </span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="w-full accent-blue-600"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-slate-700">문자 집합</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {CHARACTER_SET_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700"
                  >
                    <span className="min-w-0">
                      {option.label}
                      <span className="ml-2 text-xs text-slate-500">{option.sample}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={characterSets[option.id]}
                      onChange={() => handleCharacterSetChange(option.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-6 block space-y-2">
              <span className="text-sm font-semibold text-slate-700">제외할 문자</span>
              <input
                type="text"
                value={excludeCharacters}
                onChange={(event) => setExcludeCharacters(event.target.value)}
                placeholder="예: 0OIl{}[]"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <span className="block text-xs font-medium leading-5 text-slate-500">
                제외 목록은 저장하지 않고 현재 브라우저 메모리에서만 적용합니다.
              </span>
            </label>

            <label className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
              <span>헷갈리는 문자 제외</span>
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(event) => setExcludeAmbiguous(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
            </label>

            <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto] lg:grid-cols-1">
              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
              >
                토큰 생성
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={tokens.length === 0 && !error}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                결과 지우기
              </button>
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
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">생성 결과</h2>
                <p className="mt-1 text-sm text-slate-500">결과는 브라우저 메모리에만 표시됩니다.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={tokens.length === 0}
                  onClick={handleGenerate}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 sm:w-fit"
                >
                  다시 생성
                </button>
                {OUTPUT_ACTIONS.map((action) => (
                  <CopyResultAction
                    key={action.format}
                    value={() => formatRandomTokenResults(tokens, action.format)}
                    label={action.label}
                    copiedMessage={action.message}
                    emptyMessage="복사할 토큰이 없습니다."
                    disabled={tokens.length === 0}
                    className="w-full rounded-lg border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-45 sm:w-fit"
                  />
                ))}
              </div>
            </div>

            <div className="p-5">
              {tokens.length === 0 ? (
                <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                  옵션을 선택한 뒤 토큰을 생성하세요.
                </div>
              ) : (
                <div className="result-output space-y-3">
                  <div className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900 sm:grid-cols-3">
                    <span>생성됨: {tokens.length}개</span>
                    <span>길이: {tokens[0]?.length ?? 0}자</span>
                    <span>저장 안 함</span>
                  </div>
                  {tokens.map((token, index) => (
                    <div
                      key={`${token}-${index}`}
                      className="grid min-w-0 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    >
                      <code className="min-w-0 break-all rounded-md bg-white px-3 py-2 font-mono text-sm text-slate-800 ring-1 ring-slate-200">
                        {token}
                      </code>
                      <CopyResultAction
                        value={token}
                        label="복사"
                        copiedMessage={`${index + 1}번 토큰을 복사했습니다.`}
                        emptyMessage="복사할 토큰이 없습니다."
                        className="w-full rounded-md border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-100 sm:w-fit"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
