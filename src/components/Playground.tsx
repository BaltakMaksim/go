import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RANDOM_NAMES, SEED_USERS, type HttpMethod } from "../data/sources";
import { highlightLine } from "../lib/highlight";
import { MethodChip, METHOD_STYLE, IconReset, IconSend, SectionHeading, IconDb, Reveal } from "./ui";

interface DbUser {
  id: number;
  name: string;
  age: number;
}

interface LogEntry {
  id: number;
  time: string;
  method: HttpMethod;
  path: string;
  status: number;
  statusText: string;
  body: string;
  ms: number;
}

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  404: "Not Found",
  405: "Method Not Allowed",
};

const LS_KEY = "users-api-demo-db-v1";

function loadDb(): { users: DbUser[]; nextId: number } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users) && typeof parsed.nextId === "number") return parsed;
    }
  } catch {
    /* ignore */
  }
  return { users: SEED_USERS.map((u) => ({ ...u })), nextId: SEED_USERS.length + 1 };
}

const HINTS: Record<HttpMethod, string> = {
  GET: "/users  или  /users/2",
  POST: "/users",
  PUT: "/users/2",
  DELETE: "/users/2",
};

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" aria-hidden>
      <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14.5 6.5l3 3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" aria-hidden>
      <path d="M4.5 6.5h15M9.5 6V4.5h5V6M7 6.5l.8 12a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4l.8-12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.2 10.5v6M13.8 10.5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Playground() {
  const [dbState, setDbState] = useState(loadDb);
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [path, setPath] = useState("/users");
  const [name, setName] = useState("Анна");
  const [age, setAge] = useState("24");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [flash, setFlash] = useState<Record<number, "new" | "upd">>({});
  const [requests, setRequests] = useState(0);
  const logId = useRef(1);

  const users = dbState.users;

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(dbState));
    } catch {
      /* ignore */
    }
  }, [dbState]);

  useEffect(() => {
    if (Object.keys(flash).length === 0) return;
    const t = window.setTimeout(() => setFlash({}), 1500);
    return () => window.clearTimeout(t);
  }, [flash]);

  const pushLog = useCallback((entry: Omit<LogEntry, "id" | "time" | "ms">) => {
    setRequests((r) => r + 1);
    setLogs((prev) =>
      [
        {
          ...entry,
          id: logId.current++,
          time: new Date().toLocaleTimeString("ru-RU"),
          ms: 1 + Math.floor(Math.random() * 13),
        },
        ...prev,
      ].slice(0, 9)
    );
  }, []);

  const send = useCallback(
    (m: HttpMethod, rawPath: string, bodyName: string, bodyAge: string) => {
      const p = rawPath.trim();
      const norm = p.startsWith("/") ? p : `/${p}`;

      const finish = (status: number, body: unknown, mutate?: (prev: { users: DbUser[]; nextId: number }) => { users: DbUser[]; nextId: number }) => {
        if (mutate) setDbState((prev) => mutate(prev));
        pushLog({
          method: m,
          path: norm === "//" ? "/" : norm,
          status,
          statusText: STATUS_TEXT[status] ?? "",
          body:
            status === 204
              ? ""
              : typeof body === "string"
                ? body
                : Array.isArray(body)
                  ? JSON.stringify(body)
                  : JSON.stringify(body, null, 2),
        });
      };

      // --- маршрутизация, как в http.ServeMux ---
      if (norm === "/users" || norm === "/users/") {
        if (m === "GET") return finish(200, users);
        if (m === "POST") {
          const trimmed = bodyName.trim();
          const ageNum = bodyAge.trim() === "" ? 0 : Number(bodyAge);
          if (trimmed === "") return finish(400, { error: 'поле "name" не должно быть пустым' });
          if (Number.isNaN(ageNum) || !Number.isFinite(ageNum))
            return finish(400, { error: "некорректное JSON-тело" });
          if (ageNum < 0 || ageNum > 150) return finish(400, { error: 'поле "age" должно быть от 0 до 150' });
          let created: DbUser | null = null;
          finish(201, null, (prev) => {
            created = { id: prev.nextId, name: trimmed, age: Math.trunc(ageNum) };
            return { users: [...prev.users, created], nextId: prev.nextId + 1 };
          });
          if (created) setFlash({ [(created as DbUser).id]: "new" });
          return;
        }
        return finish(405, { error: `метод ${m} не разрешён для /users` });
      }

      const idMatch = norm.match(/^\/users\/([^/]+)\/?$/);
      if (idMatch) {
        const rawId = idMatch[1];
        if (!/^\d+$/.test(rawId)) return finish(400, { error: "некорректный ID" });
        const id = parseInt(rawId, 10);
        const existing = users.find((u) => u.id === id);

        if (m === "GET") {
          if (!existing) return finish(404, { error: "пользователь не найден" });
          return finish(200, existing);
        }
        if (m === "PUT") {
          const trimmed = bodyName.trim();
          const ageNum = bodyAge.trim() === "" ? 0 : Number(bodyAge);
          if (trimmed === "") return finish(400, { error: 'поле "name" не должно быть пустым' });
          if (Number.isNaN(ageNum) || !Number.isFinite(ageNum))
            return finish(400, { error: "некорректное JSON-тело" });
          if (ageNum < 0 || ageNum > 150) return finish(400, { error: 'поле "age" должно быть от 0 до 150' });
          if (!existing) return finish(404, { error: "пользователь не найден" });
          finish(200, { id, name: trimmed, age: Math.trunc(ageNum) }, (prev) => ({
            ...prev,
            users: prev.users.map((u) => (u.id === id ? { ...u, name: trimmed, age: Math.trunc(ageNum) } : u)),
          }));
          setFlash({ [id]: "upd" });
          return;
        }
        if (m === "DELETE") {
          if (!existing) return finish(404, { error: "пользователь не найден" });
          return finish(204, null, (prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== id) }));
        }
        return finish(405, { error: `метод ${m} не разрешён для /users/{id}` });
      }

      return finish(404, { error: `маршрут ${m} ${norm} не найден` });
    },
    [users, pushLog]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(method, path, name, age);
  };

  const randomUser = () => {
    setMethod("POST");
    setPath("/users");
    setName(RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]);
    setAge(String(18 + Math.floor(Math.random() * 55)));
  };

  const editUser = (u: DbUser) => {
    setMethod("PUT");
    setPath(`/users/${u.id}`);
    setName(u.name);
    setAge(String(u.age));
  };

  const resetDb = () => {
    setDbState({ users: SEED_USERS.map((u) => ({ ...u })), nextId: SEED_USERS.length + 1 });
    setLogs([]);
    setFlash({});
  };

  const avgAge = useMemo(
    () => (users.length ? Math.round(users.reduce((s, u) => s + u.age, 0) / users.length) : 0),
    [users]
  );

  const needsBody = method === "POST" || method === "PUT";

  return (
    <section id="demo" className="relative py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <SectionHeading
          index="01"
          icon={<IconDb className="w-4 h-4" />}
          kicker="живая демонстрация"
          title="Покликайте сервер прямо здесь"
          desc="Ниже — точная копия логики Go-сервера, запущенная в браузере: те же маршруты, проверки и коды ответов. Таблица users — это ваша «база данных» (сохраняется в localStorage)."
        />

        <div className="grid lg:grid-cols-[1fr_1.08fr] gap-6 items-start">
          {/* ------------ DB table ------------ */}
          <Reveal className="rounded-xl border border-edge bg-panel/70 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-edge bg-panel2/60">
              <IconDb className="w-5 h-5 text-gopher2" />
              <div>
                <div className="font-mono text-sm text-snow">users.db</div>
                <div className="font-mono text-[11px] text-fog">SQLite · таблица users</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="font-mono text-[11px] text-fog hidden sm:inline">{users.length} зап. · ср. возраст {avgAge}</span>
                <button
                  onClick={resetDb}
                  className="chip-press inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1.5 rounded-md border border-edge text-fog hover:text-snow hover:border-edge2 cursor-pointer"
                  title="Вернуть демо-данные"
                >
                  <IconReset className="w-3.5 h-3.5" /> сброс
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog border-b border-edge">
                    <th className="px-5 py-2.5 font-medium">id</th>
                    <th className="px-3 py-2.5 font-medium">name <span className="text-gopher2">TEXT</span></th>
                    <th className="px-3 py-2.5 font-medium">age <span className="text-amber">INT</span></th>
                    <th className="px-5 py-2.5 font-medium text-right">действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center font-mono text-sm text-fog">
                        таблица пуста — отправьте <span className="text-mint">POST /users</span>
                      </td>
                    </tr>
                  )}
                  {users.map((u) => (
                    <tr
                      key={`${u.id}-${flash[u.id] ?? "none"}`}
                      className={`group border-b border-edge/60 last:border-0 transition-colors hover:bg-panel2/50 ${
                        flash[u.id] === "new" ? "flash-new" : flash[u.id] === "upd" ? "flash-upd" : ""
                      }`}
                    >
                      <td className="px-5 py-3 font-mono text-sm text-gopher2">{u.id}</td>
                      <td className="px-3 py-3 text-snow text-[15px]">{u.name}</td>
                      <td className="px-3 py-3 font-mono text-sm text-mist">{u.age}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => editUser(u)}
                            className="chip-press p-1.5 rounded-md border border-edge text-fog hover:text-amber hover:border-amber/50 cursor-pointer"
                            title={`PUT /users/${u.id} — отредактировать`}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            onClick={() => send("DELETE", `/users/${u.id}`, "", "")}
                            className="chip-press p-1.5 rounded-md border border-edge text-fog hover:text-coral hover:border-coral/50 cursor-pointer"
                            title={`DELETE /users/${u.id} — удалить`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1 px-5 py-3.5 border-t border-edge bg-deep/60 font-mono text-[11px] text-fog">
              <span>запросов: <span className="text-snow">{requests}</span></span>
              <span>записей: <span className="text-snow">{users.length}</span></span>
              <span>след. id: <span className="text-gopher2">{dbState.nextId}</span></span>
            </div>
          </Reveal>

          {/* ------------ request builder + console ------------ */}
          <Reveal delay={120} className="space-y-6">
            <form onSubmit={onSubmit} className="rounded-xl border border-edge bg-panel/70 p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog mb-4">конструктор запроса</div>

              <div className="flex flex-wrap gap-2 mb-4">
                {(["GET", "POST", "PUT", "DELETE"] as HttpMethod[]).map((mth) => {
                  const s = METHOD_STYLE[mth];
                  const active = method === mth;
                  return (
                    <button
                      type="button"
                      key={mth}
                      onClick={() => {
                        setMethod(mth);
                        if (mth === "POST") setPath("/users");
                        else if (mth === "GET" && !path.includes("/users/")) setPath("/users");
                      }}
                      className={`chip-press font-mono text-xs font-bold px-3.5 py-2 rounded-md border cursor-pointer ${
                        active ? `${s.text} ${s.bg} ${s.border}` : "text-fog border-edge hover:text-snow hover:border-edge2"
                      }`}
                      style={active ? { boxShadow: `0 0 22px -6px ${s.glow}` } : undefined}
                    >
                      {mth}
                    </button>
                  );
                })}
              </div>

              <label className="block mb-4">
                <span className="font-mono text-[11px] text-fog block mb-1.5">
                  URL <span className="text-fog/60">· подсказка: {HINTS[method]}</span>
                </span>
                <div className="flex items-stretch rounded-md border border-edge bg-deep/70 focus-within:border-gopher/60 transition-colors overflow-hidden">
                  <span className="flex items-center px-3 font-mono text-xs text-fog border-r border-edge bg-panel2/50">
                    localhost:8080
                  </span>
                  <input
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent px-3 py-2.5 font-mono text-sm text-snow outline-none placeholder:text-fog/40"
                    placeholder={HINTS[method]}
                    spellCheck={false}
                  />
                </div>
              </label>

              {needsBody && (
                <div className="grid grid-cols-[1fr_110px] gap-3 mb-4">
                  <label className="block">
                    <span className="font-mono text-[11px] text-fog block mb-1.5">"name"</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-md border border-edge bg-deep/70 px-3 py-2.5 font-mono text-sm text-snow outline-none focus:border-gopher/60 transition-colors placeholder:text-fog/40"
                      placeholder="Анна"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[11px] text-fog block mb-1.5">"age"</span>
                    <input
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full rounded-md border border-edge bg-deep/70 px-3 py-2.5 font-mono text-sm text-snow outline-none focus:border-gopher/60 transition-colors placeholder:text-fog/40"
                      placeholder="24"
                      inputMode="numeric"
                    />
                  </label>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="chip-press inline-flex items-center gap-2 font-mono text-sm font-bold px-5 py-2.5 rounded-md bg-gopher text-ink hover:bg-gopher2 cursor-pointer"
                  style={{ boxShadow: "0 8px 26px -10px rgba(0,173,216,0.55)" }}
                >
                  <IconSend className="w-4 h-4" /> Отправить
                </button>
                <button
                  type="button"
                  onClick={randomUser}
                  className="chip-press inline-flex items-center gap-2 font-mono text-xs px-4 py-2.5 rounded-md border border-edge text-fog hover:text-snow hover:border-edge2 cursor-pointer"
                >
                  случайный POST
                </button>
                <span className="font-mono text-[11px] text-fog/70 ml-auto hidden md:inline">Enter — тоже отправит</span>
              </div>
            </form>

            {/* console */}
            <div className="rounded-xl border border-edge bg-deep/90 overflow-hidden">
              <div className="flex items-center px-5 py-3 border-b border-edge bg-panel/70">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog">консоль ответов</span>
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-mint">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint pulse-dot" /> online
                </span>
              </div>
              <div className="p-4 min-h-[220px] max-h-[330px] overflow-y-auto code-scroll space-y-2.5">
                {logs.length === 0 && (
                  <div className="font-mono text-xs text-fog/70 pt-6 text-center">
                    // здесь появятся ответы сервера —<br />попробуйте GET /users
                  </div>
                )}
                {logs.map((l) => {
                  const ok = l.status < 400;
                  return (
                    <div key={l.id} className="log-in rounded-lg border border-edge/70 bg-panel/50 px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="font-mono text-[10px] text-fog/70">{l.time}</span>
                        <MethodChip method={l.method} size="sm" />
                        <span className="font-mono text-xs text-snow break-all">{l.path}</span>
                        <span
                          className={`ml-auto font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                            ok ? "text-mint bg-mint/10" : "text-coral bg-coral/10"
                          }`}
                        >
                          {l.status} {l.statusText}
                        </span>
                        <span className="font-mono text-[10px] text-fog/60">{l.ms} мс</span>
                      </div>
                      {l.body && (
                        <pre className="mt-2 font-mono text-[11.5px] leading-relaxed text-mist whitespace-pre-wrap break-all">
                          {highlightLine(l.body, "json")}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
