export class ExpressionError extends Error {
  constructor(
    message: string,
    public readonly offset: number = 0,
  ) {
    super(message);
    this.name = "ExpressionError";
  }
}
