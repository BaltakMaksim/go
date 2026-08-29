import { useMemo, useState } from "react";
import { GO_MOD, MAIN_GO, SCHEMA_SQL } from "../data/sources";
import { countLines, highlightLine, type Lang } from "../lib/highlight";
import { CopyButton, IconCode, SectionHeading, Reveal } from "./ui";

interface FileTab {
  name: string;
  lang: Lang;
  code: string;
  note: string;
}

const FILES: FileTab[] = [
  {
    name: "main.go",
    lang: "go",
    code: MAIN_GO,
    note: "весь сервер: роуты, обработчики CRUD, валидация, middleware",
  },
  {
    name: "go.mod",
    lang: "text",
    code: GO_MOD,
    note: "модуль и единственная зависимость — драйвер SQLite",
  },
  {
    name: "schema.sql",
    lang: "sql",
    code: SCHEMA_SQL,
    note: "DDL таблицы users — сервер выполнит её сам при старте",
  },
];

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" aria-hidden>
      <path d="M6 3.5h8l4 4v13H6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3.5v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export default function CodeViewer() {
  const [tab, setTab] = useState(0);
  const file = FILES[tab];

  const lines = useMemo(() => file.code.replace(/\n$/, "").split("\n"), [file]);
  const meaningful = useMemo(() => countLines(file.code), [file]);

  return (
    <section id="code" className="relative py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <SectionHeading
          index="02"
          icon={<IconCode className="w-4 h-4" />}
          kicker="исходный код"
          title="Один файл — весь сервер"
          desc="Только стандартная библиотека net/http и чистый Go-драйвер SQLite (modernc.org/sqlite — не требует cgo). Роутинг с методами и параметрами пути — встроенный, доступен с Go 1.22."
        />

        <Reveal>
          <div className="rounded-xl border border-edge bg-deep/90 overflow-hidden shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
            {/* tabs */}
            <div className="flex items-end gap-1 px-3 pt-3 border-b border-edge bg-panel/80 overflow-x-auto code-scroll">
              {FILES.map((f, i) => (
                <button
                  key={f.name}
                  onClick={() => setTab(i)}
                  className={`chip-press shrink-0 inline-flex items-center gap-2 font-mono text-xs px-4 py-2.5 rounded-t-lg border border-b-0 cursor-pointer transition-colors ${
                    i === tab
                      ? "text-snow bg-deep border-edge"
                      : "text-fog bg-transparent border-transparent hover:text-mist"
                  }`}
                >
                  <span className={i === tab ? "text-gopher2" : "text-fog/60"}>
                    <FileIcon />
                  </span>
                  {f.name}
                </button>
              ))}
              <div className="ml-auto hidden md:flex items-center gap-3 pb-2.5 pl-4">
                <span className="font-mono text-[11px] text-fog">{meaningful} строк кода</span>
                <CopyButton text={file.code} label={`Копировать ${file.name}`} />
              </div>
            </div>

            <div className="md:hidden px-4 py-3 border-b border-edge bg-panel/50">
              <CopyButton text={file.code} label={`Копировать ${file.name}`} />
            </div>

            {/* code */}
            <div className="relative">
              <div className="code-scroll overflow-auto max-h-[620px]">
                <table className="w-full border-collapse font-mono text-[12.5px] leading-[1.7]">
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i} className="hover:bg-panel/40">
                        <td className="select-none text-right pr-4 pl-4 text-fog/45 text-[11px] w-12 align-top sticky left-0 bg-deep/95 border-r border-edge/50">
                          {i + 1}
                        </td>
                        <td className="pl-4 pr-6 whitespace-pre text-mist">
                          {line.length ? highlightLine(line, file.lang) : "\u00A0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 border-t border-edge bg-panel/70 font-mono text-[11px] text-fog">
              <span className="text-gopher2">●</span> {file.note}
              <span className="ml-auto hidden sm:inline text-fog/60">UTF-8 · Go · LF</span>
            </div>
          </div>
        </Reveal>

        {/* key points under the code */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            {
              t: "mux.HandleFunc(\"GET /users/{id}\", …)",
              d: "Метод и параметр пути объявляются прямо в шаблоне маршрута — без сторонних роутеров. id достаётся через r.PathValue.",
            },
            {
              t: "CHECK-ограничения в SQL",
              d: "name не пустое и age от 0 до 150 гарантированы и на уровне Go-валидации, и на уровне самой таблицы.",
            },
            {
              t: "404 и RowsAffected",
              d: "UPDATE и DELETE проверяют res.RowsAffected(): если затронут 0 строк — значит записи нет, и клиент получает честные 404.",
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 110} className="card-lift rounded-xl border border-edge bg-panel/60 p-5 hover:border-gopher/40">
              <div className="font-mono text-[12.5px] text-gopher2 mb-2.5 break-all">{c.t}</div>
              <p className="text-sm text-fog leading-relaxed">{c.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
