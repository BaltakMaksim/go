import { highlightLine } from "../lib/highlight";
import { CopyButton, IconRocket, SectionHeading, Reveal, IconArrow } from "./ui";

const STEPS = [
  {
    n: "1",
    title: "Создайте проект",
    desc: "Достаточно Go 1.22+ — проверьте версию командой go version. Папка проекта и модуль:",
    cmds: ["mkdir users-api && cd users-api", "go mod init users-api"],
  },
  {
    n: "2",
    title: "Положите код",
    desc: "Скопируйте main.go из раздела «Исходный код» в корень папки и подтяните единственную зависимость:",
    cmds: ["go get modernc.org/sqlite", "go mod tidy"],
  },
  {
    n: "3",
    title: "Запустите сервер",
    desc: "Сервер сам создаст users.db, таблицу users и наполнит её тремя демо-записями:",
    cmds: ["go run ."],
    out: "сервер запущен: http://localhost:8080",
  },
  {
    n: "4",
    title: "Проверьте CRUD",
    desc: "Из второго терминала пройдитесь по всем четырём операциям:",
    cmds: [
      `curl localhost:8080/users`,
      `curl -X POST localhost:8080/users -d '{"name":"Анна","age":24}'`,
      `curl -X PUT localhost:8080/users/4 -d '{"name":"Анна","age":25}'`,
      `curl -X DELETE localhost:8080/users/3`,
    ],
  },
];

export default function Setup() {
  return (
    <section id="setup" className="relative py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <SectionHeading
          index="04"
          icon={<IconRocket className="w-4 h-4" />}
          kicker="запуск за минуту"
          title="От нуля до работающего API"
          desc="Никакого Docker и внешних баз: SQLite хранится в одном файле users.db рядом с бинарником, а сервер поднимается одной командой."
        />

        <div className="grid md:grid-cols-2 gap-5">
          {STEPS.map((st, i) => (
            <Reveal key={st.n} delay={i * 90} className="card-lift rounded-xl border border-edge bg-panel/70 p-6 hover:border-gopher/40 flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <span className="font-display font-extrabold text-3xl text-gopher2/90 leading-none">{st.n}</span>
                <div>
                  <h3 className="font-display font-semibold text-snow text-lg leading-snug">{st.title}</h3>
                  <p className="text-sm text-fog mt-1.5 leading-relaxed">{st.desc}</p>
                </div>
              </div>

              <div className="mt-auto rounded-lg border border-edge/80 bg-deep/80 overflow-hidden">
                <div className="px-4 py-3 space-y-1.5">
                  {st.cmds.map((c) => (
                    <div key={c} className="font-mono text-[12.5px] leading-relaxed flex items-start gap-2">
                      <span className="text-mint select-none">$</span>
                      <span className="text-mist break-all">{highlightLine(c, "bash")}</span>
                    </div>
                  ))}
                  {st.out && (
                    <div className="font-mono text-[12px] text-gopher2 pt-1.5 flex items-center gap-2">
                      <IconArrow className="w-3.5 h-3.5 rotate-90" /> {st.out}
                    </div>
                  )}
                </div>
                <div className="flex justify-end px-3 py-2 border-t border-edge/60 bg-panel/50">
                  <CopyButton text={st.cmds.join("\n")} label="Команды" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150}>
          <div className="mt-8 rounded-xl border border-edge bg-deep/70 px-6 py-5 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="font-mono text-xs text-fog uppercase tracking-[0.2em]">что появится на диске</div>
            <div className="flex flex-wrap gap-x-7 gap-y-2 font-mono text-[13px]">
              <span className="text-snow">users-api/<span className="text-fog/50">├</span> <span className="text-gopher2">main.go</span></span>
              <span className="text-snow">├ <span className="text-mist">go.mod</span></span>
              <span className="text-snow">├ <span className="text-mist">go.sum</span></span>
              <span className="text-snow">└ <span className="text-amber">users.db</span> <span className="text-fog/60 text-[11px]">← создастся автоматически</span></span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
