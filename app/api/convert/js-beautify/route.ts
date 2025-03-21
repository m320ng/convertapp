import { NextResponse } from 'next/server';
import { format } from 'prettier';
import * as babel from '@babel/parser';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json(
                { error: 'No code provided' },
                { status: 400 }
            );
        }

        // Parse the code to validate it's valid JavaScript
        try {
            babel.parse(code, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript'],
            });
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid JavaScript code' },
                { status: 400 }
            );
        }

        // Format the code using prettier
        const beautified = await format(code, {
            parser: 'babel',
            semi: true,
            singleQuote: true,
            trailingComma: 'es5',
        });

        return NextResponse.json({ beautified });
    } catch (error) {
        console.error('Error beautifying JavaScript:', error);
        return NextResponse.json(
            { error: 'Failed to beautify JavaScript' },
            { status: 500 }
        );
    }
} 