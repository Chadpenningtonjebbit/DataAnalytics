"use client";

import { useState, useCallback, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, ShoppingBag, AlertCircle, CheckCircle, Trash2, Globe, Key, Loader2 } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { useFileUploader } from '@/hooks/useFileUploader';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { useDebouncedCallback } from '@/hooks/useDebounce';

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
  
  // Website scanner states
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [initialBrandName, setInitialBrandName] = useState<string>('');
  const [subpages, setSubpages] = useState<{url: string; title: string; type: string}[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanTimeoutId, setScanTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [lastScannedUrl, setLastScannedUrl] = useState<string>('');
  
  // API Integration states
  const [openAIKey, setOpenAIKey] = useState<string>('');
  const [initialApiKey, setInitialApiKey] = useState<string>('');
  
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
    
    // Load saved brand settings data
    const savedUrl = localStorage.getItem('brandWebsiteUrl') || '';
    setWebsiteUrl(savedUrl);
    
    const savedBrandName = localStorage.getItem('brandName') || '';
    setBrandName(savedBrandName);
    setInitialBrandName(savedBrandName);
    
    const savedApiKey = localStorage.getItem('brandOpenAIKey') || '';
    setOpenAIKey(savedApiKey);
    setInitialApiKey(savedApiKey);
    
    // Load saved subpages if they exist
    const savedSubpages = localStorage.getItem('brandWebsiteSubpages');
    if (savedSubpages) {
      try {
        const parsedSubpages = JSON.parse(savedSubpages);
        setSubpages(parsedSubpages);
        
        // If we have subpages, consider it as already scanned
        if (parsedSubpages.length > 0 && savedUrl) {
          setHasScanned(true);
          setLastScannedUrl(savedUrl);
        }
      } catch (error) {
        console.error('Error parsing saved subpages:', error);
      }
    }
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
    
    toast.success(`${urls.length} brand image${urls.length > 1 ? 's' : ''} uploaded successfully`);
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
    
    toast.success(`${urls.length} product file${urls.length > 1 ? 's' : ''} uploaded successfully`);
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
          toast.error('Failed to delete image from storage');
          // If deletion fails, don't add back to UI
        } else {
          toast.success('Image deleted successfully');
        }
      })
      .catch(err => {
        console.error('Error deleting file:', err);
        toast.error('Error deleting image');
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
          toast.error('Failed to delete product file');
        } else {
          toast.success('Product file deleted successfully');
        }
      })
      .catch(err => {
        console.error('Error deleting file:', err);
        toast.error('Error deleting product file');
      });
  };

  // Function to validate and format URL
  const validateUrl = (url: string): string => {
    let formattedUrl = url.trim();
    
    // Handle special case for URLs starting with @
    if (formattedUrl.startsWith('@')) {
      formattedUrl = formattedUrl.substring(1);
    }
    
    // Add protocol if missing
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    try {
      // Validate URL format
      new URL(formattedUrl);
      return formattedUrl;
    } catch (error) {
      // If URL is invalid, return the original input to avoid breaking user input
      return formattedUrl;
    }
  };
  
  // Function to scan website for subpages
  const scanWebsite = async () => {
    if (!websiteUrl) return;
    
    setIsScanning(true);
    setSubpages([]);
    
    // Create abort controller for fetch
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      const url = validateUrl(websiteUrl);
      
      // Show processing toast
      toast.loading('Scanning website...', {id: 'scan-toast'});
      
      // Use our server-side API endpoint
      const response = await fetch('/api/webscrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Handle non-JSON responses (like 504 Gateway Timeout HTML)
        if (response.status === 504 || response.status === 502 || response.status === 503) {
          throw new Error('The request timed out. This website may be too complex to scan in our cloud environment.');
        } else {
          throw new Error(`Failed to parse server response (Status: ${response.status})`);
        }
      }
      
      if (!response.ok || data.error) {
        // Handle specific error types with user-friendly messages
        const errorType = data.errorType || 'unknown_error';
        let errorMessage = data.error || 'Error scanning website';
        
        switch (errorType) {
          case 'access_forbidden':
            errorMessage = 'This website is blocking our access. Try a different site.';
            break;
          case 'not_found':
            errorMessage = 'Page not found. Please check the URL and try again.';
            break;
          case 'rate_limited':
            errorMessage = 'The website is rate limiting our requests. Try again later.';
            break;
          case 'server_error':
            errorMessage = 'The website server is experiencing issues. Try again later.';
            break;
          case 'not_html':
            errorMessage = 'The URL does not point to an HTML page that we can scan.';
            break;
          case 'empty_response':
            errorMessage = 'Received empty or invalid HTML response from the website.';
            break;
          case 'timeout':
            errorMessage = 'The website took too long to respond. Try again later.';
            break;
          case 'domain_not_found':
            errorMessage = 'Domain not found. Please check the URL is correct.';
            break;
          case 'connection_refused':
            errorMessage = 'Connection refused by the server. The site may be down.';
            break;
          case 'connection_timeout':
            errorMessage = 'Connection timed out. The site may be slow or unreachable.';
            break;
          case 'ssl_error':
            errorMessage = 'SSL/TLS certificate error. The site may have security issues.';
            break;
          case 'bot_protection':
            errorMessage = 'This website has bot protection that blocks our scanner. Please try a different site.';
            break;
          case 'complex_site':
            errorMessage = 'This website is too complex to scan in our cloud environment. Please try a simpler website.';
            break;
        }
        
        throw new Error(errorMessage);
      }
      
      const html = data.html;
      
      // Use a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const pageTitle = doc.querySelector('title')?.textContent || 'Homepage';
      
      const foundSubpages: {url: string; title: string; type: string}[] = [
        {
          url: url,
          title: pageTitle,
          type: 'page'
        }
      ];
      
      // Find all links in the HTML
      const links = doc.querySelectorAll('a');
      
      // Create a URL object from the base URL
      const baseUrl = new URL(url);
      
      // Process each link
      links.forEach(link => {
        try {
          let href = link.getAttribute('href');
          if (!href) return;
          
          // Skip empty, hash, or javascript links
          if (href === '' || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
          }
          
          // Convert relative URLs to absolute
          let absoluteUrl: URL;
          try {
            if (href.startsWith('/')) {
              // Relative path from root
              absoluteUrl = new URL(href, baseUrl.origin);
            } else if (!href.includes('://')) {
              // Relative path from current location
              absoluteUrl = new URL(href, url);
            } else {
              // Already an absolute URL
              absoluteUrl = new URL(href);
            }
          } catch (error) {
            return; // Skip invalid URLs
          }
          
          // Only include links to the same domain
          if (absoluteUrl.hostname === baseUrl.hostname) {
            // Get the text of the link or use the URL path if no text
            const linkText = link.textContent?.trim() || absoluteUrl.pathname;
            
            // Determine the type of content based on the URL pattern or text
            let type = 'page';
            const path = absoluteUrl.pathname.toLowerCase();
            
            if (path.includes('blog') || path.includes('article') || path.includes('news')) {
              type = 'blog';
            } else if (path.includes('product') || path.includes('shop') || path.includes('store')) {
              type = 'product';
            } else if (path.includes('about') || path.includes('team') || path.includes('company')) {
              type = 'about';
            } else if (path.includes('contact') || path.includes('support')) {
              type = 'contact';
            } else if (path.includes('faq') || path.includes('help')) {
              type = 'faq';
            }
            
            // Only add if it's not already in the list
            if (!foundSubpages.some(page => page.url === absoluteUrl.href)) {
              foundSubpages.push({
                url: absoluteUrl.href,
                title: linkText,
                type
              });
            }
          } else {
            // Process external product URLs
            const href = absoluteUrl.href.toLowerCase();
            const path = absoluteUrl.pathname.toLowerCase();
            
            // Improved pattern matching for product URLs
            const isProductUrl = 
              // Common product URL patterns with more specific matching
              (path.includes('/p/') || 
               // Match specific product identifiers in paths
               path.match(/\/product[-_]?[0-9a-zA-Z]{3,}/) ||
               path.match(/\/products\/[^\/]+$/) ||
               path.match(/\/item[-_]?[0-9a-zA-Z]{3,}/) ||
               path.match(/\/pd\/[^\/]+$/) ||
               // Look for SKU/product ID patterns in URL
               path.match(/\d{5,}\/\d{5,}/) ||
               // Match query parameters common in product URLs
               href.includes('product_id=') ||
               href.includes('productid=') ||
               href.includes('item=') ||
               href.includes('sku=') ||
               // Match color parameters in query string which often indicate product pages
               href.match(/[?&]color=/i) ||
               href.match(/[?&]size=/i) ||
               // Look for common product review sections
               path.includes('/review') ||
               // Check common e-commerce domains with product indicators
               (absoluteUrl.hostname.includes('amazon.') && (path.includes('/dp/') || path.includes('/gp/product/'))) || 
               (absoluteUrl.hostname.includes('ebay.') && path.includes('/itm/')) ||
               (absoluteUrl.hostname.includes('walmart.') && path.includes('/ip/')) ||
               (absoluteUrl.hostname.includes('target.') && path.match(/\/-\/A-\d+/)) ||
               (absoluteUrl.hostname.includes('bestbuy.') && path.includes('/site/')) ||
               (absoluteUrl.hostname.includes('etsy.') && path.includes('/listing/')) ||
               (absoluteUrl.hostname.includes('zappos.') && path.includes('/product/')) ||
               // Match Dick's Sporting Goods product URL pattern specifically
               (absoluteUrl.hostname.includes('dickssportinggoods.') && 
                (path.includes('/p/') || href.match(/[?&]color=/i) || path.match(/\/[a-z0-9]{5,}\/[a-z0-9]{5,}/))));
            
            if (isProductUrl) {
              const linkText = link.textContent?.trim() || "External Product";
              
              // Only add if it's not already in the list
              if (!foundSubpages.some(page => page.url === absoluteUrl.href)) {
                foundSubpages.push({
                  url: absoluteUrl.href,
                  title: linkText,
                  type: 'external-product'
                });
              }
            }
          }
        } catch (error) {
          console.error('Error processing link:', error);
        }
      });
      
      // Update state with found subpages
      setSubpages(foundSubpages);
      setHasScanned(true);
      setLastScannedUrl(url);
      
      // Save to localStorage
      localStorage.setItem('brandWebsiteUrl', url);
      localStorage.setItem('brandWebsiteSubpages', JSON.stringify(foundSubpages));
      
      // Dismiss loading toast and show success
      toast.dismiss('scan-toast');
      toast.success(`Website scanned successfully. Found ${foundSubpages.length} pages.`);
      
    } catch (error) {
      console.error('Error scanning website:', error);
      toast.dismiss('scan-toast');
      toast.error((error as Error).message || 'Failed to scan website');
    } finally {
      setIsScanning(false);
      if (scanTimeoutId) {
        clearTimeout(scanTimeoutId);
        setScanTimeoutId(null);
      }
      setAbortController(null);
    }
  };
  
  // Function to cancel an in-progress scan
  const cancelScan = () => {
    if (abortController) {
      abortController.abort();
    }
    
    if (scanTimeoutId) {
      clearTimeout(scanTimeoutId);
      setScanTimeoutId(null);
    }
    
    setIsScanning(false);
  };
  
  // Function to handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebsiteUrl(e.target.value);
  };
  
  // Memoized save functions
  const saveBrandNameToStorage = useCallback((value: string) => {
    localStorage.setItem('brandName', value);
    toast.success('Brand name saved successfully');
  }, []);
  
  const saveApiKeyToStorage = useCallback((value: string) => {
    localStorage.setItem('brandOpenAIKey', value);
    toast.success('API key saved');
  }, []);
  
  // Create debounced versions of the save functions
  const debouncedSaveBrandName = useDebouncedCallback(saveBrandNameToStorage, 1000);
  const debouncedSaveApiKey = useDebouncedCallback(saveApiKeyToStorage, 1000);
  
  // Function to handle brand name input change
  const handleBrandNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBrandName(value);
    
    // Only save if value is not empty and has changed
    if (value !== initialBrandName && value !== '') {
      debouncedSaveBrandName(value);
    }
  };
  
  // Function to handle OpenAI API key change
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOpenAIKey(value);
    
    // Only save if value is not empty and has changed
    if (value !== initialApiKey && value !== '') {
      debouncedSaveApiKey(value);
    }
  };
  
  // Function to reset website scan
  const resetSubpages = () => {
    setSubpages([]);
    setHasScanned(false);
    localStorage.removeItem('brandWebsiteSubpages');
    toast.info('Website content cleared');
  };
  
  // Format content type for display
  const formatType = (type: string) => {
    if (type === 'external-product') {
      return 'External Product';
    } else if (type === 'unknown-link') {
      return 'Unknown URL Type';
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader pageType="dashboard" />
      
      <main className="flex-1 p-12 bg-muted">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="My Brand"
            description="Manage your brand assets and settings"
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
                    Brand Assets
                  </TabsTrigger>
                  <TabsTrigger value="product-feeds" className="justify-start w-full px-4 py-2 text-sm mb-0">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Product Feeds
                  </TabsTrigger>
                  <TabsTrigger value="personalization" className="justify-start w-full px-4 py-2 text-sm mb-0">
                    <Globe className="h-5 w-5 mr-2" />
                    Personalization
                  </TabsTrigger>
                  <TabsTrigger value="integrations" className="justify-start w-full px-4 py-2 text-sm mb-0">
                    <Key className="h-5 w-5 mr-2" />
                    Integrations
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
                        <CardTitle className="mb-1">Brand Assets</CardTitle>
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
                        <CardDescription>Upload CSV or Excel files with your product information</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* File upload section */}
                    <div className="space-y-3">
                      <FileUpload 
                        value={files} 
                        onChange={handleProductFilesChange} 
                        maxFiles={5} 
                        accept={{
                          'text/csv': ['.csv'],
                          'application/vnd.ms-excel': ['.xlsx', '.xls'],
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                        autoUpload={true}
                        onUploadComplete={handleFileUploadComplete}
                      />
                    </div>
                    
                    {/* Uploaded files list */}
                    {uploadedFileUrls.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-medium mb-3">Uploaded Files</h3>
                        <div className="space-y-2">
                          {uploadedFileUrls.map((fileUrl, index) => {
                            // Extract file name from URL
                            const urlParts = fileUrl.split('/');
                            const fileName = urlParts[urlParts.length - 1];
                            
                            return (
                              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md border">
                                <span className="truncate flex-1 text-sm">{fileName}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => removeProductFile(index)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {activeTab === 'personalization' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="mb-1">Personalization</CardTitle>
                        <CardDescription>Configure brand settings for personalized content</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Brand Name */}
                    <div className="space-y-2">
                      <Label htmlFor="brand-name">Brand Name</Label>
                      <Input 
                        id="brand-name" 
                        value={brandName} 
                        onChange={handleBrandNameChange} 
                        placeholder="Enter your brand name" 
                      />
                    </div>
                    
                    {/* Website Scanner */}
                    <div className="space-y-3 mt-8 pt-6 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="website-url">Website URL</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="website-url" 
                            value={websiteUrl} 
                            onChange={handleUrlChange} 
                            placeholder="https://example.com" 
                            disabled={isScanning}
                            className="flex-1"
                          />
                          {isScanning ? (
                            <Button variant="outline" onClick={cancelScan}>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Cancel
                            </Button>
                          ) : (
                            <Button 
                              onClick={hasScanned && lastScannedUrl === websiteUrl ? resetSubpages : scanWebsite} 
                              disabled={!websiteUrl.trim()}
                            >
                              {hasScanned && lastScannedUrl === websiteUrl ? 'Clear' : 'Scan'}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Subpages Table */}
                      {subpages.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Found Content ({subpages.length} pages)</h3>
                          </div>
                          
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Title</TableHead>
                                  <TableHead>Type</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subpages.map((page, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">
                                      <a 
                                        href={page.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`hover:underline ${page.type === 'external-product' ? 'text-green-600 dark:text-green-400 flex items-center' : 'text-primary'}`}
                                      >
                                        {page.type === 'external-product' && <ShoppingBag className="h-4 w-4 mr-2 inline-block" />}
                                        {page.title}
                                      </a>
                                    </TableCell>
                                    <TableCell>{formatType(page.type)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Direct Product URL Test */}
                      <div className="space-y-3 mt-8 pt-6 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="direct-product-url">Test Product URL Directly</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="direct-product-url" 
                              placeholder="https://www.example.com/product/123" 
                              className="flex-1"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const inputUrl = (e.target as HTMLInputElement).value;
                                  if (inputUrl) {
                                    const url = validateUrl(inputUrl);
                                    try {
                                      const absoluteUrl = new URL(url);
                                      const path = absoluteUrl.pathname.toLowerCase();
                                      const href = absoluteUrl.href.toLowerCase();
                                      
                                      // Use the same product detection logic
                                      const isProductUrl = 
                                        (path.includes('/p/') || 
                                         path.match(/\/product[-_]?[0-9a-zA-Z]{3,}/) ||
                                         path.match(/\/products\/[^\/]+$/) ||
                                         path.match(/\/item[-_]?[0-9a-zA-Z]{3,}/) ||
                                         path.match(/\/pd\/[^\/]+$/) ||
                                         path.match(/\d{5,}\/\d{5,}/) ||
                                         href.includes('product_id=') ||
                                         href.includes('productid=') ||
                                         href.includes('item=') ||
                                         href.includes('sku=') ||
                                         href.match(/[?&]color=/i) ||
                                         href.match(/[?&]size=/i) ||
                                         path.includes('/review') ||
                                         (absoluteUrl.hostname.includes('amazon.') && (path.includes('/dp/') || path.includes('/gp/product/'))) || 
                                         (absoluteUrl.hostname.includes('ebay.') && path.includes('/itm/')) ||
                                         (absoluteUrl.hostname.includes('walmart.') && path.includes('/ip/')) ||
                                         (absoluteUrl.hostname.includes('target.') && path.match(/\/-\/A-\d+/)) ||
                                         (absoluteUrl.hostname.includes('bestbuy.') && path.includes('/site/')) ||
                                         (absoluteUrl.hostname.includes('etsy.') && path.includes('/listing/')) ||
                                         (absoluteUrl.hostname.includes('zappos.') && path.includes('/product/')) ||
                                         (absoluteUrl.hostname.includes('dickssportinggoods.') && 
                                          (path.includes('/p/') || href.match(/[?&]color=/i) || path.match(/\/[a-z0-9]{5,}\/[a-z0-9]{5,}/))));
                                      
                                      const newPage = {
                                        url: url,
                                        title: `Product: ${absoluteUrl.hostname}`,
                                        type: isProductUrl ? 'external-product' : 'unknown-link'
                                      };
                                      
                                      // Add to subpages if not already there
                                      if (!subpages.some(page => page.url === url)) {
                                        setSubpages(prev => [...prev, newPage]);
                                        // Save to localStorage
                                        localStorage.setItem('brandWebsiteSubpages', JSON.stringify([...subpages, newPage]));
                                        toast.success(`URL added as ${formatType(newPage.type)}`);
                                      } else {
                                        toast.info('URL already in list');
                                      }
                                      (e.target as HTMLInputElement).value = '';
                                    } catch (error) {
                                      toast.error('Invalid URL format');
                                    }
                                  }
                                }
                              }}
                            />
                            <Button variant="outline" onClick={() => {
                              const input = document.getElementById('direct-product-url') as HTMLInputElement;
                              const inputUrl = input.value;
                              if (inputUrl) {
                                const url = validateUrl(inputUrl);
                                try {
                                  const absoluteUrl = new URL(url);
                                  const path = absoluteUrl.pathname.toLowerCase();
                                  const href = absoluteUrl.href.toLowerCase();
                                  
                                  // Use the same product detection logic
                                  const isProductUrl = 
                                    (path.includes('/p/') || 
                                     path.match(/\/product[-_]?[0-9a-zA-Z]{3,}/) ||
                                     path.match(/\/products\/[^\/]+$/) ||
                                     path.match(/\/item[-_]?[0-9a-zA-Z]{3,}/) ||
                                     path.match(/\/pd\/[^\/]+$/) ||
                                     path.match(/\d{5,}\/\d{5,}/) ||
                                     href.includes('product_id=') ||
                                     href.includes('productid=') ||
                                     href.includes('item=') ||
                                     href.includes('sku=') ||
                                     href.match(/[?&]color=/i) ||
                                     href.match(/[?&]size=/i) ||
                                     path.includes('/review') ||
                                     (absoluteUrl.hostname.includes('amazon.') && (path.includes('/dp/') || path.includes('/gp/product/'))) || 
                                     (absoluteUrl.hostname.includes('ebay.') && path.includes('/itm/')) ||
                                     (absoluteUrl.hostname.includes('walmart.') && path.includes('/ip/')) ||
                                     (absoluteUrl.hostname.includes('target.') && path.match(/\/-\/A-\d+/)) ||
                                     (absoluteUrl.hostname.includes('bestbuy.') && path.includes('/site/')) ||
                                     (absoluteUrl.hostname.includes('etsy.') && path.includes('/listing/')) ||
                                     (absoluteUrl.hostname.includes('zappos.') && path.includes('/product/')) ||
                                     (absoluteUrl.hostname.includes('dickssportinggoods.') && 
                                      (path.includes('/p/') || href.match(/[?&]color=/i) || path.match(/\/[a-z0-9]{5,}\/[a-z0-9]{5,}/))));
                                  
                                  const newPage = {
                                    url: url,
                                    title: `Product: ${absoluteUrl.hostname}`,
                                    type: isProductUrl ? 'external-product' : 'unknown-link'
                                  };
                                  
                                  // Add to subpages if not already there
                                  if (!subpages.some(page => page.url === url)) {
                                    setSubpages(prev => [...prev, newPage]);
                                    // Save to localStorage
                                    localStorage.setItem('brandWebsiteSubpages', JSON.stringify([...subpages, newPage]));
                                    toast.success(`URL added as ${formatType(newPage.type)}`);
                                  } else {
                                    toast.info('URL already in list');
                                  }
                                  input.value = '';
                                } catch (error) {
                                  toast.error('Invalid URL format');
                                }
                              }
                            }}>
                              Add URL
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter a product URL and press Enter or click Add URL to test if it's detected as a product
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === 'integrations' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="mb-1">Integrations</CardTitle>
                        <CardDescription>Configure external API integrations</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* OpenAI API Key */}
                    <div className="space-y-2">
                      <Label htmlFor="openai-key">
                        OpenAI API Key
                      </Label>
                      <div className="flex gap-2">
                        <Input 
                          id="openai-key" 
                          value={openAIKey} 
                          onChange={handleApiKeyChange} 
                          placeholder="sk-..." 
                          type="password"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your API key is stored locally and never sent to our servers.
                      </p>
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