/**
 * ==========================================
 * FILE UPLOAD VALIDATION UTILITY
 * ==========================================
 * 
 * Production-ready file validation for secure uploads
 * 
 * FEATURES:
 * - File type validation (whitelist approach)
 * - File size validation (configurable limits)
 * - MIME type verification
 * - Origin validation (prevents external direct links)
 * - Security checks (magic number validation)
 * - User-friendly error messages
 * 
 * SECURITY:
 * - Only allows uploads from website UI
 * - Validates actual file content, not just extension
 * - Prevents malicious file uploads
 * - Sanitizes file names
 */

// ==========================================
// CONFIGURATION
// ==========================================

/**
 * Allowed file types with MIME types and max sizes
 */
export const FILE_CONFIG = {
  image: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    label: 'Image',
  },
  pdf: {
    allowedTypes: ['application/pdf'],
    allowedExtensions: ['.pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    label: 'PDF Document',
  },
};

/**
 * Magic numbers (file signatures) for validation
 * First few bytes that identify file types
 */
const FILE_SIGNATURES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47], // PNG
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // WEBP (RIFF header)
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // PDF (%PDF)
  ],
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

/**
 * Validate file type against allowed types
 * @param {File} file - File object
 * @param {string} category - 'image' or 'pdf'
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validateFileType(file, category = 'image') {
  const config = FILE_CONFIG[category];
  
  if (!config) {
    return {
      valid: false,
      error: `Invalid file category: ${category}`,
    };
  }

  // Check MIME type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Please upload ${config.label} files only. Allowed formats: ${config.allowedExtensions.join(', ')}`,
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = config.allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${config.allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate file size
 * @param {File} file - File object
 * @param {string} category - 'image' or 'pdf'
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validateFileSize(file, category = 'image') {
  const config = FILE_CONFIG[category];
  
  if (!config) {
    return {
      valid: false,
      error: `Invalid file category: ${category}`,
    };
  }

  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(0);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    return {
      valid: false,
      error: `File size exceeds limit. Maximum allowed: ${maxSizeMB}MB. Your file: ${fileSizeMB}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty. Please select a valid file.',
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate file magic numbers (file signature)
 * Reads the first few bytes to verify actual file type
 * @param {ArrayBuffer} arrayBuffer - File array buffer
 * @param {string} mimeType - Expected MIME type
 * @returns {boolean} - True if signature matches
 */
export function validateFileSignature(arrayBuffer, mimeType) {
  const uint8Array = new Uint8Array(arrayBuffer);
  const signatures = FILE_SIGNATURES[mimeType];
  
  if (!signatures) {
    console.warn(`No signature defined for MIME type: ${mimeType}`);
    return true; // Skip validation if no signature defined
  }

  // Check if any signature matches
  return signatures.some(signature => {
    return signature.every((byte, index) => {
      return uint8Array[index] === byte;
    });
  });
}

/**
 * Sanitize file name (remove special characters)
 * @param {string} fileName - Original file name
 * @returns {string} - Sanitized file name
 */
export function sanitizeFileName(fileName) {
  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\.\//g, '');
  
  // Remove special characters (keep alphanumeric, dots, hyphens, underscores)
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (sanitized.length > 100) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 100 - ext.length) + ext;
  }
  
  return sanitized;
}

/**
 * Validate origin (ensure upload is from website UI)
 * Checks referer header to prevent direct external uploads
 * @param {Request} request - Next.js request object
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validateOrigin(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Check if request is from same origin
  if (origin && origin !== appUrl) {
    // Allow requests from same domain but different port (development)
    const originHost = new URL(origin).hostname;
    const appHost = new URL(appUrl).hostname;
    
    if (originHost !== appHost && originHost !== 'localhost' && originHost !== '127.0.0.1') {
      return {
        valid: false,
        error: 'Unauthorized: File uploads are only allowed from the website UI',
      };
    }
  }

  // Verify referer exists (prevents direct API calls)
  if (!referer && process.env.NODE_ENV === 'production') {
    return {
      valid: false,
      error: 'Unauthorized: Direct uploads are not allowed',
    };
  }

  return { valid: true, error: null };
}

/**
 * Comprehensive file validation (all checks)
 * @param {File} file - File object
 * @param {string} category - 'image' or 'pdf'
 * @param {ArrayBuffer} arrayBuffer - File array buffer (optional, for signature validation)
 * @returns {Object} - { valid: boolean, error: string, sanitizedName: string }
 */
export async function validateFile(file, category = 'image', arrayBuffer = null) {
  console.log(`🔍 Validating file: ${file.name}`);
  console.log(`  Category: ${category}`);
  console.log(`  Size: ${(file.size / 1024).toFixed(2)} KB`);
  console.log(`  Type: ${file.type}`);

  // 1. Validate file exists
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
    };
  }

  // 2. Validate file type
  const typeValidation = validateFileType(file, category);
  if (!typeValidation.valid) {
    console.log(`❌ Type validation failed: ${typeValidation.error}`);
    return typeValidation;
  }

  // 3. Validate file size
  const sizeValidation = validateFileSize(file, category);
  if (!sizeValidation.valid) {
    console.log(`❌ Size validation failed: ${sizeValidation.error}`);
    return sizeValidation;
  }

  // 4. Validate file signature (magic numbers) if arrayBuffer provided
  if (arrayBuffer) {
    const signatureValid = validateFileSignature(arrayBuffer, file.type);
    if (!signatureValid) {
      console.log(`❌ Signature validation failed`);
      return {
        valid: false,
        error: 'File content does not match the file extension. The file may be corrupted or renamed.',
      };
    }
  }

  // 5. Sanitize file name
  const sanitizedName = sanitizeFileName(file.name);

  console.log(`✅ File validation passed`);
  console.log(`  Sanitized name: ${sanitizedName}`);

  return {
    valid: true,
    error: null,
    sanitizedName,
  };
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get allowed file types as string (for input accept attribute)
 * @param {string} category - 'image' or 'pdf'
 * @returns {string} - Comma-separated file types
 */
export function getAllowedFileTypes(category = 'image') {
  const config = FILE_CONFIG[category];
  return config ? config.allowedExtensions.join(',') : '';
}

/**
 * Client-side file validation (before upload)
 * To be used in React components
 * @param {File} file - File object
 * @param {string} category - 'image' or 'pdf'
 * @returns {Promise<Object>} - { valid: boolean, error: string }
 */
export async function validateFileClient(file, category = 'image') {
  // Read file for signature validation
  const arrayBuffer = await file.arrayBuffer();
  return validateFile(file, category, arrayBuffer);
}
