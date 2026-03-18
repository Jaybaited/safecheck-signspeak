"use client";

import { useRef } from "react";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import { motion, useScroll, useTransform } from "framer-motion";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const features = [
  {
    number: "01",
    tag: "ATTENDANCE",
    title: "RFID Attendance",
    description:
      "Automated, contactless student attendance logging via RFID card taps. Real-time records accessible to teachers and administrators instantly.",
  },
  {
    number: "02",
    tag: "SIGN LANGUAGE",
    title: "FSL Recognition",
    description:
      "Real-time Filipino Sign Language gesture recognition powered by computer vision. Enables communication support and progress tracking for deaf students.",
  },
  {
    number: "03",
    tag: "SAFETY",
    title: "Safety Monitoring",
    description:
      "Live monitoring of student presence and campus safety. Instant alerts and status updates ensure the wellbeing of every student at PSD.",
  },
  {
    number: "04",
    tag: "ACCESS CONTROL",
    title: "Multi-Role Access",
    description:
      "Dedicated dashboards for Students, Teachers, Parents, and Administrators. Each role sees exactly what they need, nothing more.",
  },
];

const stats = [
  { value: "627+", label: "Students" },
  { value: "4",    label: "User Roles" },
  { value: "FSL",  label: "Recognition" },
  { value: "RFID", label: "Attendance" },
  { value: "100%", label: "Contactless" },
  { value: "24/7", label: "Monitoring" },
  { value: "PSD",  label: "Pioneer School" },
  { value: "1907", label: "Est." },
];

const steps = [
  {
    step: "01",
    title: "TAP IN",
    description:
      "Students tap their RFID card at the school entrance. Attendance is logged instantly — no manual roll calls needed.",
  },
  {
    step: "02",
    title: "MONITOR",
    description:
      "Teachers and administrators view real-time attendance, safety status, and FSL learning progress from their dedicated dashboards.",
  },
  {
    step: "03",
    title: "COMMUNICATE",
    description:
      "The FSL recognition module captures and interprets Filipino Sign Language gestures, supporting communication and tracking student progress.",
  },
];

const testimonials = [
  {
    quote:
      "The RFID system eliminated manual attendance completely. What used to take 10 minutes now takes seconds.",
    name: "Class Teacher",
    role: "Philippine School for the Deaf",
  },
  {
    quote:
      "Parents can finally check if their child arrived safely — it gives us real peace of mind every single day.",
    name: "Parent",
    role: "PSD Guardian",
  },
  {
    quote:
      "The FSL recognition module helps track student communication progress in a way we've never had before.",
    name: "Administrator",
    role: "PSD Staff",
  },
  {
    quote:
      "Multiple dashboards for each role means everyone sees exactly what they need — no confusion, no clutter.",
    name: "Faculty Member",
    role: "Philippine School for the Deaf",
  },
];

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale   = useTransform(scrollYProgress, [0, 0.4], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const heroY       = useTransform(scrollYProgress, [0, 0.4], [0, -60]);

  return (
    <main className="bg-[#0F0F23] text-[#FAFAFA] overflow-x-hidden">

      {/* Noise texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "300px 300px",
        }}
      />

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b-2 border-[#2D2B5E] bg-[#0F0F23]/90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#8B5CF6] flex items-center justify-center">
            <span className="text-[#8B5CF6] text-sm font-bold tracking-tighter uppercase">SS</span>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[#FAFAFA] text-xs font-bold uppercase tracking-widest">SafeCheck</span>
            <span className="text-[#8B5CF6] text-xs font-bold uppercase tracking-widest">SignSpeak</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest text-[#9CA3C8]">
          <a href="#features"     className="hover:text-[#FAFAFA] transition-colors duration-200">Features</a>
          <a href="#how-it-works" className="hover:text-[#FAFAFA] transition-colors duration-200">How It Works</a>
          <a href="#about"        className="hover:text-[#FAFAFA] transition-colors duration-200">About</a>
        </div>

        <Link
          href="/login"
          className="h-11 px-6 bg-[#8B5CF6] text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center hover:bg-[#7C3AED] active:scale-95 transition-all duration-200"
        >
          Get Started
        </Link>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-24 px-6 md:px-12"
      >
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-[95vw]"
        >
          <div className="flex items-center gap-3 mb-6 md:mb-10">
            <div className="w-2 h-2 bg-[#8B5CF6]" />
            <span className="text-xs md:text-sm uppercase tracking-widest text-[#9CA3C8] font-medium">
              Philippine School for the Deaf
            </span>
          </div>

          <h1 className="font-bold uppercase leading-[0.85] tracking-tighter mb-6 md:mb-10">
            <span className="block text-[#FAFAFA]" style={{ fontSize: "clamp(3rem, 11vw, 13rem)" }}>
              SAFE
            </span>
            <span className="block text-[#8B5CF6]" style={{ fontSize: "clamp(3rem, 11vw, 13rem)" }}>
              CHECK
            </span>
            <span className="block text-[#FAFAFA]" style={{ fontSize: "clamp(2rem, 7vw, 8rem)" }}>
              SIGN<span className="text-[#8B5CF6]">SPEAK</span>
            </span>
          </h1>

          <div className="flex flex-col md:flex-row md:items-end gap-8 md:gap-16 border-t-2 border-[#2D2B5E] pt-8">
            <p className="text-lg md:text-xl lg:text-2xl text-[#9CA3C8] font-medium leading-tight max-w-2xl">
              An integrated RFID attendance, real-time safety monitoring, and Filipino Sign Language
              recognition system — built for the Philippine School for the Deaf.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                href="/login"
                className="h-14 px-10 bg-[#8B5CF6] text-white text-sm font-bold uppercase tracking-widest flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="h-14 px-10 border-2 border-[#2D2B5E] text-[#FAFAFA] text-sm font-bold uppercase tracking-widest flex items-center justify-center hover:bg-[#FAFAFA] hover:text-[#0F0F23] transition-all duration-300"
              >
                Learn More
              </a>
            </div>
          </div>
        </motion.div>

        {/* Decorative BG text */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 text-[#1A1A3E] font-bold leading-none tracking-tighter select-none pointer-events-none"
          style={{ fontSize: "clamp(8rem, 25vw, 22rem)" }}
        >
          PSD
        </div>

        <div className="absolute bottom-8 left-6 md:left-12 flex items-center gap-3 text-xs uppercase tracking-widest text-[#2D2B5E]">
          <div className="w-8 h-px bg-[#2D2B5E]" />
          Scroll to explore
        </div>
      </section>

      {/* ── STATS TICKER ──────────────────────────────────────────────────── */}
      <section aria-label="System statistics" className="py-10 bg-[#8B5CF6] border-y-2 border-[#7C3AED] overflow-hidden">
        <Marquee speed={80} gradient={false} autoFill>
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-6 mx-8">
              <span className="text-[3rem] md:text-[4rem] font-bold uppercase tracking-tighter leading-none text-white">
                {stat.value}
              </span>
              <span className="text-xs uppercase tracking-widest text-white/60 font-medium">
                {stat.label}
              </span>
              <span className="text-white/30 text-2xl font-bold mx-4">·</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-32 px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 border-b-2 border-[#2D2B5E] pb-8">
          <h2
            className="font-bold uppercase leading-none tracking-tighter text-[#FAFAFA]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            CORE<br /><span className="text-[#8B5CF6]">FEATURES</span>
          </h2>
          <p className="text-base md:text-lg text-[#9CA3C8] max-w-sm leading-tight">
            Everything the Philippine School for the Deaf needs — in one unified system.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.number}
              className="sticky group border-2 border-[#2D2B5E] p-8 md:p-12 bg-[#0F0F23] cursor-default hover:bg-[#8B5CF6] hover:border-[#8B5CF6] transition-all duration-300"
              style={{ top: `${96 + i * 24}px` }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <span
                    aria-hidden="true"
                    className="text-[5rem] md:text-[7rem] font-bold leading-none tracking-tighter text-[#1A1A3E] group-hover:text-[#7C3AED] transition-colors duration-300 select-none"
                  >
                    {feature.number}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-[#8B5CF6] group-hover:text-white transition-colors duration-300 font-bold">
                    {feature.tag}
                  </span>
                </div>
                <div className="md:max-w-2xl">
                  <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tighter leading-none text-[#FAFAFA] group-hover:text-white mb-4 group-hover:translate-x-2 transition-transform duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-base md:text-lg lg:text-xl text-[#9CA3C8] group-hover:text-white/80 leading-tight transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 px-6 md:px-12 border-t-2 border-[#2D2B5E]">
        <div className="mb-16">
          <span className="text-xs uppercase tracking-widest text-[#8B5CF6] font-bold">Process</span>
          <h2
            className="font-bold uppercase leading-none tracking-tighter text-[#FAFAFA] mt-3"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            HOW IT<br /><span className="text-[#8B5CF6]">WORKS</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#2D2B5E]">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              className="bg-[#0F0F23] p-8 md:p-12 flex flex-col gap-6 hover:bg-[#1A1A3E] transition-colors duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <span
                aria-hidden="true"
                className="text-[5rem] md:text-[6rem] font-bold leading-none tracking-tighter text-[#1A1A3E] select-none"
              >
                {step.step}
              </span>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter text-[#FAFAFA] mb-3">
                  {step.title}
                </h3>
                <p className="text-base md:text-lg text-[#9CA3C8] leading-tight">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section aria-label="Testimonials" className="py-32 border-t-2 border-[#2D2B5E] overflow-hidden">
        <div className="px-6 md:px-12 mb-12">
          <span className="text-xs uppercase tracking-widest text-[#8B5CF6] font-bold">Testimonials</span>
          <h2
            className="font-bold uppercase leading-none tracking-tighter text-[#FAFAFA] mt-3"
            style={{ fontSize: "clamp(2rem, 6vw, 5rem)" }}
          >
            WHAT THEY <span className="text-[#8B5CF6]">SAY</span>
          </h2>
        </div>

        <Marquee speed={40} gradient={false} autoFill>
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="border-2 border-[#2D2B5E] bg-[#0F0F23] p-8 mx-4 w-[320px] md:w-[400px] flex flex-col justify-between gap-6 hover:border-[#8B5CF6] transition-colors duration-300"
            >
              <p className="text-base md:text-lg text-[#9CA3C8] leading-tight">"{t.quote}"</p>
              <div className="border-t border-[#2D2B5E] pt-4">
                <p className="text-sm font-bold uppercase tracking-wider text-[#FAFAFA]">{t.name}</p>
                <p className="text-xs uppercase tracking-widest text-[#8B5CF6]">{t.role}</p>
              </div>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer id="about" className="bg-[#8B5CF6] border-t-2 border-[#7C3AED] px-6 md:px-12 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Built for</p>
            <h2
              className="font-bold uppercase leading-none tracking-tighter text-white"
              style={{ fontSize: "clamp(2rem, 6vw, 5rem)" }}
            >
              PHILIPPINE<br />SCHOOL FOR<br />THE DEAF
            </h2>
          </div>

          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm uppercase tracking-widest font-medium text-white/70">
              <Link href="/login"     className="hover:text-white transition-colors">Login</Link>
              <a href="#features"     className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#about"        className="hover:text-white transition-colors">About</a>
            </div>
            <Link
              href="/login"
              className="h-14 px-10 bg-white text-[#8B5CF6] text-sm font-bold uppercase tracking-widest flex items-center justify-center hover:bg-[#0F0F23] hover:text-white transition-all duration-300 w-fit"
            >
              Get Started →
            </Link>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t-2 border-[#7C3AED] flex flex-col md:flex-row md:justify-between gap-3 text-xs uppercase tracking-widest text-white/40">
          <span>SafeCheck · SignSpeak © {new Date().getFullYear()}</span>
          <span>RFID · FSL · Safety Monitoring</span>
        </div>
      </footer>

    </main>
  );
}

