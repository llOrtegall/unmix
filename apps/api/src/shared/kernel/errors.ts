/** Business error shape shared by every module; `code` maps to an HTTP status in `interface`. */
export interface AppError<TCode extends string = string> {
  readonly code: TCode;
  readonly message: string;
}

export const appError = <TCode extends string>(code: TCode, message: string): AppError<TCode> => ({
  code,
  message,
});
