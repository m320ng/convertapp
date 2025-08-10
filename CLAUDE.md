# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 web application providing various developer conversion tools. It's a Korean-language tool collection for developers, including HTML to Markdown conversion, code formatters, hash generators, timestamp converters, and more.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Architecture & Structure

**Framework**: Next.js 15 with App Router, TypeScript, Tailwind CSS

**Key Directories**:
- `/app/converters/` - Individual converter pages (12 different tools)
- `/app/api/convert/` - API routes for server-side conversion logic
- `/app/components/` - Reusable React components

**Converter Pattern**: Each converter follows a consistent pattern:
- Page component in `/app/converters/[tool-name]/page.tsx`
- Optional API route in `/app/api/convert/[tool-name]/route.ts` for server-side processing
- Client-side state management using React hooks

**Main Page**: `/app/page.tsx` contains the grid of all available converters with routing

**Key Dependencies**:
- `cheerio` - HTML parsing (used in html-to-markdown converter)
- `crypto-js` - Cryptographic functions for hash generation
- `prettier` - Code formatting
- `sql-formatter` - SQL query formatting
- `react-markdown` + `remark-gfm` - Markdown rendering

**Configuration**:
- Next.js config enables standalone output for Docker deployment
- ESLint configured with Next.js TypeScript rules
- TypeScript with strict mode and path aliases (`@/*`)

## Deployment

The application is configured for Docker deployment with standalone output. Uses `docker-compose.yml` for container orchestration.