import Metadata from './metadata';

interface FallbackPageProps {
  code: string;
  title: string;
  description: string;
}

export default function FallbackPage({
  code,
  title,
  description,
}: FallbackPageProps) {
  return (
    <>
      <Metadata title={title} />
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-16 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#D02525]" />
        <div className="w-full max-w-3xl text-center relative">
          <div className="mx-auto mb-8 w-28 md:w-36">
            <img
              src="/static/images/bangkok-vote-logo.svg"
              alt="Bangkok Vote 2569"
              className="w-full h-auto"
            />
          </div>
          <p className="font-heading text-[#D02525] text-[72px] md:text-[120px] leading-none">
            {code}
          </p>
          <h1 className="font-heading text-[40px] md:text-[72px] leading-tight mt-3">
            {title}
          </h1>
          <p className="font-body text-base md:text-xl text-white/75 max-w-xl mx-auto mt-5 leading-relaxed">
            {description}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/map/map"
              className="font-heading text-xl md:text-2xl bg-white text-black px-6 py-3 rounded-sm hover:bg-[#D02525] hover:text-white transition-colors"
            >
              ดูผลการเลือกตั้ง
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/candidate"
              className="font-heading text-xl md:text-2xl border border-white/40 px-6 py-3 rounded-sm hover:border-white transition-colors"
            >
              ดูข้อมูลผู้สมัคร
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
