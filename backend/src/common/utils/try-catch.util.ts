import { Logger } from '@nestjs/common';

type Result<T> = { data: T; error: null } | { data: null; error: Error };

export async function tryCatch<T>(
  fn: () => Promise<T>,
  logger?: Logger,
  context?: string,
): Promise<Result<T>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (logger && context) {
      logger.error(`${context}: ${err.message}`, err.stack);
    }
    return { data: null, error: err };
  }
}
