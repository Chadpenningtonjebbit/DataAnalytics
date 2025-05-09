"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';

// Define the mention option interface
export interface MentionOption {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface MentionInputProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  options: MentionOption[];
  className?: string;
  menuClassName?: string;
  optionClassName?: string;
  selectedOptionClassName?: string;
  triggerChar?: string;
  placeholder?: string;
  minHeight?: string;
}

export function MentionInput({
  value,
  onChange,
  options,
  className = "",
  menuClassName = "",
  optionClassName = "",
  selectedOptionClassName = "bg-accent text-accent-foreground",
  triggerChar = '@',
  placeholder = "Type content...",
  minHeight = "150px",
  ...props
}: MentionInputProps) {
  // State
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    
    return options.filter(option => 
      option.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Reset selected index when filtered options change
  useEffect(() => {
    if (filteredOptions.length > 0) {
      setSelectedIndex(0); // Auto-focus the first item
    }
  }, [filteredOptions]);

  // Handle keyboard navigation in mention menu
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    
    // Handle arrow navigation when menu is open
    if (showMenu && filteredOptions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      } else if (e.key === 'Enter' && filteredOptions[selectedIndex]) {
        e.preventDefault();
        handleMentionSelect(filteredOptions[selectedIndex]);
      }
    }
    
    // Check if user typed the trigger character
    if (e.key === triggerChar) {
      console.log(`${triggerChar} key pressed - showing mention menu`);
      
      // Set a fixed position for the menu, relative to the textarea
      setMenuPosition({
        top: 30, // Position below the cursor
        left: 10 // Slight indent from left edge
      });
      
      setCursorPosition(textarea.selectionStart + 1); // +1 to account for the trigger character
      setSearchQuery(''); // Reset search query
      setSelectedIndex(0); // Auto-focus the first item
      setShowMenu(true);
    }
    
    // Hide mention menu on escape
    if (e.key === 'Escape') {
      setShowMenu(false);
    }
  };

  // Handle text input for detecting trigger character and search queries
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const textValue = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    // Update the value
    onChange(textValue);
    
    // Check if the character just typed is the trigger
    if (cursorPos > 0 && textValue[cursorPos - 1] === triggerChar) {
      console.log(`${triggerChar} character detected through input event`);
      
      // Position the menu
      setMenuPosition({
        top: 30,
        left: 10
      });
      
      setCursorPosition(cursorPos);
      setSearchQuery(''); // Reset search query
      setSelectedIndex(0); // Auto-focus the first item
      setShowMenu(true);
    }
    
    // Check if we're in the middle of a mention (menu is showing)
    if (showMenu) {
      // Find the trigger position before the cursor
      let triggerPos = -1;
      for (let i = cursorPos - 1; i >= 0; i--) {
        if (textValue[i] === triggerChar) {
          triggerPos = i;
          break;
        }
        
        // If we encounter a space before finding trigger, then we're not in a mention
        if (textValue[i] === ' ') {
          break;
        }
      }
      
      // If we found a trigger character before the cursor
      if (triggerPos !== -1) {
        // Extract the search query (text between trigger and cursor)
        const query = textValue.substring(triggerPos + 1, cursorPos);
        console.log('Search query:', query);
        setSearchQuery(query);
        
        // Update cursor position
        setCursorPosition(cursorPos);
        
        // If the query doesn't match any options, hide the menu
        if (query && !options.some(opt => 
          opt.id.toLowerCase().includes(query.toLowerCase()) || 
          opt.label.toLowerCase().includes(query.toLowerCase()))
        ) {
          setShowMenu(false);
        } else if (!showMenu) {
          // Show the menu if it's not already showing
          setShowMenu(true);
        }
      } else {
        // If no trigger found, hide the menu
        setShowMenu(false);
      }
    }
  };

  // Handle mention option selection
  const handleMentionSelect = (option: MentionOption) => {
    if (!textareaRef.current) return;
    
    console.log('Mention selected:', option.value);
    
    const textarea = textareaRef.current;
    const textValue = textarea.value;
    
    // Find the trigger position that triggered the menu
    let triggerPos = -1;
    const cursorPos = textarea.selectionStart;
    
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (textValue[i] === triggerChar) {
        triggerPos = i;
        break;
      }
      
      // If we encounter a space before finding trigger, then we're not in a mention
      if (textValue[i] === ' ') {
        break;
      }
    }
    
    if (triggerPos === -1) return; // Safety check
    
    // Everything before the trigger character
    const beforeTrigger = textValue.substring(0, triggerPos);
    // Everything after the search query
    const afterQuery = textValue.substring(cursorPos);
    
    // Insert the selected option value (which already includes the trigger)
    const newValue = beforeTrigger + option.value + ' ' + afterQuery;
    
    // Update the value
    onChange(newValue);
    
    // Hide the menu
    setShowMenu(false);
    
    // Focus the textarea and set cursor position after the inserted mention
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = beforeTrigger.length + option.value.length + 1; // +1 for the space
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Click outside to close menu
  useEffect(() => {
    if (showMenu) {
      // When menu is shown, add event handler to hide it when clicking outside
      const handleClickOutside = (e: MouseEvent) => {
        // Don't close if clicking inside the menu itself
        const menu = document.querySelector('.mention-menu');
        if (menu && menu.contains(e.target as Node)) {
          return;
        }

        if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
          setShowMenu(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  return (
    <div className="relative">
      <Textarea 
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`resize-y ${className}`}
        style={{ minHeight }}
        {...props}
      />
      
      {/* Mention menu - render via portal to prevent clipping */}
      {showMenu && filteredOptions.length > 0 && typeof document !== 'undefined' && createPortal(
        <div 
          className={`fixed rounded-md border border-input bg-popover shadow-md mention-menu ${menuClassName}`}
          style={{
            top: textareaRef.current ? textareaRef.current.getBoundingClientRect().top + menuPosition.top + window.scrollY : 0,
            left: textareaRef.current ? textareaRef.current.getBoundingClientRect().left + menuPosition.left + window.scrollX : 0,
            minWidth: '200px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()} // Stop click from propagating to document
        >
          <div className="py-1">
            {filteredOptions.map((option, index) => (
              <button
                key={option.id}
                className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm ${
                  index === selectedIndex 
                    ? selectedOptionClassName 
                    : `hover:bg-accent hover:text-accent-foreground ${optionClassName}`
                }`}
                onClick={(e) => {
                  e.preventDefault(); // Prevent default button behavior
                  e.stopPropagation(); // Stop propagation to parent elements
                  handleMentionSelect(option);
                }}
                type="button" // Explicitly set type to prevent form submission
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 