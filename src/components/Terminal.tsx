import { useEffect, useRef, useState } from "react";
import { highlightLine } from "../lib/highlight";
import { usePrefersReducedMotion } from "./ui";

interface Scenario {
  cmd: string;
  status: string;
  statusOk: boolean;
  body: string[];
  log: string;
}

const SCENARIOS: Scenario[] = [
  {
    cmd: `curl -s -X POST localhost:8080/users -d '{"name":"Анна","age":24}'`,
    status: "HTTP/1.1 201 Created",
    statusOk: true,
    body: [`{ "id": 4, "name": "Анна", "age": 24 }`],
    log: "POST /users — 412µs",
  },
  {
    cmd: `curl -s localhost:8080/users`,
    status: "HTTP/1.1 200 OK",
    statusOk: true,
    body: [
      `[`,
      `  { "id": 1, "name": "Иван",  "age": 31 },`,
      `  { "id": 2, "name": "Мария", "age": 24 },`,
      `  { "id": 3, "name": "Пётр",  "age": 47 },`,
      `  { "id": 4, "name": "Анна",  "age": 24 }`,
      `]`,
    ],
    log: "GET /users — 289µs",
  },
  {
    cmd: `curl -s -X PUT localhost:8080/users/4 -d '{"name":"Анна","age":25}'`,
    status: "HTTP/1.1 200 OK",
    statusOk: true,
    body: [`{ "id": 4, "name": "Анна", "age": 25 }`],
    log: "PUT /users/4 — 358µs",
  },
  {
    cmd: `curl -s -o /dev/null -w "%{http_code}" -X DELETE localhost:8080/users/1`,
    status: "HTTP/1.1 204 No Content",
    statusOk: true,
    body: [`(пустое тело — запись удалена)`],
    log: "DELETE /users/1 — 197µs",
  },
];

export default function Terminal() {
  const reduced = usePrefersReducedMotion();
  const [sIdx, setSIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [respShown, setRespShown] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const timers = useRef<number[]>([]);

  const sc = SCENARIOS[sIdx % SCENARIOS.length];
  const totalResp = sc.body.length + 1; // status + body lines

  useEffect(() => {
    if (reduced) {
      setChars(sc.cmd.length);
      setRespShown(totalResp);
      setShowLog(true);
      return;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setChars(0);
    setRespShown(0);
    setShowLog(false);

    const typeDelay = 24;
    for (let i = 1; i <= sc.cmd.length; i++) {
      timers.current.push(window.setTimeout(() => setChars(i), 500 + i * typeDelay));
    }
    const cmdDone = 500 + sc.cmd.length * typeDelay;
    for (let i = 1; i <= totalResp; i++) {
      timers.current.push(window.setTimeout(() => setRespShown(i), cmdDone + 260 + i * 130));
    }
    timers.current.push(window.setTimeout(() => setShowLog(true), cmdDone + 260 + totalResp * 130 + 200));
    timers.current.push(
      window.setTimeout(() => setSIdx((v) => v + 1), cmdDone + 260 + totalResp * 130 + 2600)
    );
    return () => timers.current.forEach(clearTimeout);
  }, [sIdx, reduced, sc.cmd.length, totalResp]);

  const typed = sc.cmd.slice(0, chars);
  const doneTyping = chars >= sc.cmd.length;

  return (
    <div className="relative rounded-xl border border-edge bg-deep/90 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-edge bg-panel/70">
        <span className="w-3 h-3 rounded-full bg-coral/80" />
        <span className="w-3 h-3 rounded-full bg-amber/80" />
        <span className="w-3 h-3 rounded-full bg-mint/80" />
        <span className="ml-3 font-mono text-xs text-fog">users-api — zsh · 80×24</span>
        <span className="ml-auto hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-mint">
          <span className="w-1.5 h-1.5 rounded-full bg-mint pulse-dot" /> :8080
        </span>
      </div>

      {/* body */}
      <div className="relative p-4 sm:p-5 font-mono text-[12.5px] sm:text-[13px] leading-[1.75] min-h-[340px]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-gopher/6 to-transparent scanline" />

        <div className="text-fog">
          <span className="text-mint">➜</span> <span className="text-gopher2">~/users-api</span>
        </div>

        <div className="flex flex-wrap items-start">
          <span className="text-fog mr-2 select-none">$</span>
          <span className="text-snow break-all whitespace-pre-wrap">
            {highlightLine(typed, "bash")}
            {!doneTyping && <span className="caret-blink text-gopher2">▌</span>}
          </span>
        </div>

        {doneTyping && respShown > 0 && (
          <div className="mt-1">
            <div
              className={`log-in font-semibold ${sc.statusOk ? "text-mint" : "text-coral"}`}
              style={{ opacity: respShown >= 1 ? 1 : 0 }}
            >
              {sc.status}
            </div>
            {sc.body.map((line, i) => (
              <div
                key={i}
                className="log-in text-mist whitespace-pre"
                style={{ opacity: respShown >= i + 2 ? 1 : 0 }}
              >
                {line.startsWith("(") ? <span className="text-fog italic">{line}</span> : highlightLine(line, "json")}
              </div>
            ))}
            <div
              className="log-in mt-3 pt-2 border-t border-edge/60 text-[11px] text-fog/80 italic"
              style={{ opacity: showLog ? 1 : 0 }}
            >
              <span className="text-gopher2 not-italic">[server]</span> {sc.log}
            </div>
          </div>
        )}
      </div>

      {/* scenario dots */}
      <div className="flex items-center gap-1.5 px-4 pb-3.5">
        {SCENARIOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setSIdx(i)}
            aria-label={`Сценарий ${i + 1}`}
            className={`chip-press h-1.5 rounded-full cursor-pointer ${
              i === sIdx % SCENARIOS.length ? "w-6 bg-gopher2" : "w-2.5 bg-edge2 hover:bg-fog/50"
            }`}
          />
        ))}
        <span className="ml-auto font-mono text-[10px] text-fog/70">живая демонстрация API</span>
      </div>
    </div>
  );
}
