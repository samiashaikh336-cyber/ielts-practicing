import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] flex flex-col justify-between px-6 py-12 text-[#F8FAFC]">
      <header className="mx-auto w-full max-w-5xl flex items-center justify-between">
        <span className="font-mono text-sm font-bold tracking-wider text-[#94A3B8]">IELTS_CORE_WORKSPACE</span>
        <Link href="/login" className="border border-[#334155] bg-[#1E293B] px-4 py-2 text-xs font-mono uppercase tracking-wider text-white">
          SIGN IN
        </Link>
      </header>
      <section className="mx-auto w-full max-w-3xl text-center my-auto py-12">
        <h1 className="text-4xl font-black tracking-tight text-white">
          Master your English oral communication with learners <span className="text-[#2563EB]">worldwide.</span>
        </h1>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/signup" className="bg-[#2563EB] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white">
            INITIALIZE REGISTRATION
          </Link>
        </div>
      </section>
    </main>
  );
}
