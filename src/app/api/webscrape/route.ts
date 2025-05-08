import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: "URL is required", errorType: "missing_url" },
        { status: 400 }
      );
    }
    
    // Validate the URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL format", errorType: "invalid_url" },
        { status: 400 }
      );
    }
    
    console.log(`[WebScrape] Attempting to fetch: ${url}`);
    
    // Set timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      // Enhanced headers to better mimic a real browser
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      };
      
      console.log(`[WebScrape] Using headers:`, headers);
      
      // Fetch the website content with more browser-like headers
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow', // Explicitly follow redirects
      });
      
      clearTimeout(timeoutId);
      console.log(`[WebScrape] Response status: ${response.status} ${response.statusText}`);
      console.log(`[WebScrape] Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = `Server responded with status: ${response.status}`;
        let errorType = "http_error";
        
        // More specific error messaging based on status codes
        if (response.status === 403) {
          errorMessage = "Access forbidden - website is blocking our request";
          errorType = "access_forbidden";
        } else if (response.status === 404) {
          errorMessage = "Page not found on this website";
          errorType = "not_found";
        } else if (response.status === 429) {
          errorMessage = "Too many requests - website is rate limiting";
          errorType = "rate_limited";
        } else if (response.status >= 500) {
          errorMessage = "Website server error";
          errorType = "server_error";
        }
        
        return NextResponse.json({ 
          error: errorMessage,
          errorType: errorType,
          status: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries())
        }, { status: response.status });
      }
      
      const contentType = response.headers.get('content-type');
      console.log(`[WebScrape] Content-Type: ${contentType}`);
      
      if (!contentType || !contentType.includes('text/html')) {
        return NextResponse.json({ 
          error: `Not an HTML page (content-type: ${contentType || 'unknown'})`,
          errorType: "not_html",
          responseHeaders: Object.fromEntries(response.headers.entries())
        }, { status: 415 });
      }
      
      const html = await response.text();
      console.log(`[WebScrape] Received HTML length: ${html.length} bytes`);
      
      // Check if we actually got HTML content
      if (!html || html.trim().length < 50) {
        return NextResponse.json({
          error: "Received empty or invalid HTML response",
          errorType: "empty_response"
        }, { status: 422 });
      }
      
      // Check if we got a bot protection page instead of actual content
      if (html.includes('captcha') || 
          html.includes('security check') || 
          html.includes('bot protection') || 
          html.includes('cloudflare') || 
          html.includes('ddos')) {
        console.log(`[WebScrape] Bot protection detected`);
        return NextResponse.json({
          error: "Website has bot protection - we're being blocked",
          errorType: "bot_protection"
        }, { status: 403 });
      }
      
      return NextResponse.json({ html });
    } catch (error: any) { // Type assertion to any to allow property access
      clearTimeout(timeoutId);
      
      console.log(`[WebScrape] Fetch error: ${error.name} - ${error.message}`);
      
      if (error.name === 'AbortError') {
        return NextResponse.json({ 
          error: "Request timeout - site took too long to respond",
          errorType: "timeout"
        }, { status: 408 });
      }
      
      throw error;
    }
  } catch (error: any) { // Type assertion to any to access message property
    console.error('[WebScrape] Error details:', error);
    
    // Determine the type of error
    let errorMessage = "Failed to scrape website";
    let errorType = "unknown_error";
    
    if (error.message) {
      // Network-related errors
      if (error.message.includes('ENOTFOUND')) {
        errorMessage = "Domain not found - please check the URL";
        errorType = "domain_not_found";
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = "Connection refused by the server";
        errorType = "connection_refused";
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = "Connection timed out";
        errorType = "connection_timeout";
      } else if (error.message.includes('certificate')) {
        errorMessage = "SSL/TLS certificate error";
        errorType = "ssl_error";
      } else {
        errorMessage = `Failed to scrape website: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, errorType: errorType },
      { status: 500 }
    );
  }
} 