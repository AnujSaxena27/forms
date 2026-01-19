import mongoose from 'mongoose';

/**
 * ==========================================
 * FILE UPLOAD MODEL
 * ==========================================
 * 
 * Stores uploaded file metadata in MongoDB
 * 
 * FEATURES:
 * - Cloudinary URL and public_id storage
 * - File metadata (type, size, original name)
 * - Upload timestamps
 * - User/session tracking (optional)
 * - Validation and constraints
 * 
 * SECURITY:
 * - No raw file data stored (only Cloudinary URLs)
 * - Validation to prevent external URLs
 * - Indexed for efficient queries
 */

const FileUploadSchema = new mongoose.Schema(
  {
    // Cloudinary Information
    cloudinaryUrl: {
      type: String,
      required: [true, 'Cloudinary URL is required'],
      validate: {
        validator: function(v) {
          // Ensure URL is from Cloudinary (prevent external URLs)
          return v.includes('cloudinary.com') || v.includes('res.cloudinary.com');
        },
        message: 'Only Cloudinary URLs are allowed. Direct external URLs are not permitted.',
      },
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
      trim: true,
    },
    
    // File Metadata
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    sanitizedFileName: {
      type: String,
      trim: true,
      maxlength: [255, 'Sanitized file name cannot exceed 255 characters'],
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      enum: {
        values: [
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/webp',
          'application/pdf',
        ],
        message: '{VALUE} is not a supported file type',
      },
    },
    fileCategory: {
      type: String,
      required: [true, 'File category is required'],
      enum: {
        values: ['image', 'pdf', 'document'],
        message: '{VALUE} is not a valid file category',
      },
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [1, 'File size must be greater than 0 bytes'],
      max: [10 * 1024 * 1024, 'File size cannot exceed 10MB'], // 10MB max
    },
    fileSizeFormatted: {
      type: String, // Human-readable size (e.g., "2.5 MB")
    },
    
    // Upload Context
    uploadedBy: {
      type: String, // User ID, email, or identifier
      trim: true,
    },
    uploadPurpose: {
      type: String, // 'application', 'profile', 'document', etc.
      trim: true,
      default: 'general',
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId, // Link to related document (e.g., Application)
    },
    relatedEntityType: {
      type: String, // 'Application', 'User', etc.
      trim: true,
    },
    
    // Technical Details
    uploadSource: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web',
    },
    uploadIPAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    
    // Status and Metadata
    status: {
      type: String,
      enum: ['active', 'deleted', 'archived'],
      default: 'active',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    
    // Additional Cloudinary Metadata
    cloudinaryResourceType: {
      type: String,
      enum: ['image', 'raw', 'video', 'auto'],
      default: 'image',
    },
    cloudinaryFormat: {
      type: String, // jpg, png, pdf, etc.
      trim: true,
    },
    cloudinaryWidth: {
      type: Number, // For images
    },
    cloudinaryHeight: {
      type: Number, // For images
    },
    
    // Validation Status
    validationPassed: {
      type: Boolean,
      default: true,
    },
    validationErrors: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'file_uploads',
  }
);

// ==========================================
// INDEXES
// ==========================================

// Index for efficient queries
FileUploadSchema.index({ cloudinaryPublicId: 1 }, { unique: true });
FileUploadSchema.index({ uploadedBy: 1, uploadedAt: -1 });
FileUploadSchema.index({ status: 1, uploadedAt: -1 });
FileUploadSchema.index({ relatedEntityId: 1, relatedEntityType: 1 });
FileUploadSchema.index({ fileCategory: 1, uploadedAt: -1 });

// ==========================================
// VIRTUAL PROPERTIES
// ==========================================

// Virtual property for file age (in days)
FileUploadSchema.virtual('fileAgeInDays').get(function() {
  if (!this.uploadedAt) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - this.uploadedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual property for file extension
FileUploadSchema.virtual('fileExtension').get(function() {
  if (!this.originalFileName) return '';
  const parts = this.originalFileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Mark file as deleted (soft delete)
 */
FileUploadSchema.methods.softDelete = function() {
  this.status = 'deleted';
  this.deletedAt = new Date();
  return this.save();
};

/**
 * Get file info summary
 */
FileUploadSchema.methods.getFileSummary = function() {
  return {
    id: this._id,
    fileName: this.originalFileName,
    fileSize: this.fileSizeFormatted || `${(this.fileSize / 1024).toFixed(2)} KB`,
    fileType: this.fileType,
    url: this.cloudinaryUrl,
    uploadedAt: this.uploadedAt,
    status: this.status,
  };
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Find active files by user
 */
FileUploadSchema.statics.findByUser = function(userId) {
  return this.find({ uploadedBy: userId, status: 'active' })
    .sort({ uploadedAt: -1 });
};

/**
 * Find files by category
 */
FileUploadSchema.statics.findByCategory = function(category, limit = 100) {
  return this.find({ fileCategory: category, status: 'active' })
    .sort({ uploadedAt: -1 })
    .limit(limit);
};

/**
 * Get upload statistics
 */
FileUploadSchema.statics.getUploadStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { status: 'active' }
    },
    {
      $group: {
        _id: '$fileCategory',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        averageSize: { $avg: '$fileSize' },
      }
    }
  ]);
  
  return stats;
};

/**
 * Clean up old deleted files (for scheduled cleanup)
 */
FileUploadSchema.statics.cleanupDeletedFiles = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    status: 'deleted',
    deletedAt: { $lt: cutoffDate }
  });
  
  return result;
};

// ==========================================
// PRE-SAVE MIDDLEWARE
// ==========================================

// Format file size before saving
FileUploadSchema.pre('save', function(next) {
  if (this.isModified('fileSize') && !this.fileSizeFormatted) {
    const bytes = this.fileSize;
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    this.fileSizeFormatted = Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
  next();
});

// ==========================================
// POST-SAVE MIDDLEWARE
// ==========================================

// Log successful uploads
FileUploadSchema.post('save', function(doc) {
  console.log(`✅ File saved to database: ${doc.originalFileName} (${doc.fileSizeFormatted})`);
});

// ==========================================
// ERROR HANDLING
// ==========================================

// Handle duplicate key errors
FileUploadSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('File with this Cloudinary public ID already exists'));
  } else {
    next(error);
  }
});

// ==========================================
// MODEL EXPORT
// ==========================================

// Prevent model recompilation during Next.js hot reload
const FileUpload = mongoose.models.FileUpload || mongoose.model('FileUpload', FileUploadSchema);

export default FileUpload;
