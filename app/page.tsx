'use client';

import Link from 'next/link';

import { toolGroups, tools } from '@/app/lib/tool-registry';

const navItems = ['도구', '즐겨찾기', '최근 작업'];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="ConvertApp 홈">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-sm font-semibold text-white shadow-sm">
              CA
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight text-slate-950">ConvertApp</span>
              <span className="block truncate text-xs font-medium text-slate-500">
                Local developer utility workspace
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-1 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item, index) => (
              <a
                key={item}
                href="#tools"
                className={`rounded-md px-3 py-2 transition-colors hover:bg-white hover:text-slate-950 ${
                  index === 0 ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/70' : ''
                }`}
              >
                {item}
              </a>
            ))}
          </nav>

          <a
            href="https://github.com/m320ng"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 sm:px-3.5"
          >
            GitHub
          </a>
        </div>
        <nav className="flex max-w-full gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 text-sm font-medium text-slate-600 md:hidden">
          {navItems.map((item, index) => (
            <a
              key={item}
              href="#tools"
              className={`shrink-0 rounded-md px-3 py-2 ${
                index === 0 ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Workspace</p>
              <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-950">
                개발 작업을 위한 빠른 변환 도구
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                자주 쓰는 포맷팅, 인코딩, 문서 변환 도구를 첫 화면에서 바로 찾고 실행합니다.
              </p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tool count</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight text-slate-950">{tools.length}</span>
                <span className="pb-1.5 text-sm font-medium text-slate-500">available tools</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-4/5 rounded-full bg-blue-600" />
              </div>
            </section>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 sm:p-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 max-w-2xl xl:flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                    Local-first utility hub
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                    필요한 변환 도구를 바로 열고 작업하세요
                  </h2>
                  <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                    사용 빈도가 높은 도구를 먼저 배치하고, 작업 유형과 출력 목적을 함께 보여주도록
                    정리했습니다.
                  </p>
                </div>

                <div className="w-full min-w-0 max-w-lg rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 xl:max-w-sm xl:flex-none">
                  <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-md bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200/80 sm:flex-nowrap">
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-blue-50 text-sm font-semibold text-blue-700"
                      aria-hidden="true"
                    >
                      /
                    </span>
                    <span className="min-w-0 flex-1 basis-40 text-sm font-medium leading-5 text-slate-500">
                      JSON, Base64, SQL처럼 작업 키워드로 빠르게 스캔
                    </span>
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="tools" className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tools</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">도구 목록</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">예상 사용 빈도 순으로 정렬됨</p>
              </div>
              <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                {tools.length}개 도구
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {toolGroups.map((category) => {
                const categoryTools = tools.filter(
                  (tool) => tool.category === category.id,
                );

                return (
                  <section key={category.id} aria-labelledby={`${category.id}-heading`}>
                    <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3 sm:px-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4
                            id={`${category.id}-heading`}
                            className="text-sm font-bold tracking-tight text-slate-950"
                          >
                            {category.title}
                          </h4>
                          <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">{category.description}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          {categoryTools.length}개 도구
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {categoryTools.map((converter) => (
                        <Link
                          key={converter.id}
                          href={converter.path}
                          className="group grid min-w-0 gap-3 px-5 py-4 transition-colors hover:bg-blue-50/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-700 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-center sm:px-6"
                        >
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${converter.accent} text-xs font-bold text-white shadow-sm ring-1 ring-black/5`}
                          >
                            {converter.shortcut}
                          </span>
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-base font-semibold tracking-tight text-slate-950 group-hover:text-blue-700">
                                {converter.title}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                {converter.group}
                              </span>
                            </span>
                            <span className="mt-1 block [overflow-wrap:anywhere] text-sm leading-5 text-slate-600">
                              {converter.description}
                            </span>
                          </span>
                          <span className="inline-flex w-fit items-center gap-1 rounded-md border border-transparent px-2.5 py-1.5 text-sm font-semibold text-slate-400 transition-colors group-hover:border-blue-200 group-hover:bg-white group-hover:text-blue-700">
                            열기
                            <span aria-hidden="true">→</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
