import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/* ---------------- hooks ---------------- */

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

const SCRAMBLE_CHARS = "▓▒░<>/{}[]#=+*·";

export function useScramble(text: string, startDelay = 0): string {
  const reduced = usePrefersReducedMotion();
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (reduced || !("IntersectionObserver" in window)) {
      setOut(text);
      return;
    }
    let frame = 0;
    let raf = 0;
    let timeout = 0;
    const total = text.length;
    const tick = () => {
      frame++;
      const revealed = Math.floor(frame / 2.2);
      let s = "";
      for (let i = 0; i < total; i++) {
        const ch = text[i];
        if (ch === " ") {
          s += " ";
        } else if (i < revealed) {
          s += ch;
        } else {
          s += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      setOut(s);
      if (revealed < total) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    timeout = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, startDelay);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [text, reduced, startDelay]);
  return out;
}

/* ---------------- Reveal on scroll ---------------- */

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/* ---------------- icons (hand-drawn inline SVG) ---------------- */

type IconProps = { className?: string };

export function IconDb({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 5.5v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 11.5v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconTerminal({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="4.5" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9.5l3.2 2.7L7 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 15.5h4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconCode({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M8.5 7L4 12l4.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 7L20 12l-4.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.2 5l-2.4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconRoutes({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.2 6.4c4.6.6 7.6 2.5 7.6 5.2M8.2 17.6c4.6-.6 7.6-2.5 7.6-5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconRocket({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3c3.5 1.2 5.5 4.4 5.5 8.5l-2.5 2.5H9L6.5 11.5C6.5 7.4 8.5 4.2 12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 14.5L6.8 19l3-1 1.2 2.5 1-3M15 14.5l2.2 4.5-3-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCopy({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 14.5h-.7a1.8 1.8 0 01-1.8-1.8V5.3a1.8 1.8 0 011.8-1.8h7.4a1.8 1.8 0 011.8 1.8v.7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconCheck({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGopherMark({ className = "w-8 h-8" }: IconProps) {
  // стилизованная морда гофера: два глаза-пуговицы и мордочка
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="11.5" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="20.5" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12.3" cy="12.6" r="1.1" fill="currentColor" />
      <circle cx="19.7" cy="12.6" r="1.1" fill="currentColor" />
      <path d="M13.5 21.5c.9 1 1.7 1.4 2.5 1.4s1.6-.4 2.5-1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 17.2v.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconArrow({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 12h15M13 5.5L19.5 12 13 18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconReset({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4.5 12a7.5 7.5 0 107.5-7.5c-2.6 0-4.9 1.3-6.3 3.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5.5 3.5v4.5H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSend({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 11.5L20 4l-4.5 16-4-6.5L4 11.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M11.5 13.5L20 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- method chip ---------------- */

export const METHOD_STYLE: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  GET: { text: "text-gopher2", bg: "bg-gopher/10", border: "border-gopher/40", glow: "rgba(0,173,216,0.25)" },
  POST: { text: "text-mint", bg: "bg-mint/10", border: "border-mint/40", glow: "rgba(63,214,143,0.25)" },
  PUT: { text: "text-amber", bg: "bg-amber/10", border: "border-amber/40", glow: "rgba(255,180,84,0.25)" },
  DELETE: { text: "text-coral", bg: "bg-coral/10", border: "border-coral/40", glow: "rgba(255,107,122,0.25)" },
};

export function MethodChip({ method, size = "md" }: { method: string; size?: "sm" | "md" }) {
  const s = METHOD_STYLE[method] ?? METHOD_STYLE.GET;
  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-bold tracking-wide border ${s.text} ${s.bg} ${s.border} ${
        size === "sm" ? "text-[10px] px-1.5 py-0.5 rounded min-w-[52px]" : "text-xs px-2.5 py-1 rounded-md min-w-[64px]"
      }`}
    >
      {method}
    </span>
  );
}

/* ---------------- copy button ---------------- */

export function CopyButton({ text, label = "Копировать" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      done();
    }
  }, [text]);
  return (
    <button
      onClick={onCopy}
      className={`chip-press inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-md border cursor-pointer ${
        copied
          ? "text-mint border-mint/50 bg-mint/10"
          : "text-fog border-edge hover:text-snow hover:border-edge2 bg-panel/60 hover:bg-panel2"
      }`}
      aria-label={label}
    >
      {copied ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy className="w-3.5 h-3.5" />}
      {copied ? "Готово" : label}
    </button>
  );
}

/* ---------------- section heading ---------------- */

export function SectionHeading({
  index,
  icon,
  kicker,
  title,
  desc,
}: {
  index: string;
  icon: ReactNode;
  kicker: string;
  title: string;
  desc?: string;
}) {
  return (
    <Reveal className="mb-10 md:mb-14">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-xs text-gopher2 tracking-[0.25em]">{index}</span>
        <span className="h-px w-10 bg-gopher/40" />
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-fog">
          <span className="text-gopher2">{icon}</span>
          {kicker}
        </span>
      </div>
      <h2 className="font-display font-800 text-snow text-3xl sm:text-4xl lg:text-[2.6rem] leading-[1.12] font-extrabold">
        <span className="mask-line">
          <span>{title}</span>
        </span>
      </h2>
      {desc && <p className="mt-4 max-w-2xl text-fog text-base sm:text-lg leading-relaxed">{desc}</p>}
    </Reveal>
  );
}
