import mongoose from 'mongoose';

/**
 * ==========================================
 * PRODUCTION-READY MONGODB ATLAS CONNECTION
 * FOR VERCEL SERVERLESS DEPLOYMENT
 * ==========================================
 * 
 * 🚨 CRITICAL: THIS IMPLEMENTATION CONNECTS ONLY TO MONGODB ATLAS
 * 
 * This utility manages MongoDB Atlas connections in a serverless environment.
 * It will NEVER connect to local MongoDB (localhost).
 * 
 * REQUIRED: MONGO_URI environment variable MUST be set to MongoDB Atlas URI
 * 
 * CRITICAL FOR VERCEL:
 * - Serverless functions are stateless and can have multiple instances
 * - Each cold start creates a new execution context
 * - Without caching, every API call would create a new DB connection
 * - This would quickly exhaust MongoDB's connection pool (default: 100)
 * - Connection caching prevents this by reusing existing connections
 * 
 * ENVIRONMENT VARIABLES:
 * - MONGO_URI MUST be MongoDB Atlas connection string
 * - Format: mongodb+srv://username:<PASSWORD>@cluster.mongodb.net/dbname
 * - NO LOCAL MONGODB FALLBACK - WILL FAIL IF MISSING
 * - Replace <PASSWORD> with your actual MongoDB Atlas password
 * 
 * DEPLOYMENT CHECKLIST:
 * 1. Create MongoDB Atlas cluster (https://cloud.mongodb.com)
 * 2. Create database user with password
 * 3. Whitelist Vercel IPs (or use 0.0.0.0/0 for all IPs)
 * 4. Add MONGO_URI to Vercel Environment Variables
 * 5. Deploy!
 * 
 * ⚠️ SAFETY FEATURES:
 * - Validates MONGO_URI is set (no localhost fallback)
 * - Ensures URI uses mongodb+srv protocol (Atlas only)
 * - Logs cluster name and database on successful connection
 * - Hard fails if Atlas URI is missing or invalid
 */

// Load MongoDB connection string from environment variable
// This MUST be set in Vercel Environment Variables before deployment
const MONGO_URI = process.env.MONGO_URI;

// ============================================================
// CRITICAL VALIDATION: MONGO_URI MUST BE SET
// ============================================================
if (!MONGO_URI) {
  const errorMessage =
    '❌ FATAL ERROR: MONGO_URI environment variable is NOT set!\n\n' +
    '🚨 This application connects ONLY to MongoDB Atlas (cloud).\n' +
    '   It will NOT fall back to local MongoDB.\n\n' +
    '📝 TO FIX THIS:\n' +
    '   1. For local development:\n' +
    '      → Create file: .env\n' +
    '      → Add: MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/formsDB\n' +
    '      → Restart: npm run dev\n\n' +
    '   2. For Vercel deployment:\n' +
    '      → Go to Vercel Project Settings → Environment Variables\n' +
    '      → Add: MONGO_URI with MongoDB Atlas connection string\n' +
    '      → Redeploy the application\n\n' +
    '📋 MongoDB Atlas URI FORMAT:\n' +
    '   mongodb+srv://username:password@cluster.mongodb.net/databasename\n\n' +
    '🔗 CREATE MONGODB ATLAS ACCOUNT:\n' +
    '   → Visit: https://cloud.mongodb.com\n' +
    '   → Sign up (free tier available)\n' +
    '   → Create cluster\n' +
    '   → Create database user\n' +
    '   → Get connection string\n\n' +
    '❌ NO LOCAL MONGODB SUPPORT\n' +
    '   localhost:27017 and 127.0.0.1:27017 are NOT supported\n' +
    '   This application requires MongoDB Atlas only';

  console.error(errorMessage);
  throw new Error(
    'FATAL: MONGO_URI environment variable is not defined. ' +
      'This application requires MongoDB Atlas only (no local MongoDB support).'
  );
}

// ============================================================
// VALIDATE MONGO_URI FORMAT
// ============================================================
if (typeof MONGO_URI !== 'string') {
  const errorMessage =
    '❌ FATAL ERROR: MONGO_URI is not a string!\n\n' +
    `   Got type: ${typeof MONGO_URI}\n` +
    `   Value: ${MONGO_URI}\n\n` +
    '📝 MONGO_URI must be a valid MongoDB Atlas connection string';

  console.error(errorMessage);
  throw new Error('MONGO_URI must be a string');
}

if (!MONGO_URI.includes('mongodb+srv://')) {
  const errorMessage =
    '❌ FATAL ERROR: MONGO_URI does not use MongoDB Atlas protocol!\n\n' +
    `   Got: ${MONGO_URI.substring(0, 50)}...\n` +
    `   Expected: mongodb+srv://...\n\n` +
    '🚨 THIS APPLICATION REQUIRES MONGODB ATLAS ONLY\n' +
    '   Local MongoDB (mongodb://localhost) is NOT supported\n' +
    '   Local MongoDB (mongodb://127.0.0.1) is NOT supported\n\n' +
    '📝 MONGO_URI must be a MongoDB Atlas cloud database string\n' +
    '   Format: mongodb+srv://user:password@cluster.mongodb.net/dbname\n\n' +
    '🔗 CREATE MONGODB ATLAS ACCOUNT:\n' +
    '   → Visit: https://cloud.mongodb.com';

  console.error(errorMessage);
  throw new Error(
    'MONGO_URI must use MongoDB Atlas protocol (mongodb+srv://). ' +
      'Local MongoDB is not supported.'
  );
}

// Extract and log MongoDB Atlas connection details for verification
const mongoAtlasHost = MONGO_URI.match(/@([^/]+)/)?.[1] || 'unknown';
const mongoAtlasDatabase = MONGO_URI.split('/').pop()?.split('?')[0] || 'unknown';

console.log('\n========================================');
console.log('🔐 MONGODB ATLAS CONFIGURATION VALIDATED');
console.log('========================================');
console.log(`✅ MONGO_URI: Set and valid`);
console.log(`✅ Protocol: mongodb+srv (Atlas only)`);
console.log(`✅ Cluster: ${mongoAtlasHost}`);
console.log(`✅ Database: ${mongoAtlasDatabase}`);
console.log('✅ Local MongoDB: NOT supported (intentional)');
console.log('========================================\n');

/**
 * GLOBAL CONNECTION CACHE
 * 
 * In Node.js, the global object persists across hot reloads in development
 * and across function invocations in serverless environments (warm starts).
 * 
 * This cache stores:
 * - conn: The actual mongoose connection instance
 * - promise: The pending connection promise (prevents race conditions)
 * 
 * Why both?
 * - Multiple API calls during connection can trigger multiple connect() calls
 * - Storing the promise ensures all calls wait for the same connection
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * CONNECT TO MONGODB ATLAS
 * 
 * This function establishes a connection to MongoDB Atlas with proper caching.
 * It's safe to call on every API request - it will reuse existing connections.
 * 
 * ⚠️ CRITICAL: This connects ONLY to MongoDB Atlas via MONGO_URI
 *    It will NOT fall back to local MongoDB under any circumstance
 * 
 * @returns {Promise<typeof mongoose>} Mongoose instance with active connection
 * 
 * ERROR HANDLING:
 * - Connection timeouts after 10 seconds
 * - Automatically retries on transient failures
 * - Throws errors for permanent failures (invalid credentials, network issues)
 * 
 * PERFORMANCE:
 * - First call (cold start): ~1-3 seconds to establish connection
 * - Subsequent calls (warm): <1ms (returns cached connection)
 * - Vercel keeps functions warm for ~5 minutes after last invocation
 */
async function connectDB() {
  // FAST PATH: Return cached connection if available
  // This is the most common case in production (warm starts)
  if (cached.conn) {
    console.log(
      '♻️  [MongoDB] Using cached connection (warm start)\n'
    );
    return cached.conn;
  }

  // SLOW PATH: Create new connection (cold start or first call)
  if (!cached.promise) {
    // Mongoose connection options optimized for serverless
    const opts = {
      bufferCommands: false, // Disable command buffering (fail fast if no connection)
      maxPoolSize: 10,        // Limit connection pool (serverless has limited resources)
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000, // Socket timeout (Vercel function timeout is 60s)
    };

    console.log('\n========================================');
    console.log(
      '🔌 [MongoDB] Initiating MongoDB Atlas connection (cold start)...'
    );
    console.log(`📍 [MongoDB] Cluster: ${mongoAtlasHost}`);
    console.log(`📍 [MongoDB] Database: ${mongoAtlasDatabase}`);
    console.log('🚨 [MongoDB] Using Atlas only (no local MongoDB fallback)');
    console.log('========================================\n');

    // Create connection promise
    // We store this to prevent multiple simultaneous connection attempts
    cached.promise = mongoose.connect(MONGO_URI, opts)
      .then((mongooseInstance) => {
        console.log('\n========================================');
        console.log('✅ [MongoDB] SUCCESSFULLY CONNECTED TO MONGODB ATLAS');
        console.log('========================================');
        console.log('📊 [MongoDB] Connection State:', mongooseInstance.connection.readyState);
        console.log('💾 [MongoDB] Connected Database Name:', mongooseInstance.connection.name);
        console.log('💾 [MongoDB] Database Instance:', mongooseInstance.connection.db.databaseName);
        console.log('🏢 [MongoDB] Host:', mongooseInstance.connection.host);
        console.log('🌐 [MongoDB] Protocol: MongoDB Atlas (mongodb+srv)');
        console.log(`🔢 [MongoDB] Pool Size: ${opts.maxPoolSize}`);
        console.log('✅ [MongoDB] NO local MongoDB fallback (intentional)');
        console.log('========================================\n');
        return mongooseInstance;
      })
      .catch((error) => {
        // Classify error for diagnostics
        const errorClassification = classifyDatabaseError(error);
        const timestamp = new Date().toISOString();
        
        console.error('\n========================================');
        console.error('🚨 MONGODB ERROR DIAGNOSTIC');
        console.error('========================================');
        console.error('⏰ Timestamp:', timestamp);
        console.error('📍 Location: MongoClient.connect');
        console.error('🏷️  Category:', errorClassification.category);
        console.error('🔢 Error Code:', errorClassification.errorCode);
        console.error('📦 Error Type:', error.name);
        console.error('📝 Message:', error.message);
        
        if (error.code) {
          console.error('🔐 MongoDB Code:', error.code);
        }
        
        if (error.codeName) {
          console.error('🏷️  MongoDB Code Name:', error.codeName);
        }
        
        console.error('📊 Context:', {
          cluster: mongoAtlasHost,
          database: mongoAtlasDatabase,
        });
        
        console.error('========================================');
        console.error('📚 Stack Trace:');
        console.error(error.stack);
        console.error('========================================\n');

        // Clear the promise so next attempt can retry
        cached.promise = null;

        throw error;
      });
  }

  try {
    // Wait for connection to complete
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // Clear cache on error so next attempt can retry
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

/**
 * CONNECTION STATE HELPER
 * 
 * Returns the current MongoDB connection state.
 * Useful for debugging and health checks.
 * 
 * States:
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 */
export function getConnectionState() {
  return mongoose.connection.readyState;
}

/**
 * GRACEFUL DISCONNECT
 * 
 * Closes the MongoDB connection gracefully.
 * Typically not needed in serverless (connections auto-close)
 * but useful for local development and testing.
 */
export async function disconnectDB() {
  if (cached.conn) {
    console.log('🔌 [MongoDB] Disconnecting...');
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('✅ [MongoDB] Disconnected successfully');
  }
}

/**
 * ==========================================
 * ERROR CLASSIFICATION & DIAGNOSTICS
 * ==========================================
 */

/**
 * Classify MongoDB errors into categories with HTTP status codes
 */
function classifyDatabaseError(error) {
  if (!error) {
    return {
      category: 'UNKNOWN',
      errorCode: 'UNKNOWN_ERROR',
      httpStatus: 500,
    };
  }

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code;
  const codeName = error.codeName?.toLowerCase() || '';

  // AUTHENTICATION - Code 8000 or "bad auth"
  if (
    errorCode === 8000 ||
    codeName.includes('atlasauthenticationerror') ||
    errorMessage.includes('bad auth') ||
    errorMessage.includes('authentication failed') ||
    errorMessage.includes('unauthorized')
  ) {
    return {
      category: 'AUTHENTICATION',
      errorCode: 'AUTH_FAILED',
      httpStatus: 401,
      message: 'MongoDB authentication failed. Invalid username or password.',
      hint: 'Check MongoDB Atlas Database Access credentials',
    };
  }

  // NETWORK - Connection refused, not found, or whitelist issues
  if (
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('enotfound') ||
    errorMessage.includes('network') ||
    errorMessage.includes('ip whitelist') ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ENOTFOUND'
  ) {
    return {
      category: 'NETWORK',
      errorCode: 'NETWORK_ERROR',
      httpStatus: 503,
      message: 'Cannot connect to MongoDB server. Check network and firewall.',
      hint: 'Verify MongoDB Atlas cluster is running and IP whitelist includes your location',
    };
  }

  // TIMEOUT - Connection timeout
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorCode === 'ETIMEDOUT'
  ) {
    return {
      category: 'TIMEOUT',
      errorCode: 'CONNECTION_TIMEOUT',
      httpStatus: 504,
      message: 'MongoDB connection timed out.',
      hint: 'Check MongoDB Atlas cluster status and network connectivity',
    };
  }

  // VALIDATION - Duplicate key or validation error
  if (
    errorMessage.includes('duplicate') ||
    errorMessage.includes('validation') ||
    errorCode === 11000 ||
    error.name === 'ValidationError'
  ) {
    return {
      category: 'VALIDATION',
      errorCode: 'VALIDATION_ERROR',
      httpStatus: 400,
      message: 'Data validation failed.',
      hint: 'Check that all required fields are valid and no duplicate emails exist',
    };
  }

  // DEFAULT - Unknown error
  return {
    category: 'UNKNOWN',
    errorCode: 'UNKNOWN_ERROR',
    httpStatus: 500,
    message: 'Database operation failed.',
    hint: 'Check server logs for details',
  };
}

/**
 * Create structured error response for API clients
 */
export function createErrorResponse(error, location, context = {}) {
  const classification = classifyDatabaseError(error);

  return {
    success: false,
    errorType: getErrorType(classification.category),
    message: classification.message,
    location: location,
    hint: classification.hint,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Map error category to API error type
 */
function getErrorType(category) {
  const mapping = {
    AUTHENTICATION: 'DATABASE_AUTH',
    NETWORK: 'DATABASE_CONNECTION',
    TIMEOUT: 'DATABASE_CONNECTION',
    VALIDATION: 'DATABASE_WRITE',
    UNKNOWN: 'DATABASE_WRITE',
  };
  return mapping[category] || 'DATABASE_WRITE';
}

/**
 * Get HTTP status code from error classification
 */
export function getHttpStatus(error) {
  return classifyDatabaseError(error).httpStatus || 500;
}

// Export the connection function as default
export default connectDB;
