import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((result) => {
        const isEnvelope = result && typeof result === 'object' && 'data' in result && 'success' in result;
        if (isEnvelope) return result;

        return {
          success:    true,
          statusCode,
          data:       result?.data ?? result,
          message:    result?.message,
          meta:       result?.meta,
          timestamp:  new Date().toISOString(),
        };
      }),
    );
  }
}
