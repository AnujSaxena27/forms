import { NextResponse } from 'next/server';

/**
 * Centralized Error Handling Utility
 * Maps errors to standardized HTTP responses
 */

export const ErrorCodes = {
  // Client errors (4xx)
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_FILES: 'MISSING_FILES',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
  INVALID_MIME_TYPE: 'INVALID_MIME_TYPE',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  ORIGIN_BLOCKED: 'ORIGIN_BLOCKED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Server errors (5xx)
  CLOUDINARY_UPLOAD_FAILED: 'CLOUDINARY_UPLOAD_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export const ErrorMessages = {
  [ErrorCodes.INVALID_REQUEST]: 'Invalid request format',
  [ErrorCodes.MISSING_FILES]: 'Required files are missing',
  [ErrorCodes.INVALID_FILE_TYPE]: 'Invalid file type',
  [ErrorCodes.FILE_SIZE_EXCEEDED]: 'File size exceeds limit',
  [ErrorCodes.INVALID_MIME_TYPE]: 'Invalid MIME type',
  [ErrorCodes.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCodes.ORIGIN_BLOCKED]: 'Unauthorized origin',
  [ErrorCodes.UNAUTHORIZED]: 'Unauthorized request',
  [ErrorCodes.CLOUDINARY_UPLOAD_FAILED]: 'File upload failed',
  [ErrorCodes.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCodes.INTERNAL_ERROR]: 'Internal server error',
};

export const ErrorStatusCodes = {
  [ErrorCodes.INVALID_REQUEST]: 400,
  [ErrorCodes.MISSING_FILES]: 400,
  [ErrorCodes.INVALID_FILE_TYPE]: 400,
  [ErrorCodes.FILE_SIZE_EXCEEDED]: 413,
  [ErrorCodes.INVALID_MIME_TYPE]: 400,
  [ErrorCodes.VALIDATION_FAILED]: 400,
  [ErrorCodes.ORIGIN_BLOCKED]: 401,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.CLOUDINARY_UPLOAD_FAILED]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.INTERNAL_ERROR]: 500,
};

/**
 * Create standardized error response
 */
export function createErrorResponse(errorCode, message = null, details = null) {
  const statusCode = ErrorStatusCodes[errorCode] || 500;
  const defaultMessage = ErrorMessages[errorCode] || 'An error occurred';
  
  return NextResponse.json(
    {
      success: false,
      error: errorCode,
      message: message || defaultMessage,
      ...(details && { details }),
    },
    { status: statusCode }
  );
}

/**
 * Create success response
 */
export function createSuccessResponse(data, statusCode = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  );
}
