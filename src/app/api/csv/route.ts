import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';
import { parse } from 'papaparse';
import { promises as fsPromises } from 'fs';

// Determine if we're running locally or in production
const isLocal = process.env.NODE_ENV === 'development';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Simple in-memory cache to avoid reprocessing the same files
const CSV_CACHE = new Map();
const CACHE_MAX_SIZE = 10; // Maximum number of files to keep in cache
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to process CSV content with optimization
async function processCSVContent(fileContent: string, fileUrl: string) {
  // Check if we already have this in cache
  const cacheKey = `${fileUrl}-${fileContent.length}`;
  if (CSV_CACHE.has(cacheKey)) {
    const cachedResult = CSV_CACHE.get(cacheKey);
    // Check if cache entry is still valid
    if (Date.now() - cachedResult.timestamp < CACHE_TTL) {
      console.log('CSV cache hit for:', fileUrl);
      return cachedResult.data;
    } else {
      // Remove expired entry
      CSV_CACHE.delete(cacheKey);
    }
  }
  
  console.log('Processing CSV content, length:', fileContent.length);
  
  // Check for BOM and remove if present
  const contentWithoutBOM = fileContent.replace(/^\uFEFF/, '');
  
  // Parse CSV content with optimized options
  const result = parse(contentWithoutBOM, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    delimiter: autoDetectDelimiter(contentWithoutBOM), // Auto-detect delimiter
    fastMode: true // Use fast mode when possible for better performance
  });
  
  console.log('CSV parsed successfully:', {
    rowCount: result.data.length,
    fields: result.meta.fields,
    errors: result.errors.length > 0 ? result.errors : 'No errors'
  });
  
  if (result.errors.length > 0) {
    console.warn('CSV parsing had errors:', result.errors);
  }
  
  // Process data in chunks to avoid blocking the event loop
  const processedData = await processDataInChunks(result.data);
  
  const resultData = {
    data: processedData.slice(0, 100), // Limit to first 100 rows for performance
    fields: result.meta.fields || [],
    rowCount: processedData.length,
    preview: true
  };
  
  // Store in cache
  if (CSV_CACHE.size >= CACHE_MAX_SIZE) {
    // Remove oldest entry
    const oldestKey = CSV_CACHE.keys().next().value;
    CSV_CACHE.delete(oldestKey);
  }
  
  CSV_CACHE.set(cacheKey, {
    data: resultData,
    timestamp: Date.now()
  });
  
  return resultData;
}

// Auto-detect the delimiter used in the CSV
function autoDetectDelimiter(content: string): string {
  // Check first line
  const firstLine = content.split('\n')[0];
  
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  
  if (tabs > commas && tabs > semicolons) return '\t';
  if (semicolons > commas) return ';';
  return ','; // Default to comma
}

// Process data in chunks to avoid blocking the event loop
async function processDataInChunks(data: any[]): Promise<any[]> {
  const CHUNK_SIZE = 500;
  const processedData: any[] = [];
  
  const processChunk = (chunk: any[]) => {
    return chunk.map((item) => {
      const processedItem = { ...item };
      
      // Ensure all values are trimmed and correctly typed
      Object.keys(processedItem).forEach(key => {
        if (typeof processedItem[key] === 'string') {
          processedItem[key] = processedItem[key].trim();
        }
      });
      
      return processedItem;
    });
  };
  
  // Process in chunks
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    // Use setTimeout to allow the event loop to run
    await new Promise(resolve => setTimeout(resolve, 0));
    processedData.push(...processChunk(chunk));
  }
  
  return processedData;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    console.log('CSV API called with URL:', fileUrl);

    if (!fileUrl) {
      console.error('CSV API called without a URL parameter');
      return NextResponse.json(
        { error: "Missing file URL" },
        { status: 400 }
      );
    }

    let csvContent;

    if (isLocal) {
      // Handle local file
      if (fileUrl.startsWith('/uploads/')) {
        try {
          // Extract the actual file path without cache busting params
          const cleanFileUrl = fileUrl.split('?')[0];
          console.log('Clean file URL (without params):', cleanFileUrl);
          
          // Convert URL to filesystem path
          const filePath = path.join(process.cwd(), 'public', cleanFileUrl);
          console.log('Reading local CSV file from:', filePath);

          // Check if file exists
          const fileExists = fs.existsSync(filePath);
          console.log('File exists:', fileExists);
          
          if (!fileExists) {
            return NextResponse.json(
              { error: "CSV file not found", details: `File ${cleanFileUrl} does not exist` },
              { status: 404 }
            );
          }

          // Read the file
          const fileContent = await fsPromises.readFile(filePath, 'utf-8');
          console.log('CSV file read, processing...');
          
          // Process the CSV content
          csvContent = await processCSVContent(fileContent, cleanFileUrl);
        } catch (err: any) {
          console.error('Error reading or parsing CSV file:', err);
          return NextResponse.json(
            { error: "Failed to read CSV file", details: err.message, stack: err.stack },
            { status: 500 }
          );
        }
      } else {
        console.error('Invalid file URL format:', fileUrl);
        return NextResponse.json(
          { error: "Invalid file URL", details: "URL must start with /uploads/" },
          { status: 400 }
        );
      }
    } else {
      // Handle production file (from Vercel Blob)
      try {
        console.log('Fetching remote CSV file from:', fileUrl);
        // Fetch the file content from the URL
        const response = await fetch(fileUrl);
        if (!response.ok) {
          console.error('Failed to fetch CSV file:', response.statusText);
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const fileContent = await response.text();
        console.log('CSV file downloaded, processing...');
        
        // Process the CSV content
        csvContent = await processCSVContent(fileContent, fileUrl);
      } catch (err: any) {
        console.error('Error fetching or parsing CSV file:', err);
        return NextResponse.json(
          { error: "Failed to read CSV file", details: err.message, stack: err.stack },
          { status: 500 }
        );
      }
    }

    console.log('Returning CSV data, sample product:', csvContent.data.length > 0 ? JSON.stringify(csvContent.data[0]) : 'No products');
    return NextResponse.json(csvContent);
  } catch (error: any) {
    console.error("CSV processing error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV file", details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
} 