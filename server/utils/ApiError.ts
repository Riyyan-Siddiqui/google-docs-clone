export class ApiError extends Error {
  constructor(
    public statusCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
