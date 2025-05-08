"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, FileIcon, LoaderCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFileUploader } from "@/hooks/useFileUploader";

interface UploadedFile {
  file: File;
  progress: number;
  url?: string;
  error?: string;
  status: 'uploading' | 'success' | 'error';
}

interface FileUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  onRemove?: (index: number) => void;
  onUploadComplete?: (urls: string[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  className?: string;
  autoUpload?: boolean;
}

export function FileUpload({
  value = [],
  onChange,
  onRemove,
  onUploadComplete,
  disabled = false,
  maxFiles = 5,
  maxSize = 1024 * 1024 * 5, // 5MB
  accept = {
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.csv', '.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  },
  className,
  autoUpload = false,
}: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = React.useState<Record<string, UploadedFile>>({});
  const { uploadFile, uploadFiles } = useFileUploader();

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles = [...value];
      
      // Ensure we don't exceed maxFiles
      const remainingSlots = maxFiles - newFiles.length;
      const filesToAdd = acceptedFiles.slice(0, remainingSlots);
      
      onChange([...newFiles, ...filesToAdd]);
      
      // If autoUpload is enabled, start uploading files immediately
      if (autoUpload && filesToAdd.length > 0) {
        try {
          // Initialize upload status for each file
          const initialStatus: Record<string, UploadedFile> = {};
          filesToAdd.forEach(file => {
            const fileId = `${file.name}-${file.size}-${Date.now()}`;
            initialStatus[fileId] = {
              file,
              progress: 0,
              status: 'uploading'
            };
          });
          
          setUploadStatus(prev => ({ ...prev, ...initialStatus }));
          
          // Upload all files
          const results = await uploadFiles(
            filesToAdd,
            undefined, // We'll track progress per file instead
            (result) => {
              // When a file is uploaded successfully
              if (result.success && result.url) {
                const fileId = Object.keys(initialStatus).find(
                  key => initialStatus[key].file.name === result.fileName
                );
                
                if (fileId) {
                  setUploadStatus(prev => ({
                    ...prev,
                    [fileId]: {
                      ...prev[fileId],
                      progress: 100,
                      url: result.url,
                      status: 'success'
                    }
                  }));
                }
              }
            }
          );
          
          // Notify parent component of completed uploads
          if (onUploadComplete) {
            const urls = results.filter(r => r.success).map(r => r.url);
            onUploadComplete(urls);
          }
        } catch (error) {
          console.error("Error uploading files:", error);
          // Update status for failed uploads
          const errorStatus: Record<string, UploadedFile> = {};
          Object.keys(uploadStatus).forEach(fileId => {
            if (uploadStatus[fileId].status === 'uploading') {
              errorStatus[fileId] = {
                ...uploadStatus[fileId],
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed'
              };
            }
          });
          
          setUploadStatus(prev => ({ ...prev, ...errorStatus }));
        }
      }
    },
    [maxFiles, onChange, value, autoUpload, uploadFiles, onUploadComplete, uploadStatus]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    maxFiles: maxFiles - value.length,
    maxSize,
    accept
  });

  const removeFile = (index: number) => {
    const newFiles = [...value];
    const removedFile = newFiles[index];
    newFiles.splice(index, 1);
    onChange(newFiles);
    
    // Remove from upload status if exists
    if (removedFile) {
      const fileId = Object.keys(uploadStatus).find(
        key => uploadStatus[key].file.name === removedFile.name
      );
      
      if (fileId) {
        const newStatus = { ...uploadStatus };
        delete newStatus[fileId];
        setUploadStatus(newStatus);
      }
    }
    
    onRemove?.(index);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("csv") || fileType.includes("excel") || fileType.includes("spreadsheet")) {
      return "CSV";
    } else if (fileType.includes("pdf")) {
      return "PDF";
    } else if (fileType.includes("image")) {
      return "IMG";
    } else {
      return "FILE";
    }
  };
  
  const getFileStatus = (file: File) => {
    const fileId = Object.keys(uploadStatus).find(
      key => uploadStatus[key].file.name === file.name
    );
    
    return fileId ? uploadStatus[fileId] : null;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[200px]",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium mb-1">
            {isDragActive ? "Drop the files here..." : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-xs text-muted-foreground">
            {`Accept ${Object.values(accept).flat().join(', ')} files up to ${maxSize / (1024 * 1024)}MB each`}
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => {
            const fileStatus = getFileStatus(file);
            
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-card border rounded-md p-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="shrink-0 h-10 w-10 bg-muted flex items-center justify-center rounded-md font-medium text-xs overflow-hidden">
                    {file.type.includes("image") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">
                        {file.size < 1024 * 1024
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                      </p>
                      
                      {/* Upload status indicator */}
                      {fileStatus && (
                        <>
                          <span className="text-xs text-muted-foreground mx-1">•</span>
                          {fileStatus.status === 'uploading' && (
                            <div className="flex items-center gap-1">
                              <LoaderCircle className="h-3 w-3 animate-spin text-primary" />
                              <span className="text-xs text-primary">{fileStatus.progress}%</span>
                            </div>
                          )}
                          {fileStatus.status === 'success' && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-500">Uploaded</span>
                            </div>
                          )}
                          {fileStatus.status === 'error' && (
                            <span className="text-xs text-destructive">
                              {fileStatus.error || 'Upload failed'}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeFile(index)}
                  disabled={fileStatus?.status === 'uploading'}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 