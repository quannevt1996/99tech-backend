import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';

interface ErrorDetail {
  path: string;
  message: string;
}

interface BodyParserError extends Error {
  status: number;
  type: string;
}

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorDetail[] | undefined;

  constructor(status: number, code: string, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const isBodyParserError = (e: unknown): e is BodyParserError =>
  e instanceof Error && 'type' in e && typeof e.type === 'string' && 'status' in e && typeof e.status === 'number';

const toErrorDetails = (error: z.ZodError): ErrorDetail[] =>
  error.issues.flatMap(issue =>
    issue.code === 'unrecognized_keys'
      ? issue.keys.map(key => ({ path: [...issue.path, key].map(String).join('.'), message: 'Unknown field' }))
      : [{ path: issue.path.map(String).join('.'), message: issue.message }],
  );

const toHttpError = (e: unknown): HttpError => {
  if (e instanceof HttpError) {
    return e;
  }
  if (e instanceof z.ZodError) {
    return new HttpError(400, 'validation_failed', 'Request validation failed', toErrorDetails(e));
  }
  if (isBodyParserError(e)) {
    if (e.type === 'entity.parse.failed') {
      return new HttpError(400, 'invalid_json', 'Request body must be a JSON object');
    }
    if (e.type === 'entity.too.large') {
      return new HttpError(413, 'payload_too_large', 'Request body is too large');
    }
    return new HttpError(e.status, 'invalid_body', e.message);
  }
  return new HttpError(500, 'internal_error', 'Something went wrong');
};

export const notFound: RequestHandler = req => {
  throw new HttpError(404, 'not_found', `Route ${req.method} ${req.path} not found`);
};

export const errorHandler: ErrorRequestHandler = (e, _req, res, next) => {
  if (res.headersSent) {
    next(e);
    return;
  }

  const error = toHttpError(e);
  if (error.status >= 500) {
    process.stderr.write(`${e instanceof Error ? e.stack : String(e)}\n`);
  }

  res.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details } });
};
