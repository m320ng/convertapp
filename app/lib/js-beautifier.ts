function assertLikelyValidJavaScript(code: string) {
  try {
    new Function(code);
  } catch {
    const moduleLikeCode = code
      .replace(/^\s*import\s+[^;]+;?/gm, '')
      .replace(/^\s*export\s+(default\s+)?/gm, '');

    try {
      new Function(moduleLikeCode);
    } catch {
      throw new Error('JavaScript 코드 구문을 확인해주세요.');
    }
  }
}

function normalizeSpacing(code: string): string {
  return code
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}()[\],;:])\s*/g, '$1')
    .replace(/\s*([=+\-*/<>!&|?]+)\s*/g, ' $1 ')
    .replace(/;(?=\S)/g, '; ')
    .trim();
}

function formatJavaScript(code: string): string {
  const normalized = normalizeSpacing(code);
  let indentLevel = 0;
  let output = '';
  let quote: string | null = null;
  let escaped = false;

  const appendNewLine = () => {
    output = output.trimEnd();
    output += `\n${'  '.repeat(Math.max(indentLevel, 0))}`;
  };

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];

    if (quote) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      output += char;
      continue;
    }

    if (char === ' ' && /\n\s*$/.test(output)) {
      continue;
    }

    if (char === '{') {
      output = output.trimEnd();
      output += ' {';
      indentLevel += 1;
      appendNewLine();
      continue;
    }

    if (char === '}') {
      indentLevel -= 1;
      appendNewLine();
      output += '}';
      if (normalized[index + 1] && normalized[index + 1] !== ';' && normalized[index + 1] !== ',') {
        appendNewLine();
      }
      continue;
    }

    if (char === ';') {
      output += ';';
      appendNewLine();
      continue;
    }

    if (char === ',') {
      output += ', ';
      continue;
    }

    if (char === ':') {
      output += ': ';
      continue;
    }

    output += char;
  }

  return `${output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line.trim() || index < lines.length - 1)
    .join('\n')
    .trim()}\n`;
}

export async function beautifyJavaScript(code: string): Promise<string> {
  if (!code.trim()) {
    throw new Error('정리할 JavaScript 코드를 입력해주세요.');
  }

  assertLikelyValidJavaScript(code);

  return formatJavaScript(code);
}
