"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Globe, Key } from "lucide-react";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface BrandSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Subpage {
  url: string;
  title: string;
  type: string;
}

export function BrandSettingsModal({ open, onOpenChange }: BrandSettingsModalProps) {
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [subpages, setSubpages] = useState<Subpage[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanTimeoutId, setScanTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [lastScannedUrl, setLastScannedUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState('website');
  const [openAIKey, setOpenAIKey] = useState('');
  
  // Load saved data from localStorage when modal opens
  useEffect(() => {
    if (open) {
      const savedUrl = localStorage.getItem('brandWebsiteUrl') || '';
      setWebsiteUrl(savedUrl);
      
      // Load saved brand name
      const savedBrandName = localStorage.getItem('brandName') || '';
      setBrandName(savedBrandName);
      
      // Load saved OpenAI API key
      const savedApiKey = localStorage.getItem('brandOpenAIKey') || '';
      setOpenAIKey(savedApiKey);
      
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
    }
  }, [open]);
  
  // Function to validate and format URL
  const validateUrl = (url: string): string => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    return formattedUrl;
  };
  
  // Function to scan website for subpages
  const scanWebsite = async () => {
    if (!websiteUrl) return;
    
    setIsScanning(true);
    setScanError(null);
    setSubpages([]);
    setScanProgress('Connecting to website...');
    
    // Set a timeout to show progress messages
    const timeoutId = setTimeout(() => {
      setScanProgress('Still scanning... This may take longer for complex websites');
    }, 5000);
    
    setScanTimeoutId(timeoutId);
    
    // Create abort controller for fetch
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      const url = validateUrl(websiteUrl);
      
      // Use our server-side API endpoint instead of CORS proxy
      const response = await fetch('/api/webscrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setScanProgress('Processing page content...');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const html = data.html;
      
      // Use a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const pageTitle = doc.querySelector('title')?.textContent || 'Homepage';
      
      const foundSubpages: Subpage[] = [
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
            const lowerPath = absoluteUrl.pathname.toLowerCase();
            const lowerText = linkText.toLowerCase();
            
            if (lowerPath.includes('blog') || lowerPath.includes('article') || lowerPath.includes('news')) {
              type = 'blog';
            } else if (lowerPath.includes('product') || lowerPath.includes('shop') || lowerPath.includes('store')) {
              type = 'product';
            } else if (lowerPath.includes('about') || lowerText.includes('about us')) {
              type = 'about';
            } else if (lowerPath.includes('contact') || lowerText.includes('contact us')) {
              type = 'contact';
            }
            
            // Check if this URL is already in our list
            const isDuplicate = foundSubpages.some(page => page.url === absoluteUrl.href);
            
            if (!isDuplicate) {
              foundSubpages.push({
                url: absoluteUrl.href,
                title: linkText,
                type
              });
            }
          }
        } catch (error) {
          // Skip links that can't be processed
        }
      });
      
      // Update the state with found subpages
      setSubpages(foundSubpages);
      
      // Save to localStorage
      localStorage.setItem('brandWebsiteUrl', url);
      localStorage.setItem('brandWebsiteSubpages', JSON.stringify(foundSubpages));
      
      // Mark as scanned
      setHasScanned(true);
      setLastScannedUrl(url);
      
    } catch (error) {
      console.error('Error scanning website:', error);
      setScanError('Error scanning website. Please check the URL and try again.');
    } finally {
      if (scanTimeoutId) {
        clearTimeout(scanTimeoutId);
        setScanTimeoutId(null);
      }
      setScanProgress('');
      setIsScanning(false);
    }
  };
  
  // Function to cancel the scan
  const cancelScan = () => {
    if (scanTimeoutId) {
      clearTimeout(scanTimeoutId);
      setScanTimeoutId(null);
    }
    
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    setIsScanning(false);
    setScanProgress('');
    setScanError('Scan cancelled');
  };
  
  // Function to handle API key change
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpenAIKey(e.target.value);
  };
  
  // Function to handle form submission
  const handleSave = () => {
    // Save website URL, brand name and OpenAI API key to localStorage
    localStorage.setItem('brandWebsiteUrl', websiteUrl);
    localStorage.setItem('brandName', brandName);
    localStorage.setItem('brandOpenAIKey', openAIKey);
    onOpenChange(false);
  };
  
  // Function to reset subpages
  const resetSubpages = () => {
    setSubpages([]);
    localStorage.removeItem('brandWebsiteSubpages');
  };
  
  // Get unique content types from subpages
  const contentTypes = useMemo(() => {
    const types = new Set(subpages.map(page => page.type));
    return ['all', ...Array.from(types)];
  }, [subpages]);
  
  // Convert type to title case
  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Function to handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setWebsiteUrl(newValue);
    localStorage.setItem('brandWebsiteUrl', newValue);
    
    // If URL changes from last scanned URL, allow rescanning
    if (newValue !== lastScannedUrl) {
      setHasScanned(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Brand Settings</DialogTitle>
          <DialogDescription>
            Configure your brand settings for SimpleBuilder.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="website">Website</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="website" className="space-y-4">
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="brand-name">
                  Brand Name
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="brand-name"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Your Brand Name"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="website-url">
                  Website URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="website-url"
                    value={websiteUrl}
                    onChange={handleUrlChange}
                    placeholder="https://yourbrand.com"
                    className="flex-1"
                  />
                  <Button 
                    onClick={isScanning ? cancelScan : scanWebsite} 
                    disabled={(!websiteUrl && !isScanning) || (hasScanned && websiteUrl === lastScannedUrl && !isScanning)}
                    className="whitespace-nowrap"
                  >
                    {isScanning ? "Cancel" : "Scan"}
                  </Button>
                </div>
              </div>
              
              {scanError && (
                <div className="text-sm text-red-500 mt-2">
                  {scanError}
                </div>
              )}
              
              {isScanning && scanProgress && (
                <div className="text-sm text-blue-500 mt-2 flex items-center">
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  {scanProgress}
                </div>
              )}
              
              {subpages.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">
                        Discovered Pages ({subpages.length})
                      </Label>
                    </div>
                  </div>
                  
                  <div className="border rounded-md">
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[75%] sticky top-0 bg-background z-10">Page</TableHead>
                            <TableHead className="w-[25%] sticky top-0 bg-background z-10">Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subpages.map((page, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <a 
                                  href={page.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 truncate block max-w-[400px]" 
                                  title={page.title}
                                >
                                  {page.title}
                                </a>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatType(page.type)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="integrations" className="space-y-4">
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="openai-key" className="text-base font-medium">
                    OpenAI API Key
                  </Label>
                </div>
                <Input
                  id="openai-key"
                  type="password"
                  value={openAIKey}
                  onChange={handleApiKeyChange}
                  placeholder="sk-..."
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key is stored securely and used for AI personalization features across all experiences.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 