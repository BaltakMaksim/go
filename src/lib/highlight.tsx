import type { ReactNode } from "react";

export type Lang = "go" | "json" | "bash" | "sql" | "text";

const GO_KEYWORDS = new Set([
  "func", "package", "import", "return", "if", "else", "for", "range",
  "var", "const", "type", "struct", "defer", "go", "chan", "map",
  "interface", "switch", "case", "default", "break", "continue", "select",
  "fallthrough", "goto",
]);

const GO_TYPES = new Set([
  "int", "int8", "int16", "int32", "int64", "uint", "uint8", "uint16",
  "uint32", "uint64", "float32", "float64", "string", "bool", "byte",
  "rune", "error", "any", "uintptr",
]);

const GO_CONSTS = new Set(["true", "false", "nil", "iota"]);

const SQL_KEYWORDS = new Set([
  "CREATE", "TABLE", "IF", "NOT", "EXISTS", "PRIMARY", "KEY", "AUTOINCREMENT",
  "TEXT", "INTEGER", "CHECK", "SELECT", "FROM", "WHERE", "INSERT", "INTO",
  "VALUES", "UPDATE", "SET", "DELETE", "ORDER", "BY", "AND", "BETWEEN",
  "UNIQUE", "NULL", "length",
]);

function span(cls: string, text: string, key: number): ReactNode {
  return (
    <span key={key} className={cls}>
      {text}
    </span>
  );
}

function highlightGo(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  const re =
    /(\/\/.*$)|("(?:[^"\\]|\\.)*"|`[^`]*`)|\b([A-Za-z_][A-Za-z0-9_]*)\b|(\b\d+(?:\.\d+)?\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [full, com, str, word, num] = m;
    if (com !== undefined) out.push(span("tok-com", full, key++));
    else if (str !== undefined) out.push(span("tok-str", full, key++));
    else if (num !== undefined) out.push(span("tok-num", full, key++));
    else if (word !== undefined) {
      if (GO_KEYWORDS.has(word)) out.push(span("tok-kw", word, key++));
      else if (GO_TYPES.has(word)) out.push(span("tok-type", word, key++));
      else if (GO_CONSTS.has(word)) out.push(span("tok-const", word, key++));
      else {
        const rest = line.slice(m.index + word.length);
        if (/^\s*\(/.test(rest)) out.push(span("tok-fn", word, key++));
        else if (/^[A-Z]/.test(word)) out.push(span("tok-type", word, key++));
        else out.push(word);
      }
    }
    last = m.index + full.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

function highlightJson(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?)|\b(true|false|null)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push(span("tok-punct", line.slice(last, m.index), key++));
    const [full, str, colon, num, lit] = m;
    if (str !== undefined) {
      out.push(span(colon ? "tok-key" : "tok-str", str, key++));
      if (colon) out.push(span("tok-punct", colon, key++));
    } else if (num !== undefined) out.push(span("tok-num", full, key++));
    else if (lit !== undefined) out.push(span("tok-const", full, key++));
    last = m.index + full.length;
  }
  if (last < line.length) out.push(span("tok-punct", line.slice(last), key++));
  return out;
}

function highlightBash(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  const re = /(#.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(https?:\/\/[^\s"']+)|(^|\s)(--?[A-Za-z][\w-]*)|\b(curl|go|cd|mkdir|sqlite3|cat)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [full, com, str, url, pre, flag, cmd] = m;
    if (com !== undefined) out.push(span("tok-com", full, key++));
    else if (str !== undefined) out.push(span("tok-str", full, key++));
    else if (url !== undefined) out.push(span("tok-fn", full, key++));
    else if (flag !== undefined) out.push(span("tok-flag", pre + flag, key++));
    else if (cmd !== undefined) out.push(span("tok-cmd", full, key++));
    last = m.index + full.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

function highlightSql(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  const re = /(--.*$)|('[^']*')|(\b\d+\b)|\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [full, com, str, num, word] = m;
    if (com !== undefined) out.push(span("tok-com", full, key++));
    else if (str !== undefined) out.push(span("tok-str", full, key++));
    else if (num !== undefined) out.push(span("tok-num", full, key++));
    else if (word !== undefined) {
      const up = word.toUpperCase();
      if (SQL_KEYWORDS.has(up)) out.push(span("tok-kw", word, key++));
      else if (SQL_KEYWORDS.has(word)) out.push(span("tok-kw", word, key++));
      else out.push(word);
    }
    last = m.index + full.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export function highlightLine(line: string, lang: Lang): ReactNode[] {
  switch (lang) {
    case "go":
      return highlightGo(line);
    case "json":
      return highlightJson(line);
    case "bash":
      return highlightBash(line);
    case "sql":
      return highlightSql(line);
    default:
      return [line];
  }
}

export function countLines(code: string): number {
  return code.split("\n").filter((l) => l.trim().length > 0).length;
}
