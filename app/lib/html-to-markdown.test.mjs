import assert from 'node:assert/strict';
import test from 'node:test';

import { convertHtmlToMarkdown } from './html-to-markdown.ts';

test('converts HTML content locally into markdown text', () => {
  const markdown = convertHtmlToMarkdown('<h1>Title</h1><p>Hello <strong>ConvertApp</strong></p>');

  assert.match(markdown, /Title/);
  assert.match(markdown, /Hello/);
  assert.match(markdown, /ConvertApp/);
});

test('rejects empty HTML with Korean feedback', () => {
  assert.throws(() => convertHtmlToMarkdown('   '), /변환할 HTML을 입력해주세요/);
});
