import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import fs from 'fs';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

// Determine if we're running locally or in production
const isLocal = process.env.NODE_ENV === 'development';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Valid file types
const validImageTypes = [
  "image/jpeg", 
  "image/png", 
  "image/gif", 
  "image/webp",
  "image/svg+xml"
];

const validDataTypes = [
  "text/csv", 
  "application/vnd.ms-excel", 
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

// Helper function to sanitize filenames
function sanitizeFilename(filename: string): string {
  // Replace special characters that might cause issues in URLs or file systems
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace any non-alphanumeric or dot/dash characters with underscore
    .replace(/_{2,}/g, '_'); // Replace multiple consecutive underscores with a single one
}

// Helper function to ensure unique filenames
function createUniqueFilename(filename: string, existingFiles: string[] = []): string {
  // Split filename into base and extension
  const lastDotIndex = filename.lastIndexOf('.');
  const base = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  const uniqueName = `${base}_${timestamp}${extension}`;
  
  // Check if this name already exists in the list
  if (existingFiles.includes(uniqueName)) {
    // Add a random number to further ensure uniqueness in the rare case of collision
    return `${base}_${timestamp}_${Math.floor(Math.random() * 1000)}${extension}`;
  }
  
  return uniqueName;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Determine file type category
    const isImage = validImageTypes.includes(file.type);
    const isDataFile = validDataTypes.includes(file.type);
    
    // Validate file type
    if (!isImage && !isDataFile) {
      return NextResponse.json(
        { error: "Invalid file type. Only images, CSV, and Excel files are allowed." },
        { status: 400 }
      );
    }
    
    // Set the appropriate folder based on file type
    const folder = isImage ? 'brand-photos' : 'products';
    
    // Sanitize the original filename
    let sanitizedFilename = sanitizeFilename(file.name);

    if (isLocal) {
      // Local development: Store files in public directory
      const uploadsDir = path.join(process.cwd(), `public/uploads/${folder}`);
      
      // Create directory if it doesn't exist
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (err) {
        console.error('Error creating directory:', err);
      }
      
      // Get existing files to check for name conflicts
      const existingFiles = fs.existsSync(uploadsDir) 
        ? fs.readdirSync(uploadsDir) 
        : [];
      
      // Ensure filename is unique
      if (existingFiles.includes(sanitizedFilename)) {
        sanitizedFilename = createUniqueFilename(sanitizedFilename, existingFiles);
      }
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(uploadsDir, sanitizedFilename);
      await writeFile(filePath, buffer);
      
      // Return a local URL
      const url = `/uploads/${folder}/${sanitizedFilename}`;
      
      return NextResponse.json({
        url,
        success: true,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    } else {
      // Production: Use Vercel Blob
      const pathname = `${folder}/${sanitizedFilename}`;
      
      try {
        // Add better logging for debugging
        console.log("Uploading to Vercel Blob:", pathname);
        
        const blob = await put(pathname, file, {
          access: 'public',
        });

        console.log("Blob upload successful:", blob.url);
        
        // Return success with blob URL
        return NextResponse.json({
          url: blob.url,
          success: true,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
      } catch (blobError) {
        console.error("Vercel Blob upload error:", blobError);
        
        // Fallback to local storage even in production if Blob fails
        try {
          console.log("Attempting fallback to local storage");
          const buffer = Buffer.from(await file.arrayBuffer());
          const uploadsDir = path.join(process.cwd(), `public/uploads/${folder}`);
          
          await mkdir(uploadsDir, { recursive: true });
          
          // Get existing files to check for name conflicts
          const existingFiles = fs.existsSync(uploadsDir) 
            ? fs.readdirSync(uploadsDir) 
            : [];
          
          // Ensure filename is unique
          if (existingFiles.includes(sanitizedFilename)) {
            sanitizedFilename = createUniqueFilename(sanitizedFilename, existingFiles);
          }
          
          const filePath = path.join(uploadsDir, sanitizedFilename);
          await writeFile(filePath, buffer);
          
          const url = `/uploads/${folder}/${sanitizedFilename}`;
          
          return NextResponse.json({
            url,
            success: true,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          });
        } catch (fallbackError) {
          console.error("Fallback storage error:", fallbackError);
          throw blobError; // Rethrow the original error
        }
      }
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "File upload failed" },
      { status: 500 }
    );
  }
} 