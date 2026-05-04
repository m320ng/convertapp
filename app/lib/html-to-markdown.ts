function normalizeInlineText(value: string): string {
  return value.replace(/\s+/g, ' ');
}

function normalizeBlockText(value: string): string {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_{}\[\]()#+\-.!|>])/g, '\\$1');
}

function nodeChildrenToMarkdown(node: ParentNode): string {
  return Array.from(node.childNodes)
    .map((child) => nodeToMarkdown(child))
    .join('');
}

function nodeToMarkdown(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeInlineText(node.textContent ?? '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  const content = nodeChildrenToMarkdown(element).trim();

  switch (tagName) {
    case 'script':
    case 'style':
    case 'noscript':
      return '';
    case 'br':
      return '\n';
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const level = Number(tagName.slice(1));
      return `\n\n${'#'.repeat(level)} ${content}\n\n`;
    }
    case 'p':
    case 'section':
    case 'article':
    case 'div':
      return content ? `\n\n${content}\n\n` : '';
    case 'strong':
    case 'b':
      return content ? `**${content}**` : '';
    case 'em':
    case 'i':
      return content ? `_${content}_` : '';
    case 'code':
      return `\`${element.textContent ?? ''}\``;
    case 'pre': {
      const codeElement = element.querySelector('code');
      const languageClass = codeElement?.className.match(/language-([a-z0-9_-]+)/i);
      const language = languageClass?.[1] ?? '';
      const code = (codeElement?.textContent ?? element.textContent ?? '').trim();

      return code ? `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n` : '';
    }
    case 'a': {
      const href = element.getAttribute('href');
      return href && content ? `[${content}](${href})` : content;
    }
    case 'img': {
      const src = element.getAttribute('src');
      const alt = element.getAttribute('alt') ?? '';
      return src ? `![${alt}](${src})` : '';
    }
    case 'ul':
      return `\n${Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((child) => `- ${normalizeBlockText(nodeChildrenToMarkdown(child)).replace(/\n/g, '\n  ')}`)
        .join('\n')}\n\n`;
    case 'ol':
      return `\n${Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((child, index) => `${index + 1}. ${normalizeBlockText(nodeChildrenToMarkdown(child)).replace(/\n/g, '\n   ')}`)
        .join('\n')}\n\n`;
    case 'blockquote':
      return `\n\n${normalizeBlockText(content)
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')}\n\n`;
    default:
      return content;
  }
}

function convertWithDomParser(html: string): string {
  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');
  const markdown = nodeChildrenToMarkdown(document.body);

  return normalizeBlockText(markdown);
}

function convertWithTextFallback(html: string): string {
  return normalizeBlockText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|article|h[1-6]|li|ul|ol|pre|blockquote)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
  );
}

export function convertHtmlToMarkdown(html: string): string {
  if (!html.trim()) {
    throw new Error('변환할 HTML을 입력해주세요.');
  }

  const markdown =
    typeof DOMParser === 'undefined' ? convertWithTextFallback(html) : convertWithDomParser(html);

  if (!markdown.trim()) {
    throw new Error('Markdown으로 변환할 수 있는 HTML 내용을 찾지 못했습니다.');
  }

  return markdown;
}
