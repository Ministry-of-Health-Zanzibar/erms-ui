import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

/**
 * Keeps completed GET responses for the lifetime of the application and also
 * coalesces simultaneous requests for the same resource. Any write clears the
 * cache so screens cannot keep data that has just been changed.
 */
const getCache = new Map<string, Observable<HttpEvent<unknown>>>();

export const httpCacheInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (request.headers.has('X-Skip-Cache')) {
    return next(request.clone({
      headers: request.headers.delete('X-Skip-Cache'),
    }));
  }

  if (request.method !== 'GET') {
    getCache.clear();
    return next(request);
  }

  const cacheKey = [
    request.urlWithParams,
    request.headers.get('Authorization') ?? '',
  ].join('|');
  const cached = getCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = next(request).pipe(
    shareReplay({ bufferSize: 1, refCount: false }),
  );
  getCache.set(cacheKey, response);

  return response;
};
