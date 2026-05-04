import { ToolNavigation } from '@/app/components/tool-navigation';

export default function ConvertersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <ToolNavigation />
      {children}
    </main>
  );
}
