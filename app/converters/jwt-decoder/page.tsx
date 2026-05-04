'use client';

import { useMemo, useState } from 'react';

import { CopyResultAction } from '@/app/components/copy-result-action';
import { decodeJwt, validateJwt, type DecodedJwt } from '@/app/lib/jwt-decoder';
import {
  buildJwtPayloadFromClaims,
  generateJwt,
  supportedJwtAlgorithms,
  type JwtStandardClaimsInput,
  type SupportedJwtAlgorithm,
} from '@/app/lib/jwt-generator';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuyZuOuPmeq4uCIsImlhdCI6MTUxNjIzOTAyMn0.' +
  'TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';
const DEFAULT_HEADER_JSON = '{\n  "typ": "JWT"\n}';
const DEFAULT_PAYLOAD_JSON = '{\n  "sub": "1234567890",\n  "name": "외동길",\n  "iat": 1710000000\n}';
const EMPTY_STANDARD_CLAIMS: JwtStandardClaimsInput = {
  issuer: '',
  subject: '',
  audience: '',
  issuedAt: '',
  expiration: '',
  notBefore: '',
};

function formatDecodedJwtForCopy(decodedJwt: DecodedJwt): string {
  return [
    'Header',
    decodedJwt.headerJson,
    '',
    'Payload',
    decodedJwt.payloadJson,
    '',
    'Signature',
    decodedJwt.signature || '(서명 없음)',
  ].join('\n');
}

export default function JwtDecoderPage() {
  const [token, setToken] = useState('');
  const [decodedJwt, setDecodedJwt] = useState<DecodedJwt | null>(null);
  const [algorithm, setAlgorithm] = useState<SupportedJwtAlgorithm>('HS256');
  const [headerJson, setHeaderJson] = useState(DEFAULT_HEADER_JSON);
  const [payloadJson, setPayloadJson] = useState(DEFAULT_PAYLOAD_JSON);
  const [standardClaims, setStandardClaims] =
    useState<JwtStandardClaimsInput>(EMPTY_STANDARD_CLAIMS);
  const [customClaimsJson, setCustomClaimsJson] = useState('{\n  "scope": "read:tools"\n}');
  const [signingKey, setSigningKey] = useState('');
  const [validationSecret, setValidationSecret] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const tokenSections = useMemo(() => token.trim().split('.'), [token]);
  const hasToken = token.trim().length > 0;
  const usesRsaKey = algorithm.startsWith('RS');

  const updateStandardClaim = (claim: keyof JwtStandardClaimsInput, value: string) => {
    setStandardClaims((currentClaims) => ({
      ...currentClaims,
      [claim]: value,
    }));
    setGeneratedToken('');
    setError(null);
    setCopyMessage(null);
  };

  const setUnixTimestampClaim = (claim: keyof JwtStandardClaimsInput, offsetSeconds = 0) => {
    updateStandardClaim(claim, String(Math.floor(Date.now() / 1000) + offsetSeconds));
  };

  const handleDecode = (value = token) => {
    try {
      const decoded = decodeJwt(value);

      setDecodedJwt(decoded);
      setError(null);
      setCopyMessage(null);
    } catch (decodeError) {
      setDecodedJwt(null);
      setCopyMessage(null);
      setError(
        decodeError instanceof Error
          ? decodeError.message
          : 'JWT를 디코딩하는 중 오류가 발생했습니다.',
      );
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);

    try {
      const validatedJwt = await validateJwt(token, {
        secret: validationSecret,
      });

      setDecodedJwt(validatedJwt);
      setError(null);
      setCopyMessage('JWT 서명과 시간 클레임이 유효합니다.');
    } catch (validationError) {
      setDecodedJwt(null);
      setCopyMessage(null);
      setError(
        validationError instanceof Error
          ? validationError.message
          : 'JWT를 검증하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const payload = buildJwtPayloadFromClaims({
        basePayloadJson: payloadJson,
        standardClaims,
        customClaimsJson,
      });
      const normalizedPayloadJson = JSON.stringify(payload, null, 2);
      const signedToken = await generateJwt({
        algorithm,
        headerJson,
        payloadJson: normalizedPayloadJson,
        key: signingKey,
      });

      setPayloadJson(normalizedPayloadJson);
      setGeneratedToken(signedToken);
      setToken(signedToken);
      setDecodedJwt(decodeJwt(signedToken));
      setError(null);
      setCopyMessage('JWT를 생성했습니다.');
    } catch (generateError) {
      setGeneratedToken('');
      setDecodedJwt(null);
      setCopyMessage(null);
      setError(
        generateError instanceof Error
          ? generateError.message
          : 'JWT를 생성하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setToken('');
    setDecodedJwt(null);
    setGeneratedToken('');
    setValidationSecret('');
    setError(null);
    setCopyMessage(null);
  };

  const handleSample = () => {
    setToken(SAMPLE_JWT);
    handleDecode(SAMPLE_JWT);
  };

  const handleGeneratorSample = () => {
    setAlgorithm('HS256');
    setHeaderJson('{\n  "typ": "JWT",\n  "kid": "local-demo"\n}');
    setPayloadJson(DEFAULT_PAYLOAD_JSON);
    setStandardClaims({
      issuer: 'convertapp.local',
      subject: 'user-1234567890',
      audience: 'developer-tools',
      issuedAt: '1710000000',
      expiration: '1710003600',
      notBefore: '1709999900',
    });
    setCustomClaimsJson('{\n  "scope": ["read:tools", "write:tokens"],\n  "plan": "local-demo"\n}');
    setSigningKey('convertapp-demo-secret');
    setGeneratedToken('');
    setError(null);
    setCopyMessage(null);
  };

  const handleClearGenerator = () => {
    setHeaderJson(DEFAULT_HEADER_JSON);
    setPayloadJson(DEFAULT_PAYLOAD_JSON);
    setStandardClaims(EMPTY_STANDARD_CLAIMS);
    setCustomClaimsJson('{\n  "scope": "read:tools"\n}');
    setSigningKey('');
    setGeneratedToken('');
    setError(null);
    setCopyMessage(null);
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-7">
          <p className="text-sm font-bold text-purple-700">브라우저 로컬 JWT 작업</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                JWT 디코더 / 생성기
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                JWT를 브라우저에서만 디코딩하고, editable header/payload JSON과 secret 또는
                PKCS#8 private key로 서명된 토큰을 생성합니다. 입력값은 저장하거나 서버로
                전송하지 않습니다.
              </p>
            </div>
            <div className="w-fit max-w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              {hasToken ? `${tokenSections.length}개 구역 감지` : '토큰 대기 중'}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">JWT 생성기</h2>
              <p className="mt-1 text-sm text-slate-500">
                HS 계열은 secret, RS 계열은 PKCS#8 private key PEM으로 서명합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGeneratorSample}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                샘플 입력
              </button>
              <button
                type="button"
                onClick={handleClearGenerator}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                생성값 지우기
              </button>
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <div className="space-y-5">
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">고급 클레임 옵션</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      표준 클레임과 custom claims를 payload에 병합한 뒤 브라우저에서 서명합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUnixTimestampClaim('issuedAt')}
                    className="w-fit rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    iat 현재값
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <ClaimInput
                    label="Issuer (iss)"
                    value={standardClaims.issuer ?? ''}
                    onChange={(value) => updateStandardClaim('issuer', value)}
                    placeholder="https://issuer.example"
                  />
                  <ClaimInput
                    label="Subject (sub)"
                    value={standardClaims.subject ?? ''}
                    onChange={(value) => updateStandardClaim('subject', value)}
                    placeholder="user-123"
                  />
                  <ClaimInput
                    label="Audience (aud)"
                    value={standardClaims.audience ?? ''}
                    onChange={(value) => updateStandardClaim('audience', value)}
                    placeholder="api-client"
                  />
                  <ClaimInput
                    label="Issued at (iat)"
                    value={standardClaims.issuedAt ?? ''}
                    onChange={(value) => updateStandardClaim('issuedAt', value)}
                    placeholder="1710000000"
                    inputMode="numeric"
                  />
                  <ClaimInput
                    label="Expiration (exp)"
                    value={standardClaims.expiration ?? ''}
                    onChange={(value) => updateStandardClaim('expiration', value)}
                    placeholder="1710003600"
                    inputMode="numeric"
                  />
                  <ClaimInput
                    label="Not before (nbf)"
                    value={standardClaims.notBefore ?? ''}
                    onChange={(value) => updateStandardClaim('notBefore', value)}
                    placeholder="1709999900"
                    inputMode="numeric"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setUnixTimestampClaim('expiration', 3600)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    exp +1시간
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnixTimestampClaim('notBefore')}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    nbf 현재값
                  </button>
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Header JSON</span>
                  <textarea
                    value={headerJson}
                    onChange={(event) => {
                      setHeaderJson(event.target.value);
                      setGeneratedToken('');
                      setError(null);
                      setCopyMessage(null);
                    }}
                    spellCheck={false}
                    className="h-56 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Base Payload JSON</span>
                  <textarea
                    value={payloadJson}
                    onChange={(event) => {
                      setPayloadJson(event.target.value);
                      setGeneratedToken('');
                      setError(null);
                      setCopyMessage(null);
                    }}
                    spellCheck={false}
                    className="h-56 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Custom Claims JSON</span>
                <textarea
                  value={customClaimsJson}
                  onChange={(event) => {
                    setCustomClaimsJson(event.target.value);
                    setGeneratedToken('');
                    setError(null);
                    setCopyMessage(null);
                  }}
                  spellCheck={false}
                  className="h-32 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />
              </label>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">서명 알고리즘</span>
                <select
                  value={algorithm}
                  onChange={(event) => {
                    setAlgorithm(event.target.value as SupportedJwtAlgorithm);
                    setGeneratedToken('');
                    setError(null);
                    setCopyMessage(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                >
                  {supportedJwtAlgorithms.map((supportedAlgorithm) => (
                    <option key={supportedAlgorithm} value={supportedAlgorithm}>
                      {supportedAlgorithm}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  {usesRsaKey ? 'Private key PEM' : 'Secret'}
                </span>
                <textarea
                  value={signingKey}
                  onChange={(event) => {
                    setSigningKey(event.target.value);
                    setGeneratedToken('');
                    setError(null);
                    setCopyMessage(null);
                  }}
                  placeholder={
                    usesRsaKey
                      ? '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
                      : '서명에 사용할 secret을 입력하세요.'
                  }
                  spellCheck={false}
                  className="h-32 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />
              </label>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-wait disabled:opacity-60"
              >
                {isGenerating ? 'JWT 생성 중...' : '서명된 JWT 생성'}
              </button>

              <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="min-w-0 text-sm font-semibold text-slate-800">생성 결과</h3>
                  <CopyResultAction
                    value={generatedToken}
                    label="복사"
                    copiedMessage="생성된 JWT를 복사했습니다."
                    emptyMessage="복사할 생성 결과가 없습니다."
                    disabled={!generatedToken}
                    className="w-full rounded-md border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-45 sm:w-fit"
                  />
                </div>
                <pre className="result-output mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-white p-3 text-xs leading-5 text-slate-700 ring-1 ring-slate-200">
                  <code className="font-mono">
                    {generatedToken || 'JWT를 생성하면 서명된 토큰이 여기에 표시됩니다.'}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">토큰 입력</h2>
                <p className="mt-1 text-sm text-slate-500">
                  구조 디코딩과 HS 계열 secret 서명 검증을 브라우저에서 처리합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSample}
                className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                샘플 입력
              </button>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-semibold text-slate-700">JWT 문자열</span>
              <textarea
                value={token}
                onChange={(event) => {
                  setToken(event.target.value);
                  setDecodedJwt(null);
                  setError(null);
                  setCopyMessage(null);
                }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                spellCheck={false}
                className="h-56 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleDecode()}
                className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
              >
                JWT 디코딩
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                지우기
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">서명 검증 Secret</span>
                <textarea
                  value={validationSecret}
                  onChange={(event) => {
                    setValidationSecret(event.target.value);
                    setError(null);
                    setCopyMessage(null);
                  }}
                  placeholder="HS256, HS384, HS512 토큰 검증에 사용할 secret"
                  spellCheck={false}
                  className="h-24 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />
              </label>
              <button
                type="button"
                onClick={handleValidate}
                disabled={isValidating}
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-wait disabled:opacity-60"
              >
                {isValidating ? 'JWT 검증 중...' : '서명 및 시간 클레임 검증'}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {copyMessage && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {copyMessage}
              </div>
            )}

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">구역 미리보기</h3>
              <div className="mt-3 space-y-2 text-xs font-medium text-slate-500">
                {['header', 'payload', 'signature'].map((label, index) => (
                  <div key={label} className="rounded-md bg-white px-3 py-2 ring-1 ring-slate-200">
                    <span className="font-semibold text-slate-700">{label}</span>
                    <span className="ml-2 break-all font-mono">
                      {tokenSections[index] || '비어 있음'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">디코딩 결과</h2>
                <p className="mt-1 text-sm text-slate-500">Header와 payload는 읽기 쉬운 JSON으로 표시됩니다.</p>
              </div>
              <CopyResultAction
                value={() => (decodedJwt ? formatDecodedJwtForCopy(decodedJwt) : '')}
                label="전체 복사"
                copiedMessage="전체 결과를 복사했습니다."
                emptyMessage="복사할 디코딩 결과가 없습니다."
                disabled={!decodedJwt}
                className="w-full rounded-lg border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-45 sm:w-fit"
              />
            </div>

            <div className="space-y-4 p-5">
              {!decodedJwt ? (
                <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                  JWT를 입력하고 디코딩하면 결과가 여기에 표시됩니다.
                </div>
              ) : (
                <>
                  <JwtResultPanel
                    title="Header"
                    value={decodedJwt.headerJson}
                    copiedMessage="Header JSON을 복사했습니다."
                  />
                  <JwtResultPanel
                    title="Payload"
                    value={decodedJwt.payloadJson}
                    copiedMessage="Payload JSON을 복사했습니다."
                  />
                  <JwtResultPanel
                    title="Signature"
                    value={decodedJwt.signature || '(서명 없음)'}
                    copiedMessage="Signature를 복사했습니다."
                  />
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ClaimInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: 'numeric';
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
      />
    </label>
  );
}

function JwtResultPanel({
  title,
  value,
  copiedMessage,
}: {
  title: string;
  value: string;
  copiedMessage: string;
}) {
  return (
    <section className="result-output overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <h3 className="min-w-0 text-sm font-bold uppercase tracking-[0.12em] text-slate-600">{title}</h3>
        <CopyResultAction
          value={value}
          label="복사"
          copiedMessage={copiedMessage}
          emptyMessage={`복사할 ${title} 결과가 없습니다.`}
          className="w-full rounded-md border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 sm:w-fit"
        />
      </div>
      <pre className="result-output max-h-80 overflow-auto p-4 text-sm leading-6 text-slate-800">
        <code className="break-words font-mono">{value}</code>
      </pre>
    </section>
  );
}
