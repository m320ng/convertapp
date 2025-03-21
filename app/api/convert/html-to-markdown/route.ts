import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

function cleanText(text: string): string {
    // Remove extra whitespace and newlines
    return text.replace(/\s+/g, ' ').trim();
}

function extractCodeBlock(element: cheerio.Element, $: cheerio.CheerioAPI): string {
    const codeText = $(element).text();

    // Try to find language identifier from class
    let language = '';
    const classes = $(element).attr('class')?.split(' ') || [];
    for (const cls of classes) {
        if (cls.startsWith('language-')) {
            language = cls.replace('language-', '');
            break;
        }
    }

    const code = codeText.trim();
    return `\`\`\`${language}\n${code}\n\`\`\``;
}

function htmlToMarkdown(html: string): string {
    const $ = cheerio.load(html);
    const markdownContent: string[] = [];

    // Find all markdown sections
    const sections = $('.markdown-section');

    if (sections.length === 0) {
        // If no markdown sections found, try to convert the whole content
        // Try to find code blocks
        $('pre').each((_, element) => {
            markdownContent.push(extractCodeBlock(element, $));
        });

        // Get remaining text content
        $('body').contents().each((_, element) => {
            if (element.type === 'text') {
                const text = cleanText($(element).text());
                if (text && !markdownContent.includes(text)) {
                    markdownContent.push(text);
                }
            }
        });
    } else {
        sections.each((_, section) => {
            // Get raw markdown content if available
            const rawMarkdown = $(section).attr('data-markdown-raw');

            if (rawMarkdown) {
                // Clean up the raw markdown
                const cleanedMarkdown = rawMarkdown.trim();

                // Handle code blocks specially
                if (cleanedMarkdown.includes('```')) {
                    const blocks = cleanedMarkdown.split(/(```[\s\S]*?```)/);
                    blocks.forEach(block => {
                        if (block.startsWith('```')) {
                            markdownContent.push(block);
                        } else {
                            const trimmed = block.trim();
                            if (trimmed) {
                                markdownContent.push(trimmed);
                            }
                        }
                    });
                } else {
                    markdownContent.push(cleanedMarkdown);
                }
            } else {
                // Fallback to text content if no raw markdown
                const text = cleanText($(section).text());
                if (text) {
                    markdownContent.push(text);
                }
            }
        });
    }

    return markdownContent.join('\n\n');
}

export async function POST(request: Request) {
    try {
        const { html } = await request.json();

        if (!html) {
            return NextResponse.json(
                { error: 'No HTML content provided' },
                { status: 400 }
            );
        }

        const markdown = htmlToMarkdown(html);
        return NextResponse.json({ markdown });
    } catch (error) {
        console.error('Error converting HTML to Markdown:', error);
        return NextResponse.json(
            { error: 'Failed to convert HTML to Markdown' },
            { status: 500 }
        );
    }
} 