export interface AppError {
  error: Error;
  reset: () => void;
}
