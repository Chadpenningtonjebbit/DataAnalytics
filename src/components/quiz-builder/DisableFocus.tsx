"use client";

import { useEffect } from 'react';

export function DisableFocus() {
  useEffect(() => {
    // Function to add tabIndex=-1 to all focusable elements in the builder
    const disableFocus = () => {
      const builderElements = document.querySelectorAll('.element-renderer, .element-renderer *');
      
      builderElements.forEach(element => {
        if (element instanceof HTMLElement) {
          // Add tabIndex=-1 to make it not focusable via tab
          element.setAttribute('tabindex', '-1');
          
          // Prevent focus when clicked
          const originalOnClick = element.onclick;
          element.onclick = (e) => {
            e.preventDefault();
            if (originalOnClick) {
              originalOnClick.call(element, e);
            }
          };
        }
      });
    };
    
    // Run initially
    disableFocus();
    
    // Set up a MutationObserver to handle dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          disableFocus();
        }
      });
    });
    
    // Start observing the document
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return null;
} 