/**
 * Request ID Middleware
 * Adds a unique request ID to each request for tracing
 * 
 * Usage in API routes:
 * const requestId = getRequestId(request);
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Generate or get request ID from headers
 */
export function getRequestId(request: Request | NextRequest): string {
  // Check if request already has an ID (from upstream proxy/load balancer)
  const existingId = request.headers.get(REQUEST_ID_HEADER);
  if (existingId) {
    return existingId;
  }
  
  // Generate new ID
  return uuidv4();
}

/**
 * Add request ID to response headers
 */
export function addRequestIdToResponse(
  response: NextResponse,
  requestId: string
): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

/**
 * Create response with request ID header
 */
export function createResponseWithRequestId<T>(
  data: T,
  requestId: string,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

/**
 * Create error response with request ID header
 */
export function createErrorResponseWithRequestId(
  error: string,
  requestId: string,
  status: number = 500
): NextResponse {
  const response = NextResponse.json(
    { error, requestId },
    { status }
  );
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

/**
 * Middleware to add request ID to all requests
 * Add this to middleware.ts
 */
export function requestIdMiddleware(request: NextRequest): NextResponse | undefined {
  const requestId = getRequestId(request);
  
  // Add request ID to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  
  // Continue with modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Type for API handler with request ID
 */
export type ApiHandlerWithRequestId<T> = (
  request: Request,
  requestId: string
) => Promise<NextResponse<T>>;

/**
 * Wrapper to automatically add request ID to API handlers
 */
export function withRequestId<T>(
  handler: ApiHandlerWithRequestId<T>
) {
  return async (request: Request): Promise<NextResponse> => {
    const requestId = getRequestId(request);
    const startTime = Date.now();
    
    try {
      const response = await handler(request, requestId);
      response.headers.set(REQUEST_ID_HEADER, requestId);
      
      // Log request completion
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ${request.method} ${new URL(request.url).pathname} - ${response.status} (${duration}ms)`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] ${request.method} ${new URL(request.url).pathname} - ERROR (${duration}ms):`, error);
      
      return createErrorResponseWithRequestId(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        500
      );
    }
  };
}
