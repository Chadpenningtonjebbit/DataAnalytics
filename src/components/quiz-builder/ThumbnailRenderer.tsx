"use client";

import React, { useEffect, useRef, useState } from 'react';
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
  
  // Generate the thumbnail when the component mounts or screen changes
  useEffect(() => {
    const generateThumbnail = async () => {
      if (isRendering || !iframeRef.current) return;
      setIsRendering(true);
      
      try {
        // Get the latest HTML and CSS for the screen - CSS already has variables replaced
        const html = generateScreenHtml(screen);
        const css = generateScreenCss(screen);
        
        // Debug: Log the generated CSS to see what styles are being created
        console.log('Generated CSS for thumbnail:', css);
        
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
                background-color: #355DF9;
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
              }
              
              /* Text elements */
              p {
                margin: 0;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.5;
                color: #000000;
              }
              
              /* Images */
              img {
                max-width: 100%;
                height: auto;
                display: block;
              }
              
              /* Links */
              a {
                color: #355DF9;
                text-decoration: underline;
                font-family: Arial, sans-serif;
                font-size: 16px;
                cursor: pointer;
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
              // Debug: Check styles for various element types
              if (doc.body) {
                // Log section styles
                const sections = doc.body.querySelectorAll('.quiz-section');
                if (sections.length > 0) {
                  console.log('Section styles in iframe:', 
                    Array.from(sections).map(section => {
                      const computedStyle = getComputedStyle(section);
                      return {
                        id: section.id,
                        backgroundColor: computedStyle.backgroundColor,
                        padding: computedStyle.padding,
                        border: computedStyle.border,
                        flexDirection: computedStyle.flexDirection,
                        justifyContent: computedStyle.justifyContent,
                        alignItems: computedStyle.alignItems,
                        gap: computedStyle.gap
                      };
                    })
                  );
                }
                
                // Log button styles
                const buttons = doc.body.querySelectorAll('button');
                if (buttons.length > 0) {
                  console.log('Button styles in iframe:', 
                    Array.from(buttons).map(button => {
                      const computedStyle = getComputedStyle(button);
                      return {
                        id: button.id,
                        width: computedStyle.width,
                        height: computedStyle.height,
                        backgroundColor: computedStyle.backgroundColor
                      };
                    })
                  );
                }
                
                // Log text element styles
                const textElements = doc.body.querySelectorAll('p');
                if (textElements.length > 0) {
                  console.log('Text element styles:', 
                    Array.from(textElements).map(el => {
                      const computedStyle = getComputedStyle(el);
                      return {
                        id: el.id,
                        fontSize: computedStyle.fontSize,
                        color: computedStyle.color
                      };
                    })
                  );
                }
                
                // Log image styles
                const images = doc.body.querySelectorAll('img');
                if (images.length > 0) {
                  console.log('Image styles:', 
                    Array.from(images).map(img => {
                      const computedStyle = getComputedStyle(img);
                      return {
                        id: img.id,
                        width: computedStyle.width,
                        height: computedStyle.height
                      };
                    })
                  );
                }
                
                // Log link styles
                const links = doc.body.querySelectorAll('a');
                if (links.length > 0) {
                  console.log('Link styles:', 
                    Array.from(links).map(link => {
                      const computedStyle = getComputedStyle(link);
                      return {
                        id: link.id,
                        color: computedStyle.color,
                        textDecoration: computedStyle.textDecoration
                      };
                    })
                  );
                }
              }
              
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
    };
    
    generateThumbnail();
  }, [screen, onRender, isRendering]);
  
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