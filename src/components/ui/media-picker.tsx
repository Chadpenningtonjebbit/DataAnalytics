"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Image, Loader2, Upload, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface MediaFile {
  url: string;
  name: string;
  type: string;
  uploadedAt: string;
}

interface MediaPickerProps {
  onSelect: (url: string) => void;
  buttonLabel?: string;
  triggerClassName?: string;
  mediaType?: "image" | "data" | "all";
  folder?: "brand-photos" | "products";
  customTrigger?: React.ReactNode;
}

export function MediaPicker({
  onSelect,
  buttonLabel = "Select Media",
  triggerClassName = "",
  mediaType = "image",
  folder = "brand-photos",
  customTrigger
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadMediaFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/media?folder=${folder}`);
      if (response.ok) {
        const data = await response.json();
        if (data.files && Array.isArray(data.files)) {
          setMediaFiles(data.files);
        }
      }
    } catch (error) {
      console.error("Error loading media files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadMediaFiles();
    }
  }, [open, folder]);

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('folder', folder);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success("Media file has been uploaded successfully");
        loadMediaFiles(); // Refresh the list after upload
      } else {
        toast.error("There was an error uploading your file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("There was an error uploading your file");
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredFiles = mediaFiles.filter((file) => {
    // Filter by media type
    if (mediaType !== "all") {
      const isImage = !file.name.endsWith(".csv") && 
                      !file.name.endsWith(".xlsx") && 
                      !file.name.endsWith(".xls");
      const isExpectedType = mediaType === "image" ? isImage : !isImage;
      if (!isExpectedType) return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      return file.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? (
          <Button variant="outline" className={triggerClassName}>
            {customTrigger}
          </Button>
        ) : (
          <Button variant="outline" className={triggerClassName}>
            <Image className="h-4 w-4 mr-2" />
            {buttonLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
          <DialogDescription>
            Choose from your uploaded media files
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative my-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by filename..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFiles.length === 0 && !searchTerm ? (
          <div className="text-center py-8 text-muted-foreground">
            No media files found
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {/* Add Media Tile */}
            <div
              className="relative aspect-square bg-background rounded-md overflow-hidden border transition-all cursor-pointer hover:border-primary hover:ring-2 hover:ring-primary hover:ring-offset-2 flex flex-col items-center justify-center"
              onClick={handleUploadClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept={mediaType === "image" ? "image/*" : mediaType === "data" ? ".csv,.xlsx,.xls" : "*"}
              />
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <Plus className="h-10 w-10 text-muted-foreground mb-2" />
                </>
              )}
            </div>
            
            {/* Existing Media Files */}
            {filteredFiles.map((file) => (
              <div
                key={file.url}
                className="relative aspect-square bg-background rounded-md overflow-hidden border transition-all cursor-pointer hover:border-primary hover:ring-2 hover:ring-primary hover:ring-offset-2"
                onClick={() => handleSelect(file.url)}
              >
                {!file.name.endsWith(".csv") &&
                !file.name.endsWith(".xlsx") &&
                !file.name.endsWith(".xls") ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-xs text-center text-muted-foreground break-all">
                      {file.name}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 