import { ENDPOINTS, type ApiEndpoint } from "../data/sources";
import { highlightLine } from "../lib/highlight";
import { CopyButton, METHOD_STYLE, MethodChip, IconRoutes, Reveal } from "./ui";

function EndpointCard({ ep, index }: { ep: ApiEndpoint; index: number }) {
  const s = METHOD_STYLE[ep.method];
  return (
    <Reveal delay={index * 70} as="article">
      <div
        className="card-lift group rounded-xl border border-edge bg-panel/70 overflow-hidden hover:border-edge2"
        style={{ ["--mc" as string]: s.glow }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = s.border.replace("/40", "/70"))}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
      >
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-edge/70">
          <MethodChip method={ep.method} />
          <code className="font-mono text-[15px] text-snow">{ep.path}</code>
          <span className="ml-auto font-mono text-[11px] text-fog/70">{ep.response.status}</span>
        </div>

        <div className="px-5 py-4">
          <h3 className="font-display font-semibold text-mist text-base mb-1.5">{ep.title}</h3>
          <p className="text-sm text-fog leading-relaxed mb-4">{ep.desc}</p>

          <div className="grid md:grid-cols-2 gap-3">
            {/* request */}
            <div className="rounded-lg border border-edge/70 bg-deep/70 overflow-hidden">
              <div className="px-3.5 py-2 border-b border-edge/60 font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
                запрос {ep.request?.note ? `· ${ep.request.note}` : ""}
              </div>
              <div className="p-3.5">
                {ep.request?.body ? (
                  <pre className="font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-mist">
                    {highlightLine(ep.request.body, "json")}
                  </pre>
                ) : ep.method === "GET" || ep.method === "DELETE" ? (
                  <div className="font-mono text-[11.5px] text-fog/70 italic">без тела запроса</div>
                ) : null}
                <div className="mt-3 pt-3 border-t border-edge/50">
                  <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all text-fog">
                    {highlightLine(ep.curl, "bash")}
                  </pre>
                </div>
              </div>
            </div>

            {/* response */}
            <div className="rounded-lg border border-edge/70 bg-deep/70 overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-edge/60">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">ответ</span>
                <span className={`font-mono text-[10.5px] font-bold ${ep.response.status.startsWith("2") ? "text-mint" : "text-amber"}`}>
                  {ep.response.status}
                </span>
              </div>
              <div className="p-3.5">
                <pre className="font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap break-all text-mist">
                  {ep.response.body.startsWith("(") ? (
                    <span className="text-fog/70 italic">{ep.response.body}</span>
                  ) : (
                    highlightLine(ep.response.body, "json")
                  )}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-3">
            <code className="font-mono text-[11px] text-fog/60 break-all">Content-Type: application/json</code>
            <CopyButton text={ep.curl} label="curl" />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function ApiDocs() {
  return (
    <section id="api" className="relative py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-[330px_1fr] gap-10 lg:gap-14 items-start">
          {/* sticky intro */}
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs text-gopher2 tracking-[0.25em]">03</span>
                <span className="h-px w-10 bg-gopher/40" />
                <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-fog">
                  <span className="text-gopher2"><IconRoutes className="w-4 h-4" /></span>
                  справочник REST
                </span>
              </div>
              <h2 className="font-display font-extrabold text-snow text-3xl sm:text-4xl leading-[1.12]">
                <span className="mask-line"><span>Пять методов —</span></span>
                <span className="mask-line"><span>полный CRUD</span></span>
              </h2>
              <p className="mt-4 text-fog leading-relaxed">
                Все эндпоинты живут на <code className="font-mono text-gopher2 text-sm">localhost:8080</code> и отдают JSON.
                Ошибки — тоже JSON: <code className="font-mono text-[13px] text-mist">{"{ \"error\": \"...\" }"}</code> с
                подходящим HTTP-статусом.
              </p>

              <div className="mt-7 space-y-2.5">
                {[
                  { m: "GET", d: "чтение — записи не меняются" },
                  { m: "POST", d: "создание — возвращает 201 и новый id" },
                  { m: "PUT", d: "обновление — полная замена полей" },
                  { m: "DELETE", d: "удаление — 204 без тела" },
                ].map((r) => (
                  <div key={r.m} className="flex items-center gap-3">
                    <MethodChip method={r.m} size="sm" />
                    <span className="text-[13px] text-fog">{r.d}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-lg border border-amber/25 bg-amber/6 px-4 py-3">
                <div className="font-mono text-[11px] text-amber mb-1">проверки сервера</div>
                <ul className="text-[13px] text-fog space-y-1 leading-relaxed list-none">
                  <li>· name — непустая строка</li>
                  <li>· age — целое число от 0 до 150</li>
                  <li>· id в пути — только цифры, иначе 400</li>
                </ul>
              </div>
            </Reveal>
          </div>

          {/* endpoints */}
          <div className="space-y-5">
            {ENDPOINTS.map((ep, i) => (
              <EndpointCard key={ep.method + ep.path} ep={ep} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
