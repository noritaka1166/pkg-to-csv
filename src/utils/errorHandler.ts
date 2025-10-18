export class AppError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AppError';
  }
}

export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  return operation().catch((error) => {
    throw new AppError(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`);
  });
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return operation();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Unreachable code');
}