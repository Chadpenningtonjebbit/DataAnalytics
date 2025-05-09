import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Quiz, QuizElement, QuizScreen, ViewMode, ElementType, SectionType, QuizSection, SectionLayout, FlexDirection, FlexWrap, JustifyContent, AlignItems, AlignContent, ThemeSettings, ThemeItem, ElementStyle, StyleClass } from '@/types';
import { debounce } from 'lodash';
import {
  getDefaultContentForType,
  getDefaultAttributesForType,
  getGroupedElementStyles,
  getDefaultGroupLayout,
  sizeMappings,
  defaultTheme
} from '@/lib/defaultStyles';
import { v4 as uuidv4 } from 'uuid';

// Helper function to safely clone objects avoiding circular references
const safeClone = <T>(obj: T): T => {
  try {
    return structuredClone(obj);
  } catch (error) {
    console.warn('Failed to use structuredClone, falling back to JSON parsing', error);
    return JSON.parse(JSON.stringify(obj));
  }
};

// Default theme settings
const defaultTheme: ThemeSettings = {
  primaryColor: '#000000', // black
  textColor: '#333333', // dark gray
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#ffffff', // White
  cornerRadius: '4px', // Default corner radius
  size: 'small' // Default size
};

// Predefined themes
const predefinedThemes: ThemeItem[] = [
  {
    id: 'theme1',
    name: 'Midnight Classic',
    settings: {
      primaryColor: '#000000', // Black
      textColor: '#333333', // dark gray
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff', // White
      cornerRadius: '4px', // Default corner radius
      size: 'small'
    }
  },
  {
    id: 'theme2',
    name: 'Ocean Breeze',
    settings: {
      primaryColor: '#0ea5e9', // Sky blue
      textColor: '#1e293b', // slate 800
      fontFamily: 'Helvetica, sans-serif',
      backgroundColor: '#f0f9ff', // Light blue bg
      cornerRadius: '8px', // More rounded corners
      size: 'small'
    }
  },
  {
    id: 'theme3',
    name: 'Emerald Forest',
    settings: {
      primaryColor: '#10b981', // Emerald green
      textColor: '#064e3b', // emerald 900
      fontFamily: "'Montserrat', sans-serif",
      backgroundColor: '#ecfdf5', // Light green bg
      cornerRadius: '12px', // Even more rounded corners
      size: 'medium'
    }
  },
  {
    id: 'theme4',
    name: 'Royal Lavender',
    settings: {
      primaryColor: '#8b5cf6', // Purple
      textColor: '#2e1065', // purple 950
      fontFamily: "'Poppins', sans-serif",
      backgroundColor: '#f5f3ff', // Light purple bg
      cornerRadius: '6px', // Medium rounded corners
      size: 'medium'
    }
  },
  {
    id: 'theme5',
    name: 'Fiery Ruby',
    settings: {
      primaryColor: '#ef4444', // Red
      textColor: '#450a0a', // red 950
      fontFamily: "'Roboto', sans-serif",
      backgroundColor: '#fef2f2', // Light red bg
      cornerRadius: '0px', // No rounded corners
      size: 'large'
    }
  }
];

// Default theme item (pointing to the first predefined theme)
const defaultThemeItem: ThemeItem = predefinedThemes[0];

// Define size mappings for different elements
const sizeMappings = {
  fontSize: {
    text: {
      small: '16px',
      medium: '18px',
      large: '22px'
    },
    button: {
      small: '14px',
      medium: '16px',
      large: '18px'
    },
    link: {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
  },
  padding: {
    button: {
      small: '8px 16px',
      medium: '12px 24px',
      large: '16px 32px'
    }
  },
  width: {
    text: {
      small: '200px',
      medium: '400px',
      large: '600px'
    },
    button: {
      small: '200px',
      medium: '400px',
      large: '600px'
    }
  }
};

// Helper function to find and update a group recursively
const findAndUpdateGroup = (group: QuizElement, targetGroupId: string, newElements: QuizElement[]): QuizElement => {
  if (group.id === targetGroupId) {
    // Found the target group, add the new elements to its children
    return {
      ...group,
      children: [...(group.children || []), ...newElements]
    };
  }
  
  // Check if any of the children are groups that might contain the target group
  if (group.children) {
    const updatedChildren = [...group.children];
    let updated = false;
    
    for (let i = 0; i < updatedChildren.length; i++) {
      const child = updatedChildren[i];
      if (child.isGroup) {
        const updatedChild = findAndUpdateGroup(child, targetGroupId, newElements);
        if (updatedChild !== child) {
          updatedChildren[i] = updatedChild;
          updated = true;
        }
      }
    }
    
    if (updated) {
      return {
        ...group,
        children: updatedChildren
      };
    }
  }
  
  return group;
};

// Create a default quiz
const createDefaultQuiz = (name: string = 'New Quiz'): Quiz => {
  const id = uuidv4();
  const initialScreen = {
    id: uuidv4(),
    name: 'Screen 1',
    sections: {
      header: createDefaultSection('header', 'Header', false),
      body: createDefaultSection('body', 'Body', true),
      footer: createDefaultSection('footer', 'Footer', false)
    }
  };

  return {
    id,
    name,
    currentScreenIndex: 0,
    screens: [initialScreen],
    lastEdited: new Date().toISOString(),
    theme: { ...defaultTheme }, // Include default theme settings
    themes: [...predefinedThemes], // Include all predefined themes
    activeThemeId: 'theme1',
    styleClasses: [] // Initialize with empty style classes array
  };
};

// Create default section
const createDefaultSection = (id: SectionType, name: string, enabled: boolean): QuizSection => {
  // Default styles based on section type
  let defaultStyles: Record<string, string> = {
    padding: '16px',
    margin: '0px',
    borderRadius: '0px',
  };
  
  if (id === 'header') {
    defaultStyles = {
      ...defaultStyles,
      backgroundColor: 'transparent',
      border: '0px solid transparent',
    };
  } else if (id === 'footer') {
    defaultStyles = {
      ...defaultStyles,
      backgroundColor: 'transparent',
      border: '0px solid transparent',
    };
  } else {
    defaultStyles = {
      ...defaultStyles,
      backgroundColor: '#ffffff',
      border: 'none',
    };
  }
  
  // Default flexbox layout
  const defaultLayout: SectionLayout = {
    direction: 'column',
    wrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'flex-start',
    gap: '16px',
  };
  
  return {
    id,
    name,
    enabled,
    elements: [],
    styles: defaultStyles,
    layout: defaultLayout,
  };
};

// Type for a list of all quizzes
interface QuizListItem {
  id: string;
  name: string;
  lastEdited: string;
}

interface QuizState {
  // Current active quiz
  quiz: Quiz;
  // List of all available quizzes (summary info only)
  quizList: QuizListItem[];
  selectedElementIds: string[];
  selectedSectionId: SectionType | null;
  viewMode: ViewMode;
  codeView: {
    html: string;
    css: string;
  };
  history: {
    past: Quiz[];
    present: Quiz;
    future: Quiz[];
  };
  clipboard: QuizElement[];
  // Add memory for background colors
  backgroundColors: Record<string, string>;
  
  // Quiz management actions
  createQuiz: (name: string) => void;
  loadQuiz: (id: string) => Promise<boolean>;
  deleteQuiz: (id: string) => void;
  saveCurrentQuiz: () => void;
  setQuiz: (quiz: Quiz) => void;
  renameQuiz: (id: string, newName: string) => boolean;
  duplicateQuiz: (id: string) => Promise<string | null>;
  
  // Theme actions
  updateTheme: (themeSettings: Partial<ThemeSettings>) => void;
  applyThemeToElements: (options?: { elementIds?: string[], resetAll?: boolean }) => void;
  applyThemeToSections: (options?: { sectionIds?: SectionType[] }) => void;
  applyThemeToAllElements: (quizToUpdate?: Quiz) => Quiz;
  switchTheme: (themeId: string) => void;
  restoreBackgroundColor: (screenId: string, elementOrSectionId: string) => void;
  saveBackgroundColor: (screenId: string, elementOrSectionId: string, color: string) => void;
  
  // Style Class actions
  createStyleClass: (name: string, elementType: ElementType, styles: ElementStyle) => string;
  updateStyleClass: (classId: string, updates: Partial<StyleClass>) => void;
  deleteStyleClass: (classId: string) => void;
  applyStyleClass: (elementIds: string[], classId: string) => void;
  removeStyleClass: (elementIds: string[]) => void;
  
  // Screen actions
  addScreen: () => void;
  removeScreen: (screenId: string) => void;
  setCurrentScreen: (index: number) => void;
  renameScreen: (screenId: string, newName: string) => void;
  duplicateScreen: (screenId: string) => void;
  
  // Section actions
  toggleSection: (sectionId: SectionType) => void;
  selectSection: (sectionId: SectionType | null) => void;
  updateSectionStyles: (sectionId: SectionType, styles: Partial<Record<string, string>>) => void;
  updateSectionLayout: (sectionId: SectionType, layout: Partial<SectionLayout>) => void;
  
  // Element actions
  addElement: (type: ElementType, sectionId: SectionType, screenId?: string) => void;
  updateElement: (elementId: string, updates: Partial<QuizElement>) => void;
  removeElement: (elementId: string) => void;
  removeSelectedElements: () => void;
  moveElement: (elementId: string, targetSectionId: SectionType) => void;
  selectElement: (elementId: string | null, isMultiSelect?: boolean) => void;
  copySelectedElements: () => void;
  pasteElements: (targetSectionId?: SectionType, targetGroupId?: string) => void;
  reorderElement: (elementId: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  
  // Group actions
  groupSelectedElements: () => void;
  ungroupElements: (groupId: string) => void;
  updateGroupStyles: (groupId: string, styles: Partial<Record<string, string>>) => void;
  updateGroupLayout: (groupId: string, layout: Partial<SectionLayout>) => void;
  
  // View actions
  setViewMode: (mode: ViewMode) => void;
  updateCodeView: (html: string, css: string) => void;
  
  // History actions
  saveToHistory: (updatedQuiz: Quiz, description: string) => void;
  startHistoryBatch: () => void;
  endHistoryBatch: () => void;
  undo: () => boolean;
  redo: () => boolean;
}

// Storage helper functions
const getQuizStorageKey = (quizId: string) => `quiz-builder-quiz-${quizId}`;
const getQuizListStorageKey = () => 'quiz-builder-quizlist';

// Save a quiz to its own storage key
const saveQuizToStorage = (quiz: Quiz) => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Ensure quiz has proper theme structure before saving
    const migratedQuiz = migrateThemeData(quiz);
    
    // Update lastEdited timestamp
    migratedQuiz.lastEdited = new Date().toISOString();
    
    const key = getQuizStorageKey(migratedQuiz.id);
    localStorage.setItem(key, JSON.stringify(migratedQuiz));
    
    // Update quiz list in storage
    const quizList = loadQuizListFromStorage();
    const existingIndex = quizList.findIndex(item => item.id === migratedQuiz.id);
    
    if (existingIndex >= 0) {
      // Update existing quiz in list
      quizList[existingIndex] = {
        id: migratedQuiz.id,
        name: migratedQuiz.name,
        lastEdited: migratedQuiz.lastEdited
      };
    } else {
      // Add new quiz to list
      quizList.push({
        id: migratedQuiz.id,
        name: migratedQuiz.name,
        lastEdited: migratedQuiz.lastEdited
      });
    }
    
    saveQuizListToStorage(quizList);
    return true;
  } catch (error) {
    console.error('Failed to save quiz to storage:', error);
    return false;
  }
};

// Debounced version of saveQuizToStorage
const debouncedSaveQuizToStorage = debounce(saveQuizToStorage, 500);

// Load a quiz from storage by ID
const loadQuizFromStorage = (quizId: string): Quiz | null => {
  if (typeof window === 'undefined') return null;
  try {
    // Try the new format first
    const storedData = localStorage.getItem(getQuizStorageKey(quizId));
    if (storedData) {
      const quizData = JSON.parse(storedData);
      console.log(`Loaded quiz from localStorage using new format: ${quizId}`);
      return quizData;
    }
    
    // Try the old format as fallback
    const oldStoredData = localStorage.getItem(`quiz-storage-${quizId}`);
    if (oldStoredData) {
      try {
        const { quiz } = JSON.parse(oldStoredData);
        if (quiz) {
          console.log(`Loaded quiz from localStorage using old format: ${quizId}`);
          // Save it in the new format for future use
          saveQuizToStorage(quiz);
          return quiz;
        }
      } catch (e) {
        console.error(`Failed to parse old format quiz data for ${quizId}:`, e);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to load quiz ${quizId} from localStorage:`, error);
    return null;
  }
};

// Save quiz list to storage
const saveQuizListToStorage = (quizList: QuizListItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getQuizListStorageKey(), JSON.stringify(quizList));
    console.log('Saved quiz list to localStorage');
    return true;
  } catch (error) {
    console.error('Failed to save quiz list to localStorage:', error);
    return false;
  }
};

// Debounced version of saveQuizListToStorage
const debouncedSaveQuizListToStorage = debounce(saveQuizListToStorage, 500);

// Load quiz list from storage
const loadQuizListFromStorage = (): QuizListItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const storedData = localStorage.getItem(getQuizListStorageKey());
    if (!storedData) return [];
    
    const quizList = JSON.parse(storedData);
    console.log('Loaded quiz list from localStorage');
    return quizList;
  } catch (error) {
    console.error('Failed to load quiz list from localStorage:', error);
    return [];
  }
};

// Helper function to check if element has manual style overrides
const hasManualStyleOverride = (element: QuizElement, styleKey: string): boolean => {
  // If the element has themeStyles array, check if the property is in it
  if (element.themeStyles) {
    // If the property is in the themeStyles array, it means it was set by a theme
    // and not manually overridden
    return !element.themeStyles.includes(styleKey) && element.styles && styleKey in element.styles;
  }
  
  // For legacy elements without themeStyles array, compare with default theme values
  if (element.styles && styleKey in element.styles) {
    // Get the current value
    const currentValue = element.styles[styleKey];
    
    // Compare with default theme values
    if (styleKey === 'backgroundColor' && element.type === 'button') {
      return currentValue !== defaultTheme.primaryColor;
    }
    
    if (styleKey === 'fontFamily' && ['text', 'button', 'link'].includes(element.type)) {
      return currentValue !== defaultTheme.fontFamily;
    }
    
    if (styleKey === 'borderRadius' && ['button', 'image'].includes(element.type)) {
      return currentValue !== defaultTheme.cornerRadius;
    }
    
    if (styleKey === 'color' && ['text', 'link'].includes(element.type)) {
      return currentValue !== defaultTheme.textColor;
    }
    
    if (styleKey === 'fontSize') {
      if (element.type === 'text') {
        return currentValue !== sizeMappings.fontSize.text[defaultTheme.size];
      } else if (element.type === 'button') {
        return currentValue !== sizeMappings.fontSize.button[defaultTheme.size];
      } else if (element.type === 'link') {
        return currentValue !== sizeMappings.fontSize.link[defaultTheme.size];
      }
    }
    
    if (styleKey === 'padding' && element.type === 'button') {
      return currentValue !== sizeMappings.padding.button[defaultTheme.size];
    }
    
    if (styleKey === 'width') {
      if (element.type === 'text') {
        return currentValue !== sizeMappings.width.text[defaultTheme.size];
      } else if (element.type === 'button') {
        return currentValue !== sizeMappings.width.button[defaultTheme.size];
      }
    }
  }
  
  // Style not present or not an override
  return false;
};

// Get default styles with theme applied
const getThemedDefaultStyles = (type: ElementType, theme: ThemeSettings): { 
  styles: Record<string, string>; 
  themeStyles: string[];
} => {
  const defaultStyles = getDefaultStylesForType(type);
  const themeStyles: string[] = [];
  
  // Apply theme settings based on element type
  if (type === 'button') {
    defaultStyles.backgroundColor = theme.primaryColor;
    themeStyles.push('backgroundColor');
    
    // Apply corner radius to buttons
    defaultStyles.borderRadius = theme.cornerRadius;
    themeStyles.push('borderRadius');
    
    // Apply font size based on theme size
    if (sizeMappings.fontSize.button[theme.size]) {
      defaultStyles.fontSize = sizeMappings.fontSize.button[theme.size];
      themeStyles.push('fontSize');
    }
    
    // Apply padding based on theme size
    if (sizeMappings.padding.button[theme.size]) {
      defaultStyles.padding = sizeMappings.padding.button[theme.size];
      themeStyles.push('padding');
    }
    
    // Apply width based on theme size
    if (sizeMappings.width.button[theme.size]) {
      defaultStyles.width = sizeMappings.width.button[theme.size];
      themeStyles.push('width');
    }
  }
  
  // Apply font family to text elements
  if (['text', 'button', 'link'].includes(type)) {
    defaultStyles.fontFamily = theme.fontFamily;
    themeStyles.push('fontFamily');
    
    // Apply text color to text and link elements only, not buttons
    if (['text', 'link'].includes(type)) {
      defaultStyles.color = theme.textColor;
      themeStyles.push('color');
    }
  }
  
  // Apply font size to text elements
  if (type === 'text' && sizeMappings.fontSize.text[theme.size]) {
    defaultStyles.fontSize = sizeMappings.fontSize.text[theme.size];
    themeStyles.push('fontSize');
  }
  
  // Apply width to text elements
  if (type === 'text' && sizeMappings.width.text[theme.size]) {
    defaultStyles.width = sizeMappings.width.text[theme.size];
    themeStyles.push('width');
  }
  
  // Apply font size to link elements
  if (type === 'link' && sizeMappings.fontSize.link[theme.size]) {
    defaultStyles.fontSize = sizeMappings.fontSize.link[theme.size];
    themeStyles.push('fontSize');
  }
  
  // Apply corner radius to images
  if (type === 'image') {
    defaultStyles.borderRadius = theme.cornerRadius;
    themeStyles.push('borderRadius');
  }
  
  return { styles: defaultStyles, themeStyles };
};

// Define history-related types for better tracking
interface HistoryEntry {
  id: string;
  timestamp: number;
  quiz: Quiz;
  description: string; // Human-readable description of what changed
  batchId?: string; // For grouping related actions
}

// Helper for deep cloning objects more reliably
const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.error('Failed to deep clone object:', e);
    // Fallback to shallow clone if JSON serialization fails
    return { ...obj } as T;
  }
};

// Helper to generate a unique ID
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Improved history management with optional batching
const createHistoryManager = () => {
  // Current batch ID for related operations
  let currentBatchId: string | null = null;
  // Track if we're currently in an undo/redo operation
  let isUndoingRedoing = false;
  // Debounce timer
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  // Last saved quiz state (for checking actual changes)
  let lastSavedState: string | null = null;
  
  // Start a batch of operations that should be treated as a single history entry
  const startBatch = (store: any) => {
    if (currentBatchId === null) {
      currentBatchId = generateId();
      return true;
    }
    return false;
  };
  
  // End the current batch
  const endBatch = (store: any) => {
    currentBatchId = null;
  };
  
  // Save the current state to history
  const saveToHistory = (store: any, updatedQuiz: Quiz, description: string = 'State changed') => {
    // Don't save if we're in the middle of an undo/redo operation
    if (isUndoingRedoing === true) return;
    
    // Debounce history saves to avoid too many entries for rapid changes
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      const state = store.getState();
      const finalQuiz = {
        ...updatedQuiz,
        lastEdited: new Date().toISOString()
      };
      
      // Stringify for comparison to detect actual changes
      const newStateString = JSON.stringify(finalQuiz);
      
      // Only save if there are actual changes
      if (newStateString === lastSavedState) {
        return;
      }
      
      lastSavedState = newStateString;
      
      // Create history entry
      const historyEntry: HistoryEntry = {
        id: generateId(),
        timestamp: Date.now(),
        quiz: deepClone(finalQuiz),
        description,
        batchId: currentBatchId || undefined
      };
      
      // Save to storage
      debouncedSaveQuizToStorage(finalQuiz);
      
      // Update quiz list
      const updatedQuizList = state.quizList.map((item: any) => 
        item.id === finalQuiz.id 
          ? { ...item, name: finalQuiz.name, lastEdited: finalQuiz.lastEdited } 
          : item
      );
      debouncedSaveQuizListToStorage(updatedQuizList);
      
      // Update history state
      store.setState({
        quiz: finalQuiz,
        quizList: updatedQuizList,
        history: {
          past: [...state.history.past, state.history.present],
          present: historyEntry,
          future: []
        }
      });
    }, 250); // 250ms debounce
  };
  
  // Undo the last operation
  const undo = (store: any) => {
    const state = store.getState();
    const { past, present } = state.history;
    
    if (past.length === 0) return false;
    
    isUndoingRedoing = true;
    
    try {
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      // Apply the previous state
      store.setState({
        quiz: deepClone(previous.quiz),
        history: {
          past: newPast,
          present: previous,
          future: [present, ...state.history.future]
        }
      });
      
      // Don't save to storage during undo to prevent overwriting
      return true;
    } finally {
      isUndoingRedoing = false;
    }
  };
  
  // Redo the last undone operation
  const redo = (store: any) => {
    const state = store.getState();
    const { future, present } = state.history;
    
    if (future.length === 0) return false;
    
    isUndoingRedoing = true;
    
    try {
      const next = future[0];
      const newFuture = future.slice(1);
      
      // Apply the next state
      store.setState({
        quiz: deepClone(next.quiz),
        history: {
          past: [...state.history.past, present],
          present: next,
          future: newFuture
        }
      });
      
      // Don't save to storage during redo to prevent overwriting
      return true;
    } finally {
      isUndoingRedoing = false;
    }
  };
  
  return {
    saveToHistory,
    undo,
    redo,
    startBatch,
    endBatch
  };
};

// Initialize the history manager
const historyManager = createHistoryManager();

// Create the store with persistence middleware
export const useQuizStore = create<QuizState>()(
  devtools(
    persist(
      (set, get) => ({
        // Current state
        quiz: createDefaultQuiz(),
        quizList: [],
        selectedElementIds: [],
        selectedSectionId: null,
        viewMode: 'desktop' as ViewMode,
        codeView: {
          html: '',
          css: ''
        },
        history: {
          past: [],
          present: createDefaultQuiz(),
          future: []
        },
        clipboard: [],
        backgroundColors: {},
        
        // History actions
        saveToHistory: (updatedQuiz: Quiz, description: string = 'State changed') => {
          historyManager.saveToHistory(useQuizStore, updatedQuiz, description);
        },
        
        startHistoryBatch: () => {
          historyManager.startBatch(useQuizStore);
        },
        
        endHistoryBatch: () => {
          historyManager.endBatch(useQuizStore);
        },
        
        undo: () => {
          return historyManager.undo(useQuizStore);
        },
        
        redo: () => {
          return historyManager.redo(useQuizStore);
        },
        
        // Rest of the store actions
        // ... existing actions ...
      }),
      {
        name: 'quiz-builder-store',
        partialize: (state) => ({
          quiz: state.quiz,
          quizList: state.quizList,
          viewMode: state.viewMode,
          // Don't persist history or clipboard
        }),
      }
    )
  )
);

export default useQuizStore;

// Add client-side initialization to ensure the store has the latest data
if (typeof window !== 'undefined') {
  // This runs only on the client side after hydration
  setTimeout(() => {
    // Only initialize if we have quizzes stored
    try {
      const quizList = loadQuizListFromStorage();
      if (quizList.length > 0) {
        console.log('Found stored quiz list with', quizList.length, 'quizzes');
        
        // Get the current quiz ID from the store
        const currentState = useQuizStore.getState();
        const currentQuizId = currentState.quiz.id;
        
        // Try to load the current quiz from storage
        const freshQuizData = loadQuizFromStorage(currentQuizId);
        if (freshQuizData) {
          console.log(`Client-side init: Loaded fresh quiz data for ${freshQuizData.id}`);
          
          // Migrate theme data if needed
          const migratedQuiz = migrateThemeData(freshQuizData);
          
          useQuizStore.setState({
            quiz: migratedQuiz,
            quizList: quizList,
            history: {
              past: currentState.history.past,
              present: safeClone(migratedQuiz),
              future: []
            },
            selectedElementIds: [],
            selectedSectionId: null
          });
        } else {
          // If current quiz not found, try to load the most recent quiz
          const sortedList = [...quizList].sort((a, b) => 
            new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime()
          );
          
          if (sortedList.length > 0) {
            const mostRecentQuizId = sortedList[0].id;
            const quizData = loadQuizFromStorage(mostRecentQuizId);
            
            if (quizData) {
              console.log(`Client-side init: Loaded most recent quiz: ${quizData.id}`);
              
              // Migrate theme data if needed
              const migratedQuiz = migrateThemeData(quizData);
              
              useQuizStore.setState({
                quiz: migratedQuiz,
                quizList: quizList,
                history: {
                  past: [],
                  present: safeClone(migratedQuiz),
                  future: []
                },
                selectedElementIds: [],
                selectedSectionId: null
              });
            }
          }
        }
      } else {
        console.log('No stored quizzes found, using default quiz');
      }
    } catch (error) {
      console.error('Client-side initialization error:', error);
    }
  }, 100); // Slight delay to ensure hydration completes first
}

// Migration utility to ensure backward compatibility with the new theme system
function migrateThemeData(quiz: Quiz): Quiz {
  // Check if quiz already has the new theme structure
  if (quiz.themes && quiz.activeThemeId) {
    return quiz; // Already migrated
  }
  
  // Create a deep clone of the quiz
  const updatedQuiz = safeClone(quiz);
  
  // Get current theme or use default
  const currentTheme = updatedQuiz.theme || { ...defaultTheme };
  
  // Add the predefined themes
  updatedQuiz.themes = [...predefinedThemes];
  
  // Set the active theme to the first theme
  updatedQuiz.activeThemeId = 'theme1';
  
  // Keep the current theme for backward compatibility
  updatedQuiz.theme = currentTheme;
  
  console.log('Migrated quiz to new theme structure', updatedQuiz.id);
  return updatedQuiz;
} 