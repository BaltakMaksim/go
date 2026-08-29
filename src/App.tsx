import { useEffect, useState } from "react";
import Terminal from "./components/Terminal";
import Playground from "./components/Playground";
import CodeViewer from "./components/CodeViewer";
import ApiDocs from "./components/ApiDocs";
import Setup from "./components/Setup";
import {
  IconGopherMark,
  MethodChip,
  Reveal,
  useScramble,
} from "./components/ui";

const NAV = [
  { href: "#demo", label: "Демо" },
  { href: "#code", label: "Код" },
  { href: "#api", label: "API" },
  { href: "#setup", label: "Запуск" },
];

const MARQUEE = [
  "GET /users", "200 OK", "POST /users", "201 Created", "PUT /users/{id}",
  "DELETE /users/{id}", "204 No Content", "application/json", "404 Not Found",
  "database/sql", "SQLite", "net/http", "Go 1.22",
];

const FLOATERS = [
  { text: "func main()", top: "8%", left: "-4%", delay: "0s", tilt: "-6deg", size: "text-sm" },
  { text: ":=", top: "70%", left: "2%", delay: "1.4s", tilt: "8deg", size: "text-lg" },
  { text: "SELECT *", top: "16%", right: "4%", delay: "0.7s", tilt: "5deg", size: "text-sm" },
  { text: "{ \"age\": 24 }", top: "80%", right: "-2%", delay: "2.1s", tilt: "-7deg", size: "text-xs" },
  { text: "CHECK (age BETWEEN 0 AND 150)", top: "46%", left: "-9%", delay: "2.8s", tilt: "-3deg", size: "text-[10px]" },
];

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
        scrolled ? "bg-ink/90 backdrop-blur-md border-edge/70 py-2.5" : "bg-transparent border-transparent py-4"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center gap-4">
        <a href="#top" className="flex items-center gap-2.5 group">
          <span className="text-gopher2 transition-transform duration-300 group-hover:rotate-6">
            <IconGopherMark className="w-8 h-8" />
          </span>
          <span className="font-mono font-bold text-snow text-[15px] tracking-tight">
            users-api<span className="text-gopher2">.go</span>
          </span>
        </a>
        <nav className="ml-auto hidden sm:flex items-center gap-6">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="link-underline font-mono text-[13px] text-fog hover:text-snow transition-colors">
              {n.label}
            </a>
          ))}
        </nav>
        <a
          href="#demo"
          className="chip-press ml-auto sm:ml-4 inline-flex items-center gap-2 font-mono text-xs font-bold px-3.5 py-2 rounded-md bg-gopher/15 text-gopher2 border border-gopher/40 hover:bg-gopher/25 cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-mint pulse-dot" />
          сервер online
        </a>
      </div>
    </header>
  );
}

function Hero() {
  const title = useScramble("CRUD-сервер", 300);
  return (
    <section id="top" className="relative pt-32 md:pt-40 pb-14 md:pb-20 overflow-hidden">
      {/* drifting code tokens */}
      {FLOATERS.map((f) => (
        <span
          key={f.text}
          aria-hidden
          className={`drift absolute hidden lg:block font-mono text-gopher2/25 select-none pointer-events-none ${f.size}`}
          style={{ top: f.top, left: f.left, right: f.right, animationDelay: f.delay, ["--tilt" as string]: f.tilt }}
        >
          {f.text}
        </span>
      ))}

      <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-10 items-center">
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-2.5 font-mono text-[11.5px] text-gopher2 border border-gopher/35 bg-gopher/8 rounded-full px-4 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-gopher2" />
              Go 1.22 · net/http · SQLite · без фреймворков
            </div>
          </Reveal>

          <h1 className="font-display font-black text-snow leading-[1.05] text-[2.4rem] lg:text-[3.3rem] xl:text-[4rem] 2xl:text-[4.4rem]">
            <span className="block min-h-[1.1em] whitespace-nowrap">{title}</span>
            <span className="block mt-1 text-gopher2">
              на Go<span className="text-fog"> для таблицы users</span>
            </span>
          </h1>

          <Reveal delay={200}>
            <p className="mt-7 max-w-xl text-fog text-base sm:text-lg leading-relaxed">
              Готовый веб-сервер с полным набором методов к базе данных:{" "}
              <span className="text-mist">получить, добавить, отредактировать и удалить</span> запись в таблице{" "}
              <code className="font-mono text-gopher2 text-[0.92em]">users</code> с полями{" "}
              <code className="font-mono text-amber text-[0.92em]">name</code> и{" "}
              <code className="font-mono text-amber text-[0.92em]">age</code>. Ниже — живой эмулятор API, весь исходный
              код и инструкция по запуску.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <a
                href="#code"
                className="chip-press inline-flex items-center gap-2.5 font-mono text-sm font-bold px-6 py-3 rounded-lg bg-gopher text-ink hover:bg-gopher2 cursor-pointer"
                style={{ boxShadow: "0 12px 34px -12px rgba(0,173,216,0.6)" }}
              >
                Исходный код
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M4 12h15M13 5.5L19.5 12 13 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              <a
                href="#demo"
                className="chip-press inline-flex items-center gap-2.5 font-mono text-sm font-bold px-6 py-3 rounded-lg border border-edge2 text-mist hover:text-snow hover:border-gopher/50 hover:bg-panel/60 cursor-pointer"
              >
                Живое демо
              </a>
            </div>
          </Reveal>

          <Reveal delay={430}>
            <div className="mt-9 flex flex-wrap gap-2">
              {[
                { m: "GET", p: "/users" },
                { m: "POST", p: "/users" },
                { m: "PUT", p: "/users/{id}" },
                { m: "DELETE", p: "/users/{id}" },
              ].map((r, i) => (
                <a key={r.m} href="#api" className="group flex items-center gap-2 rounded-md border border-edge bg-panel/50 pl-1.5 pr-3 py-1 hover:border-edge2 transition-colors">
                  <MethodChip method={r.m} size="sm" />
                  <code className="font-mono text-xs text-fog group-hover:text-mist transition-colors">{r.p}</code>
                </a>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={250} className="relative">
          <div
            aria-hidden
            className="absolute -inset-8 rounded-[2rem] opacity-60 pointer-events-none"
            style={{ background: "radial-gradient(60% 60% at 60% 40%, rgba(0,173,216,0.14), transparent 70%)" }}
          />
          <Terminal />
        </Reveal>
      </div>

      {/* stats strip */}
      <Reveal delay={150}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-16 md:mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl border border-edge bg-panel/50 divide-x divide-edge/70 divide-y md:divide-y-0">
            {[
              { n: "5", label: "REST-эндпоинтов", note: "включая выборку по id" },
              { n: "3", label: "поля в записи", note: "id · name · age" },
              { n: "1", label: "файл main.go", note: "весь сервер целиком" },
              { n: "0", label: "веб-фреймворков", note: "только стандартная библиотека" },
            ].map((s) => (
              <div key={s.label} className="px-6 py-6">
                <div className="font-display font-extrabold text-4xl text-snow">{s.n}</div>
                <div className="mt-1.5 font-mono text-[12.5px] text-mist">{s.label}</div>
                <div className="font-mono text-[11px] text-fog/70 mt-0.5">{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Marquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className="relative border-y border-edge/70 bg-deep/60 py-3.5 overflow-hidden" aria-hidden>
      <div className="marquee-x flex w-max items-center gap-8">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-8 shrink-0">
            <span className={`font-mono text-[12.5px] whitespace-nowrap ${/^(GET|POST|PUT|DELETE)/.test(t) ? "text-gopher2" : /^\d{3}/.test(t) ? "text-amber" : "text-fog"}`}>
              {t}
            </span>
            <span className="text-gopher/50">✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-edge/70 bg-deep/70 mt-10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex items-center gap-2.5">
          <span className="text-gopher2"><IconGopherMark className="w-7 h-7" /></span>
          <div>
            <div className="font-mono font-bold text-snow text-sm">users-api.go</div>
            <div className="font-mono text-[11px] text-fog">CRUD-сервер на Go · таблица users (name, age) · SQLite</div>
          </div>
        </div>
        <div className="sm:ml-auto flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] text-fog">
          <span>Go 1.22+</span>
          <span className="text-edge2">|</span>
          <span>database/sql</span>
          <span className="text-edge2">|</span>
          <span>modernc.org/sqlite</span>
          <a href="#top" className="link-underline text-gopher2 hover:text-snow transition-colors cursor-pointer">наверх ↑</a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-ink" />
        <div className="absolute inset-0 bg-blueprint" />
        <div
          className="absolute -top-40 -left-40 w-[42rem] h-[42rem] rounded-full opacity-[0.13]"
          style={{ background: "radial-gradient(circle, #00add8 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-1/3 -right-52 w-[36rem] h-[36rem] rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #ffb454 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[30rem] h-[30rem] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #3fd68f 0%, transparent 65%)" }}
        />
        <div className="absolute inset-0 noise-layer" />
      </div>

      <Header />
      <main>
        <Hero />
        <Marquee />
        <Playground />
        <CodeViewer />
        <ApiDocs />
        <Setup />
      </main>
      <Footer />
    </div>
  );
}
