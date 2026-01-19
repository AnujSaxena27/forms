/**
 * Environment Variables Validator
 * Validates required environment variables at startup
 */

const REQUIRED_ENV_VARS = {
  MONGO_URI: 'MongoDB connection string',
  CLOUDINARY_CLOUD_NAME: 'Cloudinary cloud name',
  CLOUDINARY_API_KEY: 'Cloudinary API key',
  CLOUDINARY_API_SECRET: 'Cloudinary API secret',
  NEXT_PUBLIC_APP_URL: 'Application URL',
};

const OPTIONAL_ENV_VARS = {
  CLOUDINARY_FOLDER_PREFIX: 'Cloudinary folder prefix (defaults to "uploads")',
  NODE_ENV: 'Node environment (defaults to "development")',
};

export function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    if (!process.env[key]) {
      missing.push(`${key}: ${description}`);
    }
  }

  // Check optional variables
  for (const [key, description] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      warnings.push(`${key}: ${description}`);
    }
  }

  if (missing.length > 0) {
    const errorMessage = [
      '',
      '❌ FATAL: Missing required environment variables',
      '',
      'Missing variables:',
      ...missing.map(m => `  - ${m}`),
      '',
      'Setup instructions:',
      '1. Copy .env.example to .env',
      '2. Fill in all required values',
      '3. Restart the application',
      '',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Validate MongoDB URI format
  if (!process.env.MONGO_URI.includes('mongodb')) {
    throw new Error('MONGO_URI must be a valid MongoDB connection string');
  }

  // Validate APP_URL format
  try {
    new URL(process.env.NEXT_PUBLIC_APP_URL);
  } catch {
    throw new Error('NEXT_PUBLIC_APP_URL must be a valid URL');
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Optional environment variables not set:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }
}

export function getEnv(key, defaultValue = null) {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue;
}
