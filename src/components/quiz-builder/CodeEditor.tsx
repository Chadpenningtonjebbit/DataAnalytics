"use client";

import React, { useEffect, useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useQuizStore } from '@/store/useQuizStore';
import { generateScreenHtml, generateScreenCss, parseHtml, parseCss } from '@/lib/utils';
import { SectionType } from '@/types';
import { debounce } from 'lodash';
import { cn } from '@/lib/utils';

type EditorTab = 'html' | 'css';

export function CodeEditor() {
  const [activeTab, setActiveTab] = useState<EditorTab>('html');
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const { quiz, updateCodeView, updateElement } = useQuizStore();
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  const editorRef = useRef<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (currentScreen && !isEditing) {
      setHtmlCode(generateScreenHtml(currentScreen));
      setCssCode(generateScreenCss(currentScreen));
    }
  }, [currentScreen, isEditing]);

  // Create a debounced version of applyChanges
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedApplyChanges = useRef(
    debounce((html: string, css: string) => {
      applyChanges(html, css);
    }, 1000)
  ).current;

  const handleEditorChange = (value: string | undefined) => {
    setIsEditing(true);
    
    if (activeTab === 'html') {
      setHtmlCode(value || '');
      debouncedApplyChanges(value || '', cssCode);
    } else {
      setCssCode(value || '');
      debouncedApplyChanges(htmlCode, value || '');
    }
  };

  const applyChanges = (html: string, css: string) => {
    // Update the code view in the store
    updateCodeView(html, css);
    
    // Parse the HTML and CSS to update the elements
    const { elements } = parseHtml(html);
    const updatedElements = parseCss(css, elements);
    
    // Update each element in the store
    updatedElements.forEach(element => {
      // Find the element in any section
      const sections = Object.keys(currentScreen.sections) as SectionType[];
      
      for (const sectionId of sections) {
        const section = currentScreen.sections[sectionId];
        const existingElement = section.elements.find(el => el.id === element.id);
        
        if (existingElement) {
          updateElement(element.id, {
            content: element.content,
            styles: element.styles,
            attributes: element.attributes,
          });
          break;
        }
      }
    });
    
    // Reset editing state after changes are applied
    setIsEditing(false);
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    monaco.editor.defineTheme('customTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e2e',
      }
    });
    
    monaco.editor.setTheme('customTheme');
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={activeTab === 'html' ? 'html' : 'css'}
          value={activeTab === 'html' ? htmlCode : cssCode}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
      
      {/* Tabs at the bottom */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
        <div className="flex space-x-1 bg-background/80 backdrop-blur-sm p-1 rounded-full shadow-md border border-border">
          <button
            onClick={() => setActiveTab('html')}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-full transition-colors",
              activeTab === 'html' 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted/80 text-muted-foreground"
            )}
          >
            HTML
          </button>
          <button
            onClick={() => setActiveTab('css')}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-full transition-colors",
              activeTab === 'css' 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted/80 text-muted-foreground"
            )}
          >
            CSS
          </button>
        </div>
      </div>
    </div>
  );
} 