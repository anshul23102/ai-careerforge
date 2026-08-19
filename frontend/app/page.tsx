import Link from "next/link";
import { Brain, Target, FileText, MessageSquare, Briefcase, ArrowRight, Zap, CheckCircle, Star, Users, Clock, BarChart3 } from "lucide-react";
import InteractiveMesh from "../components/InteractiveMesh";
import StarField from "../components/StarField";
import NavAuthButtons from "../components/NavAuthButtons";


const dimensions = [
  {
    icon: Brain,
    title: "Technical Skills",
    description: "DSA, system design, coding proficiency, and CS fundamentals — benchmarked against top-tier hiring bars.",
    color: "#6eb4ff",
    rgb: "110,180,255",
    stat: "5 areas",
  },
  {
    icon: FileText,
    title: "Resume Quality",
    description: "AI scans your experience, projects, and presentation against what Google, Amazon, and Meta recruiters look for.",
    color: "#a5b4fc",
    rgb: "165,180,252",
    stat: "AI scored",
  },
  {
    icon: MessageSquare,
    title: "Communication",
    description: "Self-assessment calibrated to industry norms — how your articulation holds up under real interview pressure.",
    color: "#c084fc",
    rgb: "192,132,252",
    stat: "5 levels",
  },
  {
    icon: Briefcase,
    title: "Portfolio Strength",
    description: "Your GitHub, LinkedIn, and project presence — the digital footprint that speaks before you say a word.",
    color: "#34d399",
    rgb: "52,211,153",
    stat: "3 signals",
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-[#07080f]">

      {/* ── BACKGROUNDS ── */}
      <InteractiveMesh />
      <StarField />

      {/* ── STICKY NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #a5b4fc, #6eb4ff)" }}>
              <Target size={14} className="text-white" />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">AI CareerForge</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-white/50">
            <a href="#dimensions" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How It Works</a>
          </div>

          {/* CTA */}
          <NavAuthButtons />
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-[2] min-h-screen flex flex-col items-center justify-center text-center px-6 pt-14 overflow-hidden">
        {/* Orbs */}
        <div className="orb orb-purple" style={{ width: 700, height: 700, top: "-20%", left: "50%", transform: "translateX(-50%)" }} />
        <div className="orb orb-blue" style={{ width: 500, height: 500, bottom: "-10%", left: "10%" }} />
        <div className="orb orb-pink" style={{ width: 400, height: 400, bottom: "0%", right: "5%" }} />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Top pill badge */}
          <div className="slide-up inline-flex items-center gap-2 mb-10">
            <span className="badge">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              AI-Powered · Free · Instant Results
            </span>
          </div>

          {/* Main headline — Apple-style huge tight type */}
          <h1 className="slide-up-delay-1 display-xl text-white mb-6">
            Know if you&apos;re
            <br />
            <span className="gradient-text glow-text-purple">interview ready.</span>
          </h1>

          {/* Subhead */}
          <p className="slide-up-delay-2 text-white/50 text-xl md:text-2xl font-normal max-w-2xl mx-auto leading-relaxed mb-12" style={{ letterSpacing: "-0.01em" }}>
            Get your personalized Interview Readiness Score in under 2 minutes.
            Four dimensions. One honest verdict.
          </p>

          {/* CTAs */}
          <div className="slide-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/assess" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
              Start Your Assessment
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn-ghost flex items-center gap-2 text-base">
              <Zap size={16} className="text-yellow-400" />
              See how it works
            </a>
          </div>

          {/* Stat pills */}
          <div className="slide-up-delay-4 flex flex-wrap items-center justify-center gap-3 text-sm">
            {[
              { icon: Users, value: "10K+", label: "Assessments done" },
              { icon: Clock, value: "< 2 min", label: "To your score" },
              { icon: BarChart3, value: "4 dimensions", label: "Analyzed" },
              { icon: Star, value: "Free", label: "Always" },
            ].map((s) => (
              <div key={s.label} className="glass px-4 py-2.5 rounded-2xl flex items-center gap-2.5 border border-white/06">
                <s.icon size={15} className="text-purple-400 flex-shrink-0" />
                <span className="text-white font-semibold">{s.value}</span>
                <span className="text-white/35">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-white/25 text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/25 to-transparent" />
        </div>
      </section>

      {/* ── DIMENSIONS ── */}
      <section id="dimensions" className="relative z-[2] py-36 px-6">
        <div className="orb orb-purple" style={{ width: 500, height: 500, top: "20%", right: "-15%", opacity: 0.08 }} />

        <div className="max-w-7xl mx-auto">
          {/* Section label */}
          <div className="mb-5">
            <span className="text-white/30 text-sm font-semibold uppercase tracking-widest">What we analyze</span>
          </div>

          {/* Big section headline — Apple style */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <h2 className="display-lg text-white max-w-xl">
              Four dimensions.
              <br />
              <span className="gradient-text-blue">Complete picture.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-sm leading-relaxed md:text-right" style={{ letterSpacing: "-0.01em" }}>
              Every angle that matters to a real interviewer, evaluated by AI that&apos;s seen it all.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {dimensions.map((d, i) => (
              <div
                key={d.title}
                className="group relative glass-strong rounded-3xl p-8 overflow-hidden card-3d"
                style={{ border: `1px solid rgba(${d.rgb}, 0.18)` }}
              >
                {/* Subtle bg glow */}
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle, rgba(${d.rgb},0.1), transparent)`, transform: "translate(30%, -30%)" }}
                />

                <div className="relative z-10">
                  {/* Icon + stat */}
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="p-3 rounded-2xl"
                      style={{ background: `rgba(${d.rgb}, 0.12)`, border: `1px solid rgba(${d.rgb}, 0.2)` }}
                    >
                      <d.icon size={22} style={{ color: d.color }} />
                    </div>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: `rgba(${d.rgb},0.1)`, color: d.color, border: `1px solid rgba(${d.rgb},0.2)` }}
                    >
                      {d.stat}
                    </span>
                  </div>

                  <h3
                    className="text-2xl font-bold mb-3"
                    style={{ color: "white", letterSpacing: "-0.025em" }}
                  >
                    {d.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed text-[0.95rem]">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — Apple editorial style ── */}
      <section id="how-it-works" className="relative z-[2] py-36 px-6 overflow-hidden">
        <div className="orb orb-blue" style={{ width: 450, height: 450, top: "30%", left: "-12%", opacity: 0.07 }} />

        <div className="max-w-7xl mx-auto">
          <div className="mb-5">
            <span className="text-white/30 text-sm font-semibold uppercase tracking-widest">The process</span>
          </div>

          <h2 className="display-lg text-white mb-20 max-w-xl">
            Three steps.
            <br />
            <span className="gradient-text">Two minutes.</span>
          </h2>

          {/* Steps — full-width editorial cards */}
          <div className="space-y-5">
            {[
              {
                number: "01",
                title: "Create your account, tell us your goal",
                body: "Quick signup, then your target role, experience level, and which companies you're aiming for. Takes about 30 seconds.",
                time: "~30 sec",
                color: "#6eb4ff",
                rgb: "110,180,255",
              },
              {
                number: "02",
                title: "Rate your skills & upload your resume",
                body: "Self-assess across 5 technical areas on a 1–10 scale, then upload your resume in any common format. Our AI does the deep analysis.",
                time: "~60 sec",
                color: "#a5b4fc",
                rgb: "165,180,252",
              },
              {
                number: "03",
                title: "Get your score & action plan",
                body: "Instant 0–100 readiness score across 4 dimensions, your specific strengths, what to fix, and a week-by-week action plan.",
                time: "Instant",
                color: "#34d399",
                rgb: "52,211,153",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="group glass-strong rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8 overflow-hidden relative"
                style={{ border: `1px solid rgba(${step.rgb}, 0.12)` }}
              >
                {/* Step number — big ghost text */}
                <div
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-9xl font-black opacity-[0.04] select-none hidden md:block"
                  style={{ color: step.color, letterSpacing: "-0.05em" }}
                >
                  {step.number}
                </div>

                <div className="relative z-10 flex items-start md:items-center gap-6 flex-1">
                  {/* Number badge */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
                    style={{ background: `rgba(${step.rgb},0.12)`, border: `1px solid rgba(${step.rgb},0.22)`, color: step.color }}
                  >
                    {step.number}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2" style={{ letterSpacing: "-0.025em" }}>
                      {step.title}
                    </h3>
                    <p className="text-white/45 leading-relaxed max-w-lg">{step.body}</p>
                  </div>
                </div>

                <div className="relative z-10 flex-shrink-0">
                  <span
                    className="text-sm font-bold px-4 py-2 rounded-full"
                    style={{ background: `rgba(${step.rgb},0.1)`, color: step.color, border: `1px solid rgba(${step.rgb},0.2)` }}
                  >
                    {step.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA — Apple-style centered big pitch ── */}
      <section className="relative z-[2] py-40 px-6 overflow-hidden">
        <div className="orb orb-purple" style={{ width: 600, height: 600, top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.12 }} />
        <div className="orb orb-pink" style={{ width: 300, height: 300, top: "10%", right: "15%", opacity: 0.07 }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-white/30 text-sm font-semibold uppercase tracking-widest mb-6">Your next move</p>

          <h2 className="display-xl text-white mb-8">
            Ready to find out
            <br />
            <span className="gradient-text glow-text-purple">where you stand?</span>
          </h2>

          <p className="text-white/45 text-xl max-w-lg mx-auto leading-relaxed mb-12" style={{ letterSpacing: "-0.01em" }}>
            Thousands of engineers used AI CareerForge to walk into interviews knowing exactly what to say.
          </p>

          <Link href="/assess" className="btn-primary inline-flex items-center gap-3 text-lg px-10 py-4">
            Start Free Assessment
            <ArrowRight size={20} />
          </Link>

          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/30">
            {["Free account, 30 seconds", "100% free", "Results in under 2 min"].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-[2] border-t border-white/05 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-white/25 text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#a5b4fc,#6eb4ff)" }}>
              <Target size={10} className="text-white" />
            </div>
            <span className="font-medium text-white/40">AI CareerForge</span>
          </div>
          <p>Powered by Groq AI &middot; &copy; 2026</p>
          <p className="text-white/15">Built for ambitious engineers.</p>
        </div>
      </footer>

    </main>
  );
}
