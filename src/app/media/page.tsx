"use client";

import { useState, useCallback, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, ShoppingBag, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { useFileUploader } from '@/hooks/useFileUploader';

export default function Media() {
  const [activeTab, setActiveTab] = useState('brand-photos');
  
  // CSV product imports
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Brand photos
  const [brandPhotos, setBrandPhotos] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{ url: string; name: string }[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Fetch saved files on component mount
  useEffect(() => {
    const fetchSavedMedia = async () => {
      try {
        // Fetch brand photos
        const photosRes = await fetch(`/api/media?folder=brand-photos`);
        if (photosRes.ok) {
          const data = await photosRes.json();
          if (data.files && Array.isArray(data.files)) {
            setUploadedImages(data.files.map((file: { url: string; name: string }) => ({
              url: file.url,
              name: file.name
            })));
          }
        }
        
        // Fetch product feeds
        const feedsRes = await fetch(`/api/media?folder=products`);
        if (feedsRes.ok) {
          const data = await feedsRes.json();
          if (data.files && Array.isArray(data.files)) {
            setUploadedFileUrls(data.files.map((file: { url: string }) => file.url));
          }
        }
      } catch (err) {
        console.error("Error fetching saved media:", err);
      }
    };
    
    fetchSavedMedia();
  }, []);
  
  const handleBrandPhotosChange = useCallback((newFiles: File[]) => {
    setBrandPhotos(newFiles);
    setImageError(null);
  }, []);
  
  const handleProductFilesChange = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setError(null);
    setUploadProgress(0);
  }, []);

  const handleImageUploadComplete = useCallback((urls: string[]) => {
    const newImages = urls.map((url) => {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      return { url, name: fileName };
    });
    
    // Add to existing images
    setUploadedImages(prev => [...prev, ...newImages]);
    
    // Refresh images from server to ensure we have everything
    fetch(`/api/media?folder=brand-photos`)
      .then(res => res.json())
      .then(data => {
        if (data.files && Array.isArray(data.files)) {
          setUploadedImages(data.files.map((file: { url: string; name: string }) => ({
            url: file.url,
            name: file.name
          })));
        }
      })
      .catch(err => console.error("Error refreshing brand photos:", err));
  }, []);
  
  const handleFileUploadComplete = useCallback((urls: string[]) => {
    // Add to existing files
    setUploadedFileUrls(prev => [...prev, ...urls]);
    
    // Refresh product feeds from server to ensure we have everything
    fetch(`/api/media?folder=products`)
      .then(res => res.json())
      .then(data => {
        if (data.files && Array.isArray(data.files)) {
          setUploadedFileUrls(data.files.map((file: { url: string }) => file.url));
        }
      })
      .catch(err => console.error("Error refreshing product feeds:", err));
  }, []);
  
  const removeUploadedImage = (index: number) => {
    const imageToRemove = uploadedImages[index];
    
    if (!imageToRemove) return;
    
    // Remove from UI first for responsiveness
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    
    // Then attempt to delete from storage
    const pathParts = imageToRemove.url.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // Construct path for API
    const blobPath = `brand-photos/${fileName}`;
    
    // Call API to delete the file (we'll create this endpoint next)
    fetch(`/api/media/delete?path=${encodeURIComponent(blobPath)}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) {
          console.error('Failed to delete file from storage');
          // If deletion fails, don't add back to UI
        }
      })
      .catch(err => {
        console.error('Error deleting file:', err);
      });
  };

  const removeProductFile = (index: number) => {
    const fileUrl = uploadedFileUrls[index];
    
    if (!fileUrl) return;
    
    // Remove from UI first for responsiveness
    setUploadedFileUrls(prev => prev.filter((_, i) => i !== index));
    
    // Then attempt to delete from storage
    const pathParts = fileUrl.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // Construct path for API
    const blobPath = `products/${fileName}`;
    
    // Call API to delete the file
    fetch(`/api/media/delete?path=${encodeURIComponent(blobPath)}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) {
          console.error('Failed to delete file from storage');
        }
      })
      .catch(err => {
        console.error('Error deleting file:', err);
      });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader pageType="dashboard" />
      
      <main className="flex-1 p-12 bg-muted">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="Media Library"
            description="Manage your brand photos and product feeds"
          />
          
          <div className="mt-6 grid grid-cols-12 gap-6">
            {/* Left sidebar with tabs */}
            <div className="col-span-3">
              <Tabs 
                defaultValue="brand-photos" 
                orientation="vertical" 
                className="w-full"
                onValueChange={setActiveTab}
              >
                <TabsList className="flex flex-col h-auto items-stretch space-y-2 bg-muted text-muted-foreground w-full rounded-lg p-0">
                  <TabsTrigger value="brand-photos" className="justify-start w-full px-4 py-2 text-sm mb-0">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Brand Photos
                  </TabsTrigger>
                  <TabsTrigger value="product-feeds" className="justify-start w-full px-4 py-2 text-sm mb-0">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Product Feeds
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Right content area */}
            <div className="col-span-9">
              {activeTab === 'brand-photos' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="mb-1">Brand Photos</CardTitle>
                        <CardDescription>Upload and manage images for your brand</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Image upload section */}
                    <div className="space-y-3">
                      <FileUpload 
                        value={brandPhotos} 
                        onChange={handleBrandPhotosChange} 
                        maxFiles={10} 
                        accept={{
                          'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
                        }}
                        autoUpload={true}
                        onUploadComplete={handleImageUploadComplete}
                      />
                      
                      {imageError && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 text-sm flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Error</p>
                            <p>{imageError}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Brand photo gallery */}
                    {uploadedImages.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <h3 className="text-sm font-medium">Uploaded Images</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="relative group aspect-square bg-background rounded-md overflow-hidden border">
                              <img 
                                src={image.url} 
                                alt={image.name}
                                className="h-full w-full object-cover" 
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="h-8 w-8 rounded-full p-0"
                                  onClick={() => removeUploadedImage(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete image</span>
                                </Button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs truncate">
                                {image.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {activeTab === 'product-feeds' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="mb-1">Product Feeds</CardTitle>
                        <CardDescription>Import product data from CSV files</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* File upload section */}
                    <div className="space-y-3">
                      <FileUpload 
                        value={files} 
                        onChange={handleProductFilesChange} 
                        maxFiles={1} 
                        accept={{
                          'text/csv': ['.csv'],
                          'application/vnd.ms-excel': ['.csv', '.xls'],
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }} 
                        autoUpload={true}
                        onUploadComplete={handleFileUploadComplete}
                      />
                      
                      {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 text-sm flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Error</p>
                            <p>{error}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Success display for uploaded files */}
                      {uploadedFileUrls.length > 0 && (
                        <div className="mt-6 space-y-3">
                          <h3 className="text-sm font-medium">Uploaded Files</h3>
                          <div className="grid grid-cols-3 gap-4">
                            {uploadedFileUrls.map((url, index) => {
                              const fileName = url.split('/').pop() || 'file';
                              return (
                                <div key={index} className="relative group bg-background rounded-md overflow-hidden border p-4">
                                  <div className="flex flex-col items-center justify-center h-32">
                                    <ShoppingBag className="h-12 w-12 text-muted-foreground mb-2" />
                                    <p className="text-xs text-center text-muted-foreground break-all">
                                      {fileName}
                                    </p>
                                  </div>
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      className="h-8 w-8 rounded-full p-0"
                                      onClick={() => removeProductFile(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete file</span>
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4">
          SimpleBuilder © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
} 