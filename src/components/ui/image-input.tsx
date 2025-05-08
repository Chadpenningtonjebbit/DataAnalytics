"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MediaPicker } from '@/components/ui/media-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onFitChange?: (value: string) => void;
  onAltChange?: (value: string) => void;
  fitValue?: string;
  altText?: string;
  placeholder?: string;
  folder?: "brand-photos" | "products";
}

export function ImageInput({ 
  label = '', 
  value, 
  onChange,
  onFitChange,
  onAltChange,
  fitValue = 'cover',
  altText = '',
  placeholder = 'https://example.com/image.jpg',
  folder = 'brand-photos'
}: ImageInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false);
  
  // Clean the URL removing the url() wrapper if present
  const cleanUrl = (url: string): string => {
    return url?.replace(/^url\(['"]?|['"]?\)$/g, '') || '';
  };
  
  // Format the URL for CSS with url()
  const formatUrl = (url: string): string => {
    if (!url) return '';
    return url.startsWith('url(') ? url : `url(${url})`;
  };
  
  const imageUrl = cleanUrl(value);
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    onChange(newUrl ? formatUrl(newUrl) : '');
  };
  
  const handleMediaSelection = (url: string) => {
    onChange(formatUrl(url));
  };
  
  return (
    <div className={label ? "flex flex-col gap-2" : ""}>
      {label && <Label htmlFor={`image-${label.toLowerCase().replace(/\s+/g, '-')}`}>{label}</Label>}
      <div className="flex items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-9 w-10 flex items-center justify-center cursor-pointer rounded-l-md border border-r-0 border-input bg-background shadow-sm relative overflow-hidden"
              aria-label={`Image options for ${label}`}
            >
              {/* Checkerboard background for transparency */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 4px 4px'
                }}
              />
              
              {/* Image preview */}
              {imageUrl && (
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />
              )}
              
              {/* Empty state - just show the checkerboard pattern */}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" side="left" align="start" alignOffset={0} sideOffset={5}>
            <div className="space-y-3">
              {/* Image preview with browse overlay */}
              {imageUrl ? (
                <div 
                  className="aspect-video rounded overflow-hidden border border-input relative"
                  onMouseEnter={() => setShowPreviewOverlay(true)}
                  onMouseLeave={() => setShowPreviewOverlay(false)}
                >
                  <img 
                    src={imageUrl} 
                    alt={altText || "Image preview"} 
                    className={`w-full h-full object-${fitValue || 'cover'}`}
                  />
                  
                  {/* Browse overlay on hover */}
                  {showPreviewOverlay && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <MediaPicker 
                        onSelect={handleMediaSelection}
                        buttonLabel="Change Image"
                        triggerClassName="bg-white hover:bg-white/90"
                        mediaType="image"
                        folder={folder}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video rounded border border-input bg-slate-50 flex flex-col items-center justify-center">
                  <MediaPicker 
                    onSelect={handleMediaSelection}
                    buttonLabel="Select Image"
                    triggerClassName="bg-white hover:bg-white/90"
                    mediaType="image"
                    folder={folder}
                  />
                </div>
              )}
              
              {/* Alt text */}
              {onAltChange && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Alt Text</Label>
                  <Input 
                    value={altText} 
                    onChange={(e) => onAltChange(e.target.value)} 
                    placeholder="Image description"
                    className="h-8 text-xs"
                  />
                </div>
              )}
              
              {/* Object fit options */}
              {onFitChange && imageUrl && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Image Fit</Label>
                  <Select 
                    value={fitValue} 
                    onValueChange={onFitChange}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder="Select fit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover</SelectItem>
                      <SelectItem value="contain">Contain</SelectItem>
                      <SelectItem value="fill">Fill</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          id={`image-${label.toLowerCase().replace(/\s+/g, '-')}`}
          value={imageUrl}
          onChange={handleUrlChange}
          placeholder={placeholder}
          className="w-full rounded-l-none"
        />
      </div>
    </div>
  );
} 