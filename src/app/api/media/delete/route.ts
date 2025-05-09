import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import fs from 'fs';
import path from 'path';
import { unlink } from 'fs/promises';

// Determine if we're running locally or in production
const isLocal = process.env.NODE_ENV === 'development';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path') || '';

    if (!filePath) {
      return NextResponse.json(
        { error: "No file path provided" },
        { status: 400 }
      );
    }

    // Split path to get folder and filename
    const pathParts = filePath.split('/');
    if (pathParts.length < 2 || (pathParts[0] !== 'brand-photos' && pathParts[0] !== 'products')) {
      return NextResponse.json(
        { error: "Invalid file path. Must be in 'brand-photos' or 'products' folder" },
        { status: 400 }
      );
    }

    const folder = pathParts[0];
    const fileName = pathParts[1];

    if (isLocal) {
      // Local development: Delete from public directory
      try {
        const filePath = path.join(process.cwd(), `public/uploads/${folder}/${fileName}`);
        
        // Check if file exists before deleting
        if (fs.existsSync(filePath)) {
          await unlink(filePath);
          return NextResponse.json({ success: true, message: "File deleted successfully" });
        } else {
          return NextResponse.json(
            { error: "File not found" },
            { status: 404 }
          );
        }
      } catch (err) {
        console.error('Error deleting local file:', err);
        return NextResponse.json(
          { error: "Failed to delete file" },
          { status: 500 }
        );
      }
    } else {
      // Production: Delete from Vercel Blob
      try {
        console.log(`Deleting blob: ${filePath}`);
        await del(filePath);
        console.log("Blob deleted successfully");
        
        return NextResponse.json({ success: true, message: "File deleted successfully" });
      } catch (blobError) {
        console.error("Error deleting from Vercel Blob:", blobError);
        
        // Fallback to local file deletion if blob deletion fails
        try {
          console.log("Falling back to local file deletion");
          const localFilePath = path.join(process.cwd(), `public/uploads/${folder}/${fileName}`);
          
          if (fs.existsSync(localFilePath)) {
            await unlink(localFilePath);
            return NextResponse.json({ success: true, message: "File deleted from local storage" });
          } else {
            return NextResponse.json(
              { error: "File not found in local storage" },
              { status: 404 }
            );
          }
        } catch (fallbackError) {
          console.error("Fallback deletion error:", fallbackError);
          return NextResponse.json(
            { error: "Failed to delete file" },
            { status: 500 }
          );
        }
      }
    }
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
} 