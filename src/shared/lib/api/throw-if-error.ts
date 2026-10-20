import { ApiError } from './api-error';
import { buildProblemError } from './parse-error';

type Result<T> = { data?: T; error?: unknown; response: Response };

// For server code: returns the data of a successful call, or throws an ApiError built from the failed response.
export function throwIfError<T>(result: Result<T>): T {
  if (result.error !== undefined || !result.response.ok) {
    // openapi-fetch has already read the body into `error`, so the response body cannot be read again.
    throw buildProblemError(result.response.status, result.error, result.response.headers);
  }

  if (result.data === undefined) {
    throw new ApiError({ kind: 'unknown', status: result.response.status });
  }

  return result.data;
}
