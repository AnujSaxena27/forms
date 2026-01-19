'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Production-Ready File Upload Hook
 * Handles client-side validation and upload
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_PDF_TYPES = ['application/pdf'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

export function useFileUpload() {
  const [files, setFiles] = useState({
    photograph: null,
    resume: null,
  });
  const [uploading, setUploading] = useState(false);

  const validateImage = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Invalid image type. Allowed: JPG, PNG, WEBP';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `Image size must be less than 5MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }
    if (file.size === 0) {
      return 'File is empty';
    }
    return null;
  };

  const validatePDF = (file) => {
    if (!ALLOWED_PDF_TYPES.includes(file.type)) {
      return 'Invalid file type. Only PDF allowed';
    }
    if (file.size > MAX_PDF_SIZE) {
      return `PDF size must be less than 10MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }
    if (file.size === 0) {
      return 'File is empty';
    }
    return null;
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = type === 'photograph' ? validateImage(file) : validatePDF(file);

    if (error) {
      toast.error(error);
      e.target.value = '';
      return;
    }

    setFiles(prev => ({ ...prev, [type]: file }));
    toast.success(`✓ ${file.name} selected`);
  };

  const submitApplication = async (formData) => {
    if (!files.photograph || !files.resume) {
      toast.error('Please upload both photograph and resume');
      return { success: false };
    }

    setUploading(true);
    const toastId = toast.loading('Submitting application...');

    try {
      const submitData = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      
      // Append files
      submitData.append('photograph', files.photograph);
      submitData.append('resume', files.resume);

      const response = await fetch('/api/applications-v2', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Application submitted successfully!', { id: toastId });
        setFiles({ photograph: null, resume: null });
        return { success: true, data: result.data };
      } else {
        const errorMessage = result.message || 'Submission failed';
        toast.error(errorMessage, { id: toastId });
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error('Network error. Please try again.', { id: toastId });
      return { success: false, error: 'NETWORK_ERROR' };
    } finally {
      setUploading(false);
    }
  };

  const resetFiles = () => {
    setFiles({ photograph: null, resume: null });
  };

  return {
    files,
    uploading,
    handleFileChange,
    submitApplication,
    resetFiles,
  };
}
