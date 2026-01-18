import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary Configuration
 * Handles image and file uploads to Cloudinary
 */

// Load environment variables
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Debug: Log configuration status (without exposing secrets)
console.log('☁️ Cloudinary Configuration:');
console.log('  Cloud Name:', CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
console.log('  API Key:', CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  API Secret:', CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');

// Validate credentials before configuring
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ Cloudinary credentials missing! Check .env file.');
  throw new Error('Missing Cloudinary credentials in environment variables');
}

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

console.log('✅ Cloudinary configured successfully');

/**
 * Upload file to Cloudinary
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} folder - Cloudinary folder name
 * @param {string} resourceType - 'image' or 'raw' (for PDFs)
 * @returns {Promise<Object>} Upload result with secure_url
 */
export async function uploadToCloudinary(file, folder = 'candidates', resourceType = 'image') {
  console.log(`📤 Cloudinary upload starting...`);
  console.log(`  Folder: ${folder}`);
  console.log(`  Type: ${resourceType}`);
  console.log(`  Data length: ${file.length}`);
  
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: resourceType === 'image' ? ['jpg', 'jpeg', 'png', 'webp'] : ['pdf'],
    });

    console.log('✅ Cloudinary upload successful');
    console.log(`  URL: ${result.secure_url}`);
    console.log(`  Public ID: ${result.public_id}`);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    console.error('  Error details:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {string} resourceType - 'image' or 'raw'
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return { success: true, result };
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    return { success: false, error: error.message };
  }
}

export default cloudinary;
