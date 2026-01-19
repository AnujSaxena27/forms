/**
 * Production-Ready File Validation Utility
 * Hardened for security and reliability
 */

// Strict allowlist of MIME types
const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  PDF: ['application/pdf'],
};

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024,  // 5MB
  PDF: 10 * 1024 * 1024,   // 10MB
};

// Magic numbers for file type verification
const FILE_SIGNATURES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
};

/**
 * Validate origin/referer
 */
export function validateOrigin(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL not configured');
  }

  // In production, require valid origin or referer
  if (process.env.NODE_ENV === 'production') {
    if (!origin && !referer) {
      return { valid: false, error: 'Missing origin and referer headers' };
    }

    const requestOrigin = origin || (referer ? new URL(referer).origin : null);
    const allowedOrigin = new URL(appUrl).origin;

    if (requestOrigin !== allowedOrigin) {
      return { valid: false, error: 'Unauthorized origin' };
    }
  }

  return { valid: true };
}

/**
 * Validate content type is multipart/form-data
 */
export function validateContentType(request) {
  const contentType = request.headers.get('content-type') || '';
  
  if (!contentType.includes('multipart/form-data')) {
    return { valid: false, error: 'Content-Type must be multipart/form-data' };
  }

  return { valid: true };
}

/**
 * Validate file MIME type against allowlist
 */
export function validateMimeType(file, category = 'IMAGE') {
  const allowedTypes = ALLOWED_MIME_TYPES[category];
  
  if (!allowedTypes) {
    return { valid: false, error: 'Invalid category' };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid MIME type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file, category = 'IMAGE') {
  const maxSize = FILE_SIZE_LIMITS[category];
  
  if (!maxSize) {
    return { valid: false, error: 'Invalid category' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    const fileMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size ${fileMB}MB exceeds limit of ${maxMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validate file signature (magic numbers)
 */
export function validateFileSignature(buffer, mimeType) {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return true;

  const uint8Array = new Uint8Array(buffer);
  
  return signatures.some(signature => 
    signature.every((byte, index) => uint8Array[index] === byte)
  );
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/\.\.\//g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);
}

/**
 * Detect if payload contains URL instead of file
 */
export function containsExternalUrl(value) {
  if (typeof value === 'string') {
    const urlPattern = /^https?:\/\//i;
    return urlPattern.test(value);
  }
  return false;
}

/**
 * Comprehensive file validation
 */
export async function validateFile(file, category = 'IMAGE') {
  // Check file exists
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'No valid file provided' };
  }

  // Check for URL injection
  if (containsExternalUrl(file.name)) {
    return { valid: false, error: 'External URLs not allowed' };
  }

  // Validate MIME type
  const mimeValidation = validateMimeType(file, category);
  if (!mimeValidation.valid) return mimeValidation;

  // Validate size
  const sizeValidation = validateFileSize(file, category);
  if (!sizeValidation.valid) return sizeValidation;

  // Validate signature
  const buffer = await file.arrayBuffer();
  const signatureValid = validateFileSignature(buffer, file.type);
  
  if (!signatureValid) {
    return {
      valid: false,
      error: 'File content does not match declared type',
    };
  }

  return {
    valid: true,
    sanitizedName: sanitizeFilename(file.name),
    buffer,
  };
}

/**
 * Validate FormData doesn't contain external URLs
 */
export function validateFormData(formData) {
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && containsExternalUrl(value)) {
      // Allow specific URL fields
      if (!['linkedinUrl', 'githubUrl', 'portfolioUrl'].includes(key)) {
        return {
          valid: false,
          error: `Field "${key}" contains unauthorized URL`,
        };
      }
    }
  }
  return { valid: true };
}
