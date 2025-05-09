import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
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

    // Get file extension
    const extension = file.name.split(".").pop()?.toLowerCase() || '';
    
    // Generate a unique filename with original extension
    const uniqueFileName = `${uuidv4()}.${extension}`;
    
    // Set the appropriate folder based on file type
    const folder = isImage ? 'brand-photos' : 'products';
    const pathname = `${folder}/${uniqueFileName}`;

    if (isLocal) {
      // Local development: Store files in public directory
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadsDir = path.join(process.cwd(), `public/uploads/${folder}`);
      
      // Create directory if it doesn't exist
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (err) {
        console.error('Error creating directory:', err);
      }
      
      const filePath = path.join(uploadsDir, uniqueFileName);
      await writeFile(filePath, buffer);
      
      // Return a local URL
      const url = `/uploads/${folder}/${uniqueFileName}`;
      
      return NextResponse.json({
        url,
        success: true,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    } else {
      // Production: Use Vercel Blob
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
          const filePath = path.join(uploadsDir, uniqueFileName);
          await writeFile(filePath, buffer);
          
          const url = `/uploads/${folder}/${uniqueFileName}`;
          
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