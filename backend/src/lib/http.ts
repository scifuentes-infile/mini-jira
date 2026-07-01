import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiErrorCode = 'VALIDATION_ERROR' | 'UNAUTHENTICATED' | 'INVALID_CREDENTIALS' | 'FORBIDDEN' | 'NOT_FOUND' | 'VERSION_CONFLICT' | 'ARCHIVED' | 'LAST_ADMIN' | 'INTERNAL_ERROR';
export type ApiError = { code: ApiErrorCode; message: string; details?: unknown };

export class HttpError extends Error {
  constructor(public status: number, public apiError: ApiError) { super(apiError.message); }
}

export const ok = <T>(data: T, status = 200) => NextResponse.json({ data, error: null }, { status });
export const fail = (status: number, error: ApiError) => NextResponse.json({ data: null, error }, { status });
export const noContent = () => new NextResponse(null, { status: 204 });
export const handleRouteError = (error: unknown) => {
  if (error instanceof HttpError) return fail(error.status, error.apiError);
  if (error instanceof ZodError) return fail(400, { code: 'VALIDATION_ERROR', message: 'Payload o query params invalidos.', details: error.flatten() });
  console.error(error);
  return fail(500, { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' });
};
