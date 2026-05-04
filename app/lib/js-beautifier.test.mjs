import assert from 'node:assert/strict';
import test from 'node:test';

import { beautifyJavaScript } from './js-beautifier.ts';

test('beautifies JavaScript locally without a backend request', async () => {
  const result = await beautifyJavaScript('const value={ok:true};function run(){return value.ok}');

  assert.match(result, /const value = \{\n  ok: true\n\};/);
  assert.match(result, /function run\(\) \{/);
});

test('rejects invalid JavaScript with Korean feedback', async () => {
  await assert.rejects(() => beautifyJavaScript('const ='), /JavaScript 코드 구문을 확인해주세요/);
});
