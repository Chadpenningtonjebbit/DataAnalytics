"use client";

import { useState, useEffect } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { generateScreenHtml, generateScreenCss } from '@/lib/utils';

interface PreviewPageProps {
  params: {
    quizId: string;
  };
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const { quizId } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Get functions from store
  const loadQuiz = useQuizStore((state) => state.loadQuiz);
  const quiz = useQuizStore((state) => state.quiz);
  
  // Analytics store functions
  const startSession = useAnalyticsStore((state) => state.startSession);
  const recordScreenView = useAnalyticsStore((state) => state.recordScreenView);
  const endSession = useAnalyticsStore((state) => state.endSession);
  
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        console.log(`Loading quiz with ID: ${quizId} for preview`);
        
        // Use the store's loadQuiz function
        const success = await loadQuiz(quizId);
        
        if (!success) {
          console.error(`Failed to load quiz with ID: ${quizId}`);
          setError("Quiz not found");
          return;
        }
        
        // Get the updated quiz from store after loading
        const updatedQuiz = useQuizStore.getState().quiz;
        
        // Start analytics session with user agent
        if (typeof window !== 'undefined') {
          // Create a session with the quizId and user agent
          const session = startSession(updatedQuiz.id, navigator.userAgent);
          setSessionId(session.id);
          setStartTime(Date.now());
        }
        
        // Always start on the first screen (index 0)
        setCurrentScreenIndex(0);
        
        // Generate HTML and CSS for the first screen
        const firstScreen = updatedQuiz.screens[0];
        if (firstScreen) {
          const generatedHtml = generateScreenHtml(firstScreen);
          const generatedCss = generateScreenCss(firstScreen);
          
          setHtml(generatedHtml);
          setCss(generatedCss);
          
          // We'll record the first screen view after a short delay to get accurate timing
          setTimeout(() => {
            if (sessionId) {
              // Record with a small initial duration since this is the first screen
              recordScreenView(sessionId, firstScreen.id, 1);
            }
          }, 1000);
        } else {
          console.error('No screens found in the quiz');
          setError("Failed to load quiz content");
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading quiz for preview:', error);
        setError("Failed to load quiz");
      }
    };
    
    initializeQuiz();
    
    // Clean up when component unmounts
    return () => {
      if (sessionId) {
        // End the session when leaving the page
        // Completed is true only if we reached the last screen
        const isCompleted = currentScreenIndex === quiz?.screens?.length - 1;
        endSession(sessionId, isCompleted);
      }
    };
  }, [quizId, loadQuiz, startSession]);
  
  // Function to render the current screen
  const renderCurrentScreen = () => {
    if (!quiz || !quiz.screens || quiz.screens.length === 0) {
      console.error('No screens available in the quiz');
      setError("No content to display");
      return;
    }
    
    if (currentScreenIndex < 0 || currentScreenIndex >= quiz.screens.length) {
      console.error(`Invalid screen index: ${currentScreenIndex}`);
      setError("Invalid screen");
      return;
    }
    
    const screen = quiz.screens[currentScreenIndex];
    const generatedHtml = generateScreenHtml(screen);
    const generatedCss = generateScreenCss(screen);
    
    // Calculate time spent on the previous screen
    const now = Date.now();
    const timeSpent = (now - startTime) / 1000; // Convert to seconds
    setStartTime(now); // Reset for next screen
    
    setHtml(generatedHtml);
    setCss(generatedCss);
    
    // Record screen view for analytics
    if (sessionId && timeSpent > 0) {
      recordScreenView(sessionId, screen.id, timeSpent);
    }
  };
  
  // When current screen index changes, update the preview
  useEffect(() => {
    if (!isLoading && !error) {
      renderCurrentScreen();
    }
  }, [currentScreenIndex, isLoading, error]);
  
  // Handle messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'buttonClick') {
        // Navigate to the next screen
        const nextScreenIndex = currentScreenIndex + 1;
        if (nextScreenIndex < quiz.screens.length) {
          setCurrentScreenIndex(nextScreenIndex);
        } else {
          // Don't loop back - stay on the last screen
          console.log('Reached the last screen');
          
          // If we're on the last screen and this is a button click, mark the quiz as completed
          if (sessionId && currentScreenIndex === quiz.screens.length - 1) {
            endSession(sessionId, true);
            // Generate a new session ID to prevent double-counting
            setSessionId(null);
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentScreenIndex, quiz, sessionId, endSession]);
  
  // Handle beforeunload event to record session end
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId) {
        // End the session when leaving the page
        // Completed is true only if we reached the last screen
        const isCompleted = currentScreenIndex === quiz?.screens?.length - 1;
        endSession(sessionId, isCompleted);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId, currentScreenIndex, quiz, endSession]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-xl">Loading preview...</div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl text-destructive mb-4">{error}</div>
        <a 
          href="/dashboard"
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }
  
  // Create the full HTML document for the preview
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quiz Preview</title>
      <!-- Import common web fonts with security attributes -->
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Raleway:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" referrerpolicy="no-referrer">
      <!-- Backup local font declarations in case Google Fonts fails -->
      <style>
        /* Base styles */
        html, body {
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          width: 100%;
          height: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }
        
        /* Ensure all elements use border-box */
        *, *::before, *::after {
          box-sizing: border-box;
        }
        
        /* Fallback font definitions */
        @font-face {
          font-family: 'Roboto';
          font-style: normal;
          font-weight: 400;
          src: local('Roboto'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Open Sans';
          font-style: normal;
          font-weight: 400;
          src: local('Open Sans'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Lato';
          font-style: normal;
          font-weight: 400;
          src: local('Lato'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Montserrat';
          font-style: normal;
          font-weight: 400;
          src: local('Montserrat'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Source Sans Pro';
          font-style: normal;
          font-weight: 400;
          src: local('Source Sans Pro'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Raleway';
          font-style: normal;
          font-weight: 400;
          src: local('Raleway'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 400;
          src: local('Poppins'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
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
          margin: 0;
        }
        
        /* Default section styling */
        .quiz-section-header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .quiz-section-body {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        
        .quiz-section-footer {
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        
        /* Default element styles */
        button {
          padding: 8px 16px;
          border-radius: 4px;
          background-color: #000000;
          color: white;
          border: none;
          font-size: 16px;
          cursor: pointer;
          display: inline-block;
          line-height: normal;
          box-sizing: border-box;
          font-family: inherit;
          text-align: center;
          max-width: 100%;
        }
        
        p {
          margin: 0;
          font-size: 16px;
          line-height: 1.5;
          color: #000000;
          font-family: inherit;
          max-width: 100%;
        }
        
        img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        a {
          color: #355DF9;
          text-decoration: underline;
          font-size: 16px;
          cursor: pointer;
          display: inline-block;
          font-family: inherit;
          text-align: center;
          max-width: 100%;
        }
        
        .element-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px;
          box-sizing: border-box;
          width: 100%;
          font-family: inherit;
          max-width: 100%;
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
        
        /* Typography overrides to ensure styles are applied */
        body * {
          line-height: 1.5;
        }
        
        /* !important rules for typography - ensure they always apply */
        [style*="font-family"] { font-family: attr(style font-family) !important; }
        [style*="font-size"] { font-size: attr(style font-size) !important; }
        [style*="font-weight"] { font-weight: attr(style font-weight) !important; }
        [style*="color"] { color: attr(style color) !important; }
        [style*="text-align"] { text-align: attr(style text-align) !important; }
        
        /* Custom CSS */
        ${css}
      </style>
      <script>
        // Add click event listeners to all buttons
        document.addEventListener('DOMContentLoaded', function() {
          const buttons = document.querySelectorAll('button');
          buttons.forEach(button => {
            button.addEventListener('click', function() {
              // Send message to parent frame
              window.parent.postMessage({ type: 'buttonClick' }, '*');
            });
          });
          
          // Handle clicks on links
          const links = document.querySelectorAll('a');
          links.forEach(link => {
            link.addEventListener('click', function(e) {
              // First, notify parent for navigation between screens
              window.parent.postMessage({ type: 'buttonClick' }, '*');
              
              // Check if this is a link element (rather than a navigation element)
              if (link.hasAttribute('data-link-element')) {
                // Get the target and href attributes
                const target = link.getAttribute('target');
                const href = link.getAttribute('href');
                
                // If it's a link element with a real URL, allow the navigation to happen
                // but in a deferred way to allow screen transition first
                if (href && href !== '#') {
                  e.preventDefault(); // Prevent immediate navigation
                  
                  // Wait a brief moment to allow screen transition
                  setTimeout(() => {
                    if (target === '_blank') {
                      // Open in new window
                      window.open(href, '_blank');
                    } else if (target === '_self') {
                      // Open in current window (this will break out of the iframe)
                      window.parent.location.href = href;
                    }
                  }, 300); // Short delay for screen transition
                } else {
                  e.preventDefault(); // Prevent navigation for # links
                }
              } else {
                e.preventDefault(); // Prevent navigation for normal quiz navigation links
              }
            });
          });
          
          // Debug typography styles - log to console what styles are applied
          console.log('Debugging typography styles:');
          const textElements = document.querySelectorAll('p, button, a, h1, h2, h3, h4, h5, h6');
          textElements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            console.log(el.tagName, el.id, {
              'font-family': computedStyle.fontFamily,
              'font-size': computedStyle.fontSize,
              'font-weight': computedStyle.fontWeight,
              'color': computedStyle.color,
              'text-align': computedStyle.textAlign,
              'inline-style': el.getAttribute('style')
            });
          });
        });
      </script>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
  
  // Add a screen indicator
  const screenIndicator = (
    <div 
      className="fixed bottom-4 right-4 px-4 py-2 bg-primary/80 text-primary-foreground rounded font-mono text-sm"
    >
      Screen {currentScreenIndex + 1} / {quiz?.screens?.length || 0}
    </div>
  );
  
  return (
    <>
      <iframe 
        srcDoc={fullHtml}
        className="w-full h-screen border-0"
        title="Quiz Preview"
        sandbox="allow-scripts allow-same-origin allow-popups allow-top-navigation allow-forms"
        referrerPolicy="no-referrer"
      />
      {!isLoading && !error && screenIndicator}
    </>
  );
} 