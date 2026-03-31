export type BinaryOp =
  | "||"
  | "&&"
  | "=="
  | "!="
  | "<"
  | ">"
  | "<="
  | ">="
  | "+"
  | "-"
  | "*"
  | "/"
  | "%";

export type Expr =
  | { kind: "literal"; value: string | number | boolean | null }
  | { kind: "path"; segments: string[] }
  | { kind: "unary"; op: "!" | "-"; arg: Expr }
  | { kind: "binary"; op: BinaryOp; left: Expr; right: Expr };
