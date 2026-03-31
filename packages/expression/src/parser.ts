import type { Expr } from "./ast";
import { ExpressionError } from "./errors";
import { tokenize, type Token } from "./lexer";

export function parseExpression(source: string): Expr {
  const p = new Parser(source, tokenize(source));
  return p.parse();
}

class Parser {
  private pos = 0;

  constructor(
    private readonly source: string,
    private readonly tokens: Token[],
  ) {}

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: "eof", offset: this.source.length };
  }

  private advance(): Token {
    const t = this.peek();
    if (t.type !== "eof") {
      this.pos += 1;
    }
    return t;
  }

  private expectSym(
    value:
      | "+"
      | "-"
      | "*"
      | "/"
      | "%"
      | "("
      | ")"
      | "<"
      | ">"
      | "||"
      | "&&"
      | "=="
      | "!="
      | "<="
      | ">=",
  ): void {
    const t = this.peek();
    if (t.type !== "sym" || t.value !== value) {
      throw new ExpressionError(`Expected '${value}'`, t.offset);
    }
    this.advance();
  }

  parse(): Expr {
    const e = this.parseLogicalOr();
    const t = this.peek();
    if (t.type !== "eof") {
      throw new ExpressionError("Unexpected token after expression", t.offset);
    }
    return e;
  }

  private parseLogicalOr(): Expr {
    let left = this.parseLogicalAnd();
    while (this.peek().type === "sym") {
      const op = this.peek() as Extract<Token, { type: "sym" }>;
      if (op.value !== "||") break;
      this.advance();
      const right = this.parseLogicalAnd();
      left = { kind: "binary", op: "||", left, right };
    }
    return left;
  }

  private parseLogicalAnd(): Expr {
    let left = this.parseEquality();
    while (this.peek().type === "sym") {
      const op = this.peek() as Extract<Token, { type: "sym" }>;
      if (op.value !== "&&") break;
      this.advance();
      const right = this.parseEquality();
      left = { kind: "binary", op: "&&", left, right };
    }
    return left;
  }

  private parseEquality(): Expr {
    let left = this.parseComparison();
    while (this.peek().type === "sym") {
      const op = this.peek() as Extract<Token, { type: "sym" }>;
      if (op.value !== "==" && op.value !== "!=") break;
      this.advance();
      const right = this.parseComparison();
      left = { kind: "binary", op: op.value, left, right };
    }
    return left;
  }

  private parseComparison(): Expr {
    let left = this.parseAdditive();
    while (this.peek().type === "sym") {
      const op = this.peek() as Extract<Token, { type: "sym" }>;
      if (op.value !== "<" && op.value !== ">" && op.value !== "<=" && op.value !== ">=") {
        break;
      }
      this.advance();
      const right = this.parseAdditive();
      left = { kind: "binary", op: op.value, left, right };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.peek().type === "sym") {
      const op = this.peek() as Extract<Token, { type: "sym" }>;
      if (op.value !== "+" && op.value !== "-") break;
      this.advance();
      const right = this.parseMultiplicative();
      left = { kind: "binary", op: op.value, left, right };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (this.peek().type === "sym") {
      const op = this.peek() as Extract<Token, { type: "sym" }>;
      if (op.value !== "*" && op.value !== "/" && op.value !== "%") break;
      this.advance();
      const right = this.parseUnary();
      left = { kind: "binary", op: op.value, left, right };
    }
    return left;
  }

  private parseUnary(): Expr {
    const t = this.peek();
    if (t.type === "sym" && t.value === "!") {
      this.advance();
      return { kind: "unary", op: "!", arg: this.parseUnary() };
    }
    if (t.type === "sym" && t.value === "-") {
      this.advance();
      return { kind: "unary", op: "-", arg: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let e = this.parsePrimary();
    while (this.peek().type === "sym") {
      const op = this.peek() as Extract<Token, { type: "sym" }>;
      if (op.value !== ".") break;
      this.advance();
      const id = this.peek();
      if (id.type !== "ident") {
        throw new ExpressionError("Expected identifier after '.'", id.offset);
      }
      this.advance();
      if (e.kind === "path") {
        e = { kind: "path", segments: [...e.segments, id.value] };
      } else {
        throw new ExpressionError("Invalid member access", id.offset);
      }
    }
    return e;
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    if (t.type === "sym" && t.value === "(") {
      this.advance();
      const inner = this.parseLogicalOr();
      this.expectSym(")");
      return inner;
    }
    if (t.type === "number") {
      this.advance();
      return { kind: "literal", value: t.value };
    }
    if (t.type === "string") {
      this.advance();
      return { kind: "literal", value: t.value };
    }
    if (t.type === "true") {
      this.advance();
      return { kind: "literal", value: true };
    }
    if (t.type === "false") {
      this.advance();
      return { kind: "literal", value: false };
    }
    if (t.type === "null") {
      this.advance();
      return { kind: "literal", value: null };
    }
    if (t.type === "ident") {
      this.advance();
      return { kind: "path", segments: [t.value] };
    }
    throw new ExpressionError("Unexpected token", t.offset);
  }
}
