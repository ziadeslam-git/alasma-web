export type ApiErrorKind = 'network' | 'timeout' | 'problem' | 'unknown';

// field name -> messages, as sent by the API in the `errors` member of a validation problem
export type FieldErrors = Record<string, string[]>;

export type ApiErrorInit = {
  kind: ApiErrorKind;
  status?: number;
  type?: string;
  title?: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: FieldErrors;
  retryAfterSeconds?: number;
  cause?: unknown;
};

// The one error type the UI handles. It carries the ProblemDetails fields of the API and never a raw Response.
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly type: string | undefined;
  readonly title: string | undefined;
  readonly detail: string | undefined;
  readonly code: string | undefined;
  readonly traceId: string | undefined;
  readonly errors: FieldErrors;
  readonly retryAfterSeconds: number | undefined;

  constructor(init: ApiErrorInit) {
    super(init.title ?? init.detail ?? `API error (${init.kind})`, { cause: init.cause });
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status;
    this.type = init.type;
    this.title = init.title;
    this.detail = init.detail;
    this.code = init.code;
    this.traceId = init.traceId;
    this.errors = init.errors ?? {};
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  get isValidation(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}
