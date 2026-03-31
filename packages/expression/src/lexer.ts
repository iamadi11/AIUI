import { ExpressionError } from "./errors";

export type Token =
  | { type: "eof"; offset: number }
  | { type: "number"; value: number; offset: number }
  | { type: "string"; value: string; offset: number }
  | { type: "ident"; value: string; offset: number }
  | { type: "true"; offset: number }
  | { type: "false"; offset: number }
  | { type: "null"; offset: number }
  | {
      type: "sym";
      value:
        | "+"
        | "-"
        | "*"
        | "/"
        | "%"
        | "!"
        | "("
        | ")"
        | "."
        | "<"
        | ">"
        | "||"
        | "&&"
        | "=="
        | "!="
        | "<="
        | ">=";
      offset: number;
    };

const MAX_SOURCE_LEN = 10_000;

function readString(
  source: string,
  start: number,
  quote: "'" | '"',
): { value: string; end: number } {
  let i = start + 1;
  let out = "";
  while (i < source.length) {
    const c = source[i]!;
    if (c === quote) {
      return { value: out, end: i + 1 };
    }
    if (c === "\\") {
      i += 1;
      if (i >= source.length) {
        throw new ExpressionError("Unterminated string escape", start);
      }
      const e = source[i]!;
      switch (e) {
        case "n":
          out += "\n";
          break;
        case "t":
          out += "\t";
          break;
        case "r":
          out += "\r";
          break;
        case "\\":
        case "'":
        case '"':
          out += e;
          break;
        default:
          out += e;
      }
      i += 1;
      continue;
    }
    out += c;
    i += 1;
  }
  throw new ExpressionError("Unterminated string", start);
}

export function tokenize(source: string): Token[] {
  if (source.length > MAX_SOURCE_LEN) {
    throw new ExpressionError("Expression too long", 0);
  }
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i]!;
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i += 1;
      continue;
    }
    const offset = i;

    if (c === '"' || c === "'") {
      const { value, end } = readString(source, i, c as "'" | '"');
      tokens.push({ type: "string", value, offset });
      i = end;
      continue;
    }

    if (c >= "0" && c <= "9") {
      let j = i + 1;
      while (j < source.length) {
        const d = source[j]!;
        if ((d >= "0" && d <= "9") || d === ".") {
          j += 1;
        } else {
          break;
        }
      }
      const raw = source.slice(i, j);
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        throw new ExpressionError(`Invalid number: ${raw}`, offset);
      }
      tokens.push({ type: "number", value, offset });
      i = j;
      continue;
    }

    if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_") {
      let j = i + 1;
      while (j < source.length) {
        const d = source[j]!;
        if (
          (d >= "a" && d <= "z") ||
          (d >= "A" && d <= "Z") ||
          (d >= "0" && d <= "9") ||
          d === "_"
        ) {
          j += 1;
        } else {
          break;
        }
      }
      const word = source.slice(i, j);
      if (word === "true") {
        tokens.push({ type: "true", offset });
      } else if (word === "false") {
        tokens.push({ type: "false", offset });
      } else if (word === "null") {
        tokens.push({ type: "null", offset });
      } else {
        tokens.push({ type: "ident", value: word, offset });
      }
      i = j;
      continue;
    }

    if (c === "|" && source[i + 1] === "|") {
      tokens.push({ type: "sym", value: "||", offset });
      i += 2;
      continue;
    }
    if (c === "&" && source[i + 1] === "&") {
      tokens.push({ type: "sym", value: "&&", offset });
      i += 2;
      continue;
    }
    if (c === "=" && source[i + 1] === "=") {
      tokens.push({ type: "sym", value: "==", offset });
      i += 2;
      continue;
    }
    if (c === "!" && source[i + 1] === "=") {
      tokens.push({ type: "sym", value: "!=", offset });
      i += 2;
      continue;
    }
    if (c === "<" && source[i + 1] === "=") {
      tokens.push({ type: "sym", value: "<=", offset });
      i += 2;
      continue;
    }
    if (c === ">" && source[i + 1] === "=") {
      tokens.push({ type: "sym", value: ">=", offset });
      i += 2;
      continue;
    }

    const sym = (
      ch: string,
    ):
      | "+"
      | "-"
      | "*"
      | "/"
      | "%"
      | "!"
      | "("
      | ")"
      | "."
      | "<"
      | ">"
      | null => {
      switch (ch) {
        case "+":
          return "+";
        case "-":
          return "-";
        case "*":
          return "*";
        case "/":
          return "/";
        case "%":
          return "%";
        case "!":
          return "!";
        case "(":
          return "(";
        case ")":
          return ")";
        case ".":
          return ".";
        case "<":
          return "<";
        case ">":
          return ">";
        default:
          return null;
      }
    };
    const s = sym(c);
    if (s) {
      tokens.push({ type: "sym", value: s, offset });
      i += 1;
      continue;
    }

    throw new ExpressionError(`Unexpected character: ${c}`, offset);
  }

  tokens.push({ type: "eof", offset: source.length });
  return tokens;
}
