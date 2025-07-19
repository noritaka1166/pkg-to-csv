export class AppError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  return operation().catch((error) => {
    throw new AppError(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`);
  });
}

export function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await operation();
        resolve(result);
        return;
      } catch (error) {
        if (attempt === retries) {
          reject(error);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  });
}