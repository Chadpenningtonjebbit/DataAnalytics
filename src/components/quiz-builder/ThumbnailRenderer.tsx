"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { QuizScreen } from '@/types';
import html2canvas from 'html2canvas';
import { generateScreenHtml, generateScreenCss } from '@/lib/utils';

interface ThumbnailRendererProps {
  screen: QuizScreen;
  onRender: (dataUrl: string) => void;
}

export function ThumbnailRenderer({ screen, onRender }: ThumbnailRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const screenIdRef = useRef(screen.id);
  
  // Memoized function to generate thumbnail
  const generateThumbnail = useCallback(async () => {
    if (isRendering || !iframeRef.current || hasRendered) return;
    setIsRendering(true);
    
    try {
      // Get the latest HTML and CSS for the screen - CSS already has variables replaced
      const html = generateScreenHtml(screen);
      const css = generateScreenCss(screen);
      
      // Create a complete HTML document
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            /* Base styles */
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              overflow: hidden;
              width: 600px;
              height: 400px;
              background-color: white;
              box-sizing: border-box;
            }
            
            /* Ensure all elements use border-box */
            *, *::before, *::after {
              box-sizing: border-box;
            }
            
            /* Base styles for quiz */
            .quiz-screen {
              display: flex;
              flex-direction: column;
              height: 100%;
              width: 100%;
              overflow: hidden;
            }
            
            /* Base styles for sections */
            .quiz-section {
              position: relative;
              box-sizing: border-box;
              display: flex;
            }
            
            /* Global text alignment for all elements */
            p, h1, h2, h3, h4, h5, h6, button, a, label, span, div, input, select, textarea {
              text-align: center;
            }
            
            /* Default section styling */
            .quiz-section-header {
              background-color: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .quiz-section-body {
              flex: 1;
            }
            
            .quiz-section-footer {
              background-color: #f8fafc;
              border-top: 1px solid #e2e8f0;
            }
            
            /* Default element styles - these provide base styling for all element types */
            
            /* Buttons */
            button {
              padding: 8px 16px;
              border-radius: 4px;
              background-color: #000000;
              color: white;
              border: none;
              font-family: Arial, sans-serif;
              font-size: 16px;
              font-weight: 400;
              cursor: pointer;
              display: inline-block;
              text-align: center;
              line-height: normal;
              box-sizing: border-box;
              max-width: 100%;
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
            }
            
            /* Text elements */
            p {
              margin: 0;
              font-family: Arial, sans-serif;
              font-size: 16px;
              line-height: 1.5;
              color: #000000;
              text-align: center;
              max-width: 100%;
            }
            
            /* Images */
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0 auto; /* Center images */
            }
            
            /* Links */
            a {
              color: #355DF9;
              text-decoration: underline;
              font-family: Arial, sans-serif;
              font-size: 16px;
              cursor: pointer;
              text-align: center;
              display: inline-block;
              width: 100%;
              max-width: 100%;
            }
            
            /* Groups */
            .element-group {
              display: flex;
              flex-direction: column;
              gap: 8px;
              padding: 8px;
              box-sizing: border-box;
              width: 100%; /* Ensure groups take full width by default */
              text-align: center;
              max-width: 100%;
            }
            
            /* Better gap support - use gap attribute from data attributes if present */
            [data-gap] {
              gap: attr(data-gap);
            }
            
            /* Make sure gap works in all browsers */
            [data-direction="row"] > * {
              margin-right: 0;
              margin-bottom: 0;
            }
            
            [data-direction="column"] > * {
              margin-bottom: 0;
              margin-right: 0;
            }
            
            /* Ensure all flex children behave consistently */
            .quiz-section > *, .element-group > * {
              box-sizing: border-box;
              flex-shrink: 0;
            }
            
            /* Input fields */
            input[type="text"], 
            input[type="email"],
            input[type="password"],
            input[type="number"] {
              padding: 8px 12px;
              border-radius: 4px;
              border: 1px solid #ccc;
              font-family: Arial, sans-serif;
              font-size: 16px;
              box-sizing: border-box;
              text-align: center;
            }
            
            /* Checkbox and radio styling */
            input[type="checkbox"],
            input[type="radio"] {
              margin-right: 8px;
              vertical-align: middle;
            }
            
            /* Checkbox and radio container divs */
            div:has(> input[type="checkbox"]),
            div:has(> input[type="radio"]) {
              text-align: center;
            }
            
            /* Textarea styling */
            textarea {
              padding: 8px 12px;
              border-radius: 4px;
              border: 1px solid #ccc;
              font-family: Arial, sans-serif;
              font-size: 16px;
              min-height: 80px;
              box-sizing: border-box;
              text-align: center;
            }
            
            /* Select styling */
            select {
              padding: 8px 12px;
              border-radius: 4px;
              border: 1px solid #ccc;
              font-family: Arial, sans-serif;
              font-size: 16px;
              background-color: white;
              box-sizing: border-box;
              text-align: center;
            }
            
            /* Apply layout attributes */
            [data-direction="row"] { flex-direction: row; }
            [data-direction="column"] { flex-direction: column; }
            [data-direction="row-reverse"] { flex-direction: row-reverse; }
            [data-direction="column-reverse"] { flex-direction: column-reverse; }
            
            [data-wrap="nowrap"] { flex-wrap: nowrap; }
            [data-wrap="wrap"] { flex-wrap: wrap; }
            [data-wrap="wrap-reverse"] { flex-wrap: wrap-reverse; }
            
            [data-justify="flex-start"] { justify-content: flex-start; }
            [data-justify="flex-end"] { justify-content: flex-end; }
            [data-justify="center"] { justify-content: center; }
            [data-justify="space-between"] { justify-content: space-between; }
            [data-justify="space-around"] { justify-content: space-around; }
            [data-justify="space-evenly"] { justify-content: space-evenly; }
            
            [data-align-items="flex-start"] { align-items: flex-start; }
            [data-align-items="flex-end"] { align-items: flex-end; }
            [data-align-items="center"] { align-items: center; }
            [data-align-items="stretch"] { align-items: stretch; }
            [data-align-items="baseline"] { align-items: baseline; }
            
            [data-align-content="flex-start"] { align-content: flex-start; }
            [data-align-content="flex-end"] { align-content: flex-end; }
            [data-align-content="center"] { align-content: center; }
            [data-align-content="stretch"] { align-content: stretch; }
            [data-align-content="space-between"] { align-content: space-between; }
            [data-align-content="space-around"] { align-content: space-around; }
            
            /* Custom generated CSS with element-specific styles */
            ${css}
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;
      
      // Set the content in the iframe
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument;
      
      if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();
        
        // Wait for the content to load and check that styles are applied
        setTimeout(async () => {
          try {
            if (!doc.body || !doc.defaultView) {
              throw new Error("Document is not attached to a Window");
            }
            
            // Generate the thumbnail using html2canvas
            const canvas = await html2canvas(doc.body, {
              width: 600,
              height: 400,
              scale: 0.2, // Scale down for thumbnails
              backgroundColor: null,
              logging: false,
              allowTaint: true,
              useCORS: true
            });
            
            const dataUrl = canvas.toDataURL('image/png');
            onRender(dataUrl);
            setHasRendered(true);
          } catch (err) {
            console.error('Error generating thumbnail:', err);
          } finally {
            setIsRendering(false);
          }
        }, 200); // Give it more time to render all styles
      }
    } catch (err) {
      console.error('Error preparing thumbnail:', err);
      setIsRendering(false);
    }
  }, [screen, onRender, isRendering, hasRendered]);
  
  // Check if screen content changed and force re-render
  useEffect(() => {
    // For more complex screens with nested groups, create a deeper hash
    // that includes all nested children
    const getElementsHash = (elements: any[]): string => {
      return JSON.stringify(elements.map(el => {
        if (el.isGroup && el.children) {
          return {
            id: el.id,
            type: el.type,
            styles: el.styles,
            children: getElementsHash(el.children)
          };
        }
        return { id: el.id, type: el.type, styles: el.styles };
      }));
    };
    
    // Create a hash of the screen contents to detect changes
    const screenHash = JSON.stringify({
      header: getElementsHash(screen.sections.header.elements),
      body: getElementsHash(screen.sections.body.elements),
      footer: getElementsHash(screen.sections.footer.elements)
    });
    
    // Reset hasRendered when screen content changes
    setHasRendered(false);
  }, [
    screen.sections.header.elements,
    screen.sections.body.elements, 
    screen.sections.footer.elements
  ]);
  
  // Check if screen ID changed
  useEffect(() => {
    if (screen.id !== screenIdRef.current) {
      screenIdRef.current = screen.id;
      setHasRendered(false);
    }
  }, [screen.id]);
  
  // Generate the thumbnail when the component mounts or screen changes
  useEffect(() => {
    if (!hasRendered) {
      generateThumbnail();
    }
  }, [generateThumbnail, hasRendered]);
  
  return (
    <iframe 
      ref={iframeRef}
      className="sr-only" // Hide it but keep it in the DOM
      title="thumbnail-renderer"
      sandbox="allow-same-origin"
      width="600"
      height="400"
    />
  );
} 