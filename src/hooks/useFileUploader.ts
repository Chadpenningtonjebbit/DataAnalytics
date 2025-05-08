import { useState } from 'react';

interface UploadResult {
  url: string;
  success: boolean;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

interface UseFileUploaderReturn {
  uploadFile: (file: File, onProgress?: (progress: number) => void) => Promise<UploadResult | null>;
  uploadFiles: (files: File[], onProgress?: (progress: number) => void, onFileUploaded?: (result: UploadResult) => void) => Promise<UploadResult[]>;
}

export function useFileUploader(): UseFileUploaderReturn {
  const uploadFile = async (file: File, onProgress?: (progress: number) => void): Promise<UploadResult | null> => {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Create XHR to track progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            if (onProgress) {
              onProgress(percentComplete);
            }
          }
        });
        
        // Setup completion handler
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            let errorMessage = 'Upload failed';
            try {
              const response = JSON.parse(xhr.responseText);
              errorMessage = response.error || errorMessage;
            } catch (e) {
              // If response is not valid JSON, use default error message
            }
            reject(new Error(errorMessage));
          }
        };
        
        // Setup error handler
        xhr.onerror = () => {
          const errorMessage = 'Network error occurred while uploading';
          reject(new Error(errorMessage));
        };
        
        // Open and send request
        xhr.open('POST', '/api/upload', true);
        xhr.send(formData);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(message);
    }
  };
  
  const uploadFiles = async (
    files: File[],
    onProgress?: (progress: number) => void,
    onFileUploaded?: (result: UploadResult) => void
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    try {
      // Upload each file one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileResult = await uploadFile(file, (progress) => {
          // Calculate overall progress based on current file and total files
          const fileProgress = progress / files.length;
          const previousFilesProgress = (i / files.length) * 100;
          const overallProgress = Math.round(previousFilesProgress + fileProgress);
          
          if (onProgress) {
            onProgress(overallProgress);
          }
        });
        
        if (fileResult) {
          results.push(fileResult);
          if (onFileUploaded) {
            onFileUploaded(fileResult);
          }
        }
      }
      
      return results;
    } catch (error) {
      // Let the caller handle the error
      throw error;
    }
  };
  
  return { uploadFile, uploadFiles };
} 