import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import fs from 'fs';
import path from 'path';
import { readdir } from 'fs/promises';

// Determine if we're running locally or in production
const isLocal = process.env.NODE_ENV === 'development';

// Define a file interface
interface MediaFile {
  url: string;
  name: string;
  type: 'image' | 'data';
  uploadedAt: string;
}

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '';

    if (!folder || (folder !== 'brand-photos' && folder !== 'products')) {
      return NextResponse.json(
        { error: "Invalid folder. Must be 'brand-photos' or 'products'" },
        { status: 400 }
      );
    }

    if (isLocal) {
      // Local development: List files from public directory
      try {
        const uploadsDir = path.join(process.cwd(), `public/uploads/${folder}`);
        let files: MediaFile[] = [];
        
        try {
          // Check if directory exists
          if (fs.existsSync(uploadsDir)) {
            const fileNames = await readdir(uploadsDir);
            files = fileNames.map(fileName => {
              const url = `/uploads/${folder}/${fileName}`;
              return {
                url,
                name: fileName,
                type: fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls') 
                  ? 'data' : 'image',
                uploadedAt: new Date().toISOString(), // We don't have actual upload time for local files
              };
            });
          }
        } catch (err) {
          console.error('Error reading directory:', err);
        }
        
        return NextResponse.json({ files });
      } catch (err) {
        console.error('Error listing local files:', err);
        return NextResponse.json({ files: [] });
      }
    } else {
      // Production: List files from Vercel Blob
      try {
        console.log(`Listing blobs in folder: ${folder}`);
        const { blobs } = await list({ prefix: `${folder}/` });
        console.log(`Found ${blobs.length} blobs`);
        
        const files: MediaFile[] = blobs.map(blob => ({
          url: blob.url,
          name: blob.pathname.split('/').pop() || '',
          type: blob.pathname.endsWith('.csv') || blob.pathname.endsWith('.xlsx') || blob.pathname.endsWith('.xls') 
            ? 'data' : 'image',
          uploadedAt: blob.uploadedAt.toISOString(),
        }));
        
        return NextResponse.json({ files });
      } catch (blobError) {
        console.error("Error listing Vercel Blob files:", blobError);
        
        // Fallback to local storage even in production if Blob listing fails
        try {
          console.log("Falling back to local file listing");
          const uploadsDir = path.join(process.cwd(), `public/uploads/${folder}`);
          let files: MediaFile[] = [];
          
          // Check if directory exists
          if (fs.existsSync(uploadsDir)) {
            const fileNames = await readdir(uploadsDir);
            files = fileNames.map(fileName => {
              const url = `/uploads/${folder}/${fileName}`;
              return {
                url,
                name: fileName,
                type: fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls') 
                  ? 'data' : 'image',
                uploadedAt: new Date().toISOString(),
              };
            });
          }
          
          return NextResponse.json({ files });
        } catch (fallbackError) {
          console.error("Fallback file listing error:", fallbackError);
          return NextResponse.json({ files: [] });
        }
      }
    }
  } catch (error) {
    console.error("Media listing error:", error);
    return NextResponse.json(
      { error: "Failed to list media files" },
      { status: 500 }
    );
  }
} 