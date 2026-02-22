/**
 * Structured logger for API routes.
 * Outputs JSON lines with consistent fields for log aggregation.
 */

let requestCounter = 0;

export function generateRequestId(): string {
  requestCounter = (requestCounter + 1) % 1_000_000;
  return `${Date.now()}-${requestCounter.toString(36)}`;
}

interface LogContext {
  requestId: string;
  method: string;
  path: string;
  [key: string]: unknown;
}

function log(level: 'info' | 'warn' | 'error', message: string, ctx: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...ctx,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (message: string, ctx: LogContext) => log('info', message, ctx),
  warn: (message: string, ctx: LogContext) => log('warn', message, ctx),
  error: (message: string, ctx: LogContext & { error?: unknown }) => {
    const errorDetail = ctx.error instanceof Error
      ? { errorMessage: ctx.error.message, errorStack: ctx.error.stack }
      : { errorMessage: String(ctx.error) };
    const { error: _err, ...rest } = ctx;
    log('error', message, { ...rest, ...errorDetail });
  },
};
