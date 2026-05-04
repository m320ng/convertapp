import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const developerUtilityFiles = [
  'app/components/copy-result-action.tsx',
  'app/components/request-converter-workbench.tsx',
  'app/converters/base64-converter/page.tsx',
  'app/converters/base64-to-image/page.tsx',
  'app/converters/code-to-curl/page.tsx',
  'app/converters/curl-to-code/page.tsx',
  'app/converters/env-validator/page.tsx',
  'app/converters/hash-generator/page.tsx',
  'app/converters/html-to-markdown/page.tsx',
  'app/converters/image-to-base64/page.tsx',
  'app/converters/ip-geolocation/page.tsx',
  'app/converters/js-beautifier/page.tsx',
  'app/converters/json-formatter/page.tsx',
  'app/converters/jwt-decoder/page.tsx',
  'app/converters/markdown-viewer/page.tsx',
  'app/converters/regex-tester/page.tsx',
  'app/converters/random-token-generator/page.tsx',
  'app/converters/sql-formatter/page.tsx',
  'app/converters/svg-to-react/page.tsx',
];

const serverUtilityFiles = [
  'app/api/convert/ip-geolocation/route.ts',
];

const browserLocalDeveloperUtilityFiles = developerUtilityFiles.filter(
  (filePath) => filePath !== 'app/converters/ip-geolocation/page.tsx',
);

const sensitiveInputStateChecks = [
  {
    filePath: 'app/components/request-converter-workbench.tsx',
    states: ['input'],
  },
  {
    filePath: 'app/converters/env-validator/page.tsx',
    states: ['input'],
  },
  {
    filePath: 'app/converters/hash-generator/page.tsx',
    states: ['input'],
  },
  {
    filePath: 'app/converters/jwt-decoder/page.tsx',
    states: ['token', 'signingKey', 'validationSecret'],
  },
];

const forbiddenPersistencePatterns = [
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bindexedDB\b/,
  /\bdocument\.cookie\b/,
  /\bcookies\(/,
  /\bSet-Cookie\b/i,
  /\bhistory\.(pushState|replaceState)\b/,
  /\brouter\.(push|replace)\b/,
  /\bURLSearchParams\b/,
];

function assertSensitiveInputStateInitializesEmpty(source, filePath, stateName) {
  const escapedStateName = stateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const emptyStateInitializer = new RegExp(
    String.raw`const\s*\[\s*${escapedStateName}\s*,\s*set[A-Z][\w$]*\s*\]\s*=\s*useState(?:<[^>]+>)?\s*\(\s*(['"])\s*\1\s*\)`,
    's',
  );

  assert.match(
    source,
    emptyStateInitializer,
    `${filePath} must initialize sensitive "${stateName}" input from an empty in-memory state so reloads and new browser sessions do not restore it`,
  );
}

test('developer utility pages do not persist inputs in browser storage, cookies, or URLs', () => {
  for (const filePath of developerUtilityFiles) {
    const source = readFileSync(filePath, 'utf8');

    for (const pattern of forbiddenPersistencePatterns) {
      assert.doesNotMatch(source, pattern, `${filePath} must not use ${pattern}`);
    }
  }
});

test('sensitive utility inputs start from empty component state after reloads or new sessions', () => {
  for (const { filePath, states } of sensitiveInputStateChecks) {
    const source = readFileSync(filePath, 'utf8');

    for (const stateName of states) {
      assertSensitiveInputStateInitializesEmpty(source, filePath, stateName);
    }
  }
});

test('developer utility pages do not send raw utility inputs to backend conversion routes', () => {
  for (const filePath of browserLocalDeveloperUtilityFiles) {
    const source = readFileSync(filePath, 'utf8');

    assert.doesNotMatch(
      source,
      /fetch\(\s*['"]\/api\/convert\//,
      `${filePath} must keep developer utility input in component/session memory`,
    );
  }
});

test('developer utility backend conversion routes are not exposed for sensitive input tools', () => {
  const removedBackendRoutes = [
    'app/api/convert/html-to-markdown/route.ts',
    'app/api/convert/js-beautify/route.ts',
  ];

  for (const filePath of removedBackendRoutes) {
    assert.equal(existsSync(filePath), false, `${filePath} must not accept developer utility input`);
  }
});

test('developer utility surfaces do not include runtime logging, analytics, or debugging hooks', () => {
  const forbiddenRuntimeOutputPatterns = [
    /\bconsole\.(debug|error|info|log|trace|warn)\s*\(/,
    /\bdebugger\b/,
    /\b(gtag|dataLayer|posthog|mixpanel|amplitude|heap|hotjar|clarity|fullstory|LogRocket|Sentry)\b/,
    /\b(captureException|captureMessage|track|identify)\s*\(/,
  ];

  for (const filePath of [...developerUtilityFiles, ...serverUtilityFiles]) {
    const source = readFileSync(filePath, 'utf8');

    for (const pattern of forbiddenRuntimeOutputPatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `${filePath} must not expose user input through runtime logging or telemetry`,
      );
    }
  }
});
