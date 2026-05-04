'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  getAdjacentTools,
  getToolByPath,
  tools,
} from '@/app/lib/tool-registry';

export function ToolNavigation() {
  const pathname = usePathname();
  const activeTool = getToolByPath(pathname);
  const adjacent = activeTool
    ? getAdjacentTools(activeTool.id)
    : { previous: null, next: null };

  return (
    <nav
      aria-label="도구 이동"
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/[0.92] shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
            >
              <span aria-hidden="true">←</span>
              <span className="truncate">전체 도구</span>
            </Link>

            {activeTool && (
              <div className="min-w-0 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 lg:hidden">
                <span className="sr-only">현재 도구: </span>
                <span className="block max-w-[46vw] truncate font-semibold text-slate-950">
                  {activeTool.title}
                </span>
              </div>
            )}
          </div>

          <div className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:justify-end [&::-webkit-scrollbar]:hidden">
            {adjacent.previous && (
              <Link
                href={adjacent.previous.path}
                className="inline-flex max-w-[70vw] shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 sm:max-w-none"
              >
                <span aria-hidden="true">← </span>
                <span className="hidden sm:inline">이전:</span>
                <span className="truncate">{adjacent.previous.title}</span>
              </Link>
            )}

            {adjacent.next && (
              <Link
                href={adjacent.next.path}
                className="inline-flex max-w-[70vw] shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 sm:max-w-none"
              >
                <span className="hidden sm:inline">다음:</span>
                <span className="truncate">{adjacent.next.title}</span>
                <span aria-hidden="true"> →</span>
              </Link>
            )}

            {activeTool && (
              <div className="hidden min-w-0 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 lg:block">
                현재 도구:{' '}
                <span className="font-semibold text-slate-950">{activeTool.title}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-white to-transparent" />
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {tools.map((tool) => {
              const isActive = tool.id === activeTool?.id;

              return (
                <Link
                  key={tool.id}
                  href={tool.path}
                  aria-current={isActive ? 'page' : undefined}
                  title={tool.title}
                  className={`snap-start shrink-0 rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 ${
                    isActive
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {tool.shortcut}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
