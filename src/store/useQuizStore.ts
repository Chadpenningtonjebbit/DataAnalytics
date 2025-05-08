import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Quiz, QuizElement, QuizScreen, ViewMode, ElementType, SectionType, QuizSection, SectionLayout, FlexDirection, FlexWrap, JustifyContent, AlignItems, AlignContent, ThemeSettings, ThemeItem, ElementStyle, StyleClass } from '@/types';
import { debounce } from 'lodash';
import { 
  getDefaultStylesForType, 
  getDefaultContentForType, 
  getDefaultAttributesForType,
  getGroupedElementStyles,
  getDefaultGroupLayout
} from '@/lib/defaultStyles';

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
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#ffffff', // White
  cornerRadius: '4px', // Default corner radius
  size: 'small' // Default size
};

// Predefined themes
const predefinedThemes: ThemeItem[] = [
  {
    id: 'theme1',
    name: 'Theme #1',
    settings: {
      primaryColor: '#000000', // Black
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff', // White
      cornerRadius: '4px', // Default corner radius
      size: 'small'
    }
  },
  {
    id: 'theme2',
    name: 'Theme #2',
    settings: {
      primaryColor: '#0ea5e9', // Sky blue
      fontFamily: 'Helvetica, sans-serif',
      backgroundColor: '#f0f9ff', // Light blue bg
      cornerRadius: '8px', // More rounded corners
      size: 'small'
    }
  },
  {
    id: 'theme3',
    name: 'Theme #3',
    settings: {
      primaryColor: '#10b981', // Emerald green
      fontFamily: "'Montserrat', sans-serif",
      backgroundColor: '#ecfdf5', // Light green bg
      cornerRadius: '12px', // Even more rounded corners
      size: 'medium'
    }
  },
  {
    id: 'theme4',
    name: 'Theme #4',
    settings: {
      primaryColor: '#8b5cf6', // Purple
      fontFamily: "'Poppins', sans-serif",
      backgroundColor: '#f5f3ff', // Light purple bg
      cornerRadius: '6px', // Medium rounded corners
      size: 'medium'
    }
  },
  {
    id: 'theme5',
    name: 'Theme #5',
    settings: {
      primaryColor: '#ef4444', // Red
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
  undo: () => void;
  redo: () => void;
  saveToHistory: (quiz: Quiz) => void;
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

// Create the store with persistence middleware
export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quiz: createDefaultQuiz(),
      quizList: [],
      selectedElementIds: [],
      selectedSectionId: null,
      viewMode: 'desktop',
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
      backgroundColors: {}, // Add initial state for backgroundColors
      
      // Quiz management actions
      createQuiz: (name: string) => {
        const newQuiz = createDefaultQuiz(name);
        const newQuizListItem = {
          id: newQuiz.id,
          name: newQuiz.name,
          lastEdited: newQuiz.lastEdited || new Date().toISOString()
        };
        
        // Update state with new quiz
        set(state => {
          // Save the current quiz before switching
          debouncedSaveQuizToStorage(state.quiz);
          
          // Update quiz list
          const updatedQuizList = [...state.quizList, newQuizListItem];
          debouncedSaveQuizListToStorage(updatedQuizList);
          
          // Save new quiz
          debouncedSaveQuizToStorage(newQuiz);
    
    return {
            quiz: newQuiz,
            quizList: updatedQuizList,
            history: {
              past: [...state.history.past, state.history.present],
              present: safeClone(newQuiz),
              future: []
            },
            selectedElementIds: [],
            selectedSectionId: null
          };
        });
      },
      
      loadQuiz: async (id: string) => {
        const quizData = loadQuizFromStorage(id);
        if (!quizData) {
          console.error(`Quiz with ID ${id} not found in storage`);
          return false;
        }
        
        // Save current quiz before switching
        debouncedSaveQuizToStorage(get().quiz);
        
        // Update the state with the loaded quiz
        set({
          quiz: quizData,
          history: {
            past: [...get().history.past, get().history.present],
            present: safeClone(quizData),
            future: []
          },
          selectedElementIds: [],
          selectedSectionId: null
        });
        
        console.log(`Switched to quiz: ${quizData.name} (${id})`);
        return true;
      },
      
      deleteQuiz: (id: string) => {
        const { quizList, quiz } = get();
        
        // Don't delete the active quiz
        if (id === quiz.id) {
          console.error("Cannot delete the active quiz");
          return;
        }
        
        // Remove from quiz list
        const updatedQuizList = quizList.filter(item => item.id !== id);
        
        // Remove from storage
        try {
          localStorage.removeItem(getQuizStorageKey(id));
          debouncedSaveQuizListToStorage(updatedQuizList);
          set({ quizList: updatedQuizList });
          console.log(`Deleted quiz: ${id}`);
        } catch (error) {
          console.error(`Failed to delete quiz ${id}:`, error);
        }
      },
      
      saveCurrentQuiz: () => {
        const { quiz, quizList } = get();
        
        // Update lastEdited timestamp
        const updatedQuiz = {
          ...quiz,
          lastEdited: new Date().toISOString()
        };
        
        // Save to storage
        debouncedSaveQuizToStorage(updatedQuiz);
        
        // Update quiz list
        const updatedQuizList = quizList.map(item => 
          item.id === updatedQuiz.id 
            ? { ...item, name: updatedQuiz.name, lastEdited: updatedQuiz.lastEdited || new Date().toISOString() } 
            : item
        );
        debouncedSaveQuizListToStorage(updatedQuizList);
        
        // Update state
        set({
          quiz: updatedQuiz,
          quizList: updatedQuizList
        });
      },
      
      // Save to history helper
      saveToHistory: (updatedQuiz: Quiz) => {
        const state = get();
        // Only save if the quiz is different
        if (JSON.stringify(state.quiz) === JSON.stringify(updatedQuiz)) {
          return;
        }
        
        set(state => {
          const newPast = [...state.history.past, state.history.present];
          // Limit history to 50 items
          if (newPast.length > 50) {
            newPast.shift();
          }

          // Update lastEdited timestamp
          const finalQuiz = {
            ...updatedQuiz,
            lastEdited: new Date().toISOString()
          };

          // Save the quiz to storage
          debouncedSaveQuizToStorage(finalQuiz);

          // Update quiz list item
          const updatedQuizList = state.quizList.map(item => 
            item.id === finalQuiz.id 
              ? { ...item, name: finalQuiz.name, lastEdited: finalQuiz.lastEdited || new Date().toISOString() } 
              : item
          );
          debouncedSaveQuizListToStorage(updatedQuizList);

          return {
            quiz: finalQuiz,
            quizList: updatedQuizList,
            history: {
              past: newPast,
              present: safeClone(finalQuiz),
              future: []
            }
          };
        });
      },
      
      setQuiz: (quiz: Quiz) => {
        // Update with timestamp
        const updatedQuiz = {
          ...quiz,
          lastEdited: new Date().toISOString()
        };
        
        // Save to storage
        debouncedSaveQuizToStorage(updatedQuiz);
        
        // Update quiz list
        const { quizList } = get();
        const updatedQuizList = quizList.map(item => 
          item.id === updatedQuiz.id 
            ? { ...item, name: updatedQuiz.name, lastEdited: updatedQuiz.lastEdited || '' } 
            : item
        );
        debouncedSaveQuizListToStorage(updatedQuizList);
        
        set({
          quiz: updatedQuiz,
          quizList: updatedQuizList,
          history: {
            past: [...get().history.past, get().history.present],
            present: safeClone(updatedQuiz),
            future: []
          }
        });
      },
 
      // Rest of the existing methods...
      // The implementations can stay the same, just need to be included here
  
  addScreen: () => set((state) => {
    const theme = state.quiz.theme || defaultTheme;
    
    // Create default sections with theme's background color
    const createSectionWithTheme = (id: SectionType, name: string, enabled: boolean): QuizSection => {
      const section = createDefaultSection(id, name, enabled);
      // Apply theme's background color
      section.styles = {
        ...section.styles,
        backgroundColor: theme.backgroundColor
      };
      return section;
    };
    
    const newScreen: QuizScreen = {
      id: uuidv4(),
      name: `Screen ${state.quiz.screens.length + 1}`,
      sections: {
        header: createSectionWithTheme('header', 'Header', false),
        body: createSectionWithTheme('body', 'Body', true),
        footer: createSectionWithTheme('footer', 'Footer', false),
      },
    };
    
    const updatedQuiz = {
      ...state.quiz,
      screens: [...state.quiz.screens, newScreen],
      currentScreenIndex: state.quiz.screens.length,
    };
    
    get().saveToHistory(updatedQuiz);
    
    return {
      quiz: updatedQuiz
    };
  }),
  
      removeScreen: (screenId: string) => set((state) => {
    const screenIndex = state.quiz.screens.findIndex(screen => screen.id === screenId);
    if (screenIndex === -1) return state;
    
    const newScreens = [...state.quiz.screens];
    newScreens.splice(screenIndex, 1);
    
    const updatedQuiz = {
      ...state.quiz,
      screens: newScreens,
      currentScreenIndex: Math.min(state.quiz.currentScreenIndex, newScreens.length - 1),
    };
    
    get().saveToHistory(updatedQuiz);
    
    return {
      quiz: updatedQuiz
    };
  }),
  
      setCurrentScreen: (index: number) => set((state) => {
    const updatedQuiz = {
      ...state.quiz,
      currentScreenIndex: index,
    };
    
    return {
      quiz: updatedQuiz
    };
  }),
        
      // Undo action
      undo: () => set(state => {
        const { past, present } = state.history;
        if (past.length === 0) return state;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        return {
          quiz: safeClone(previous),
          history: {
            past: newPast,
            present: safeClone(previous),
            future: [present, ...state.history.future]
          }
        };
      }),
      
      // Redo action
      redo: () => set(state => {
        const { future } = state.history;
        if (future.length === 0) return state;

        const next = future[0];
        const newFuture = future.slice(1);

        return {
          quiz: safeClone(next),
          history: {
            past: [...state.history.past, state.history.present],
            present: safeClone(next),
            future: newFuture
          }
        };
      }),
  
  // Section actions
      toggleSection: (sectionId: SectionType) => set((state) => {
    const currentScreen = state.quiz.screens[state.quiz.currentScreenIndex];
    
    // Toggle the enabled state of the section
    const updatedSections = {
      ...currentScreen.sections,
      [sectionId]: {
        ...currentScreen.sections[sectionId],
        enabled: !currentScreen.sections[sectionId].enabled,
      }
    };
    
    // Update the screen with the new sections
    const updatedScreens = state.quiz.screens.map((screen, index) => {
      if (index === state.quiz.currentScreenIndex) {
        return {
          ...screen,
          sections: updatedSections,
        };
      }
      return screen;
    });
    
    const updatedQuiz = {
      ...state.quiz,
      screens: updatedScreens,
    };
    
    get().saveToHistory(updatedQuiz);
    
    return {
      quiz: updatedQuiz
    };
  }),
  
      selectSection: (sectionId: SectionType | null) => set({
    selectedSectionId: sectionId,
    selectedElementIds: [], // Deselect any selected elements
  }),
  
      updateSectionStyles: (sectionId: SectionType, styles: Partial<Record<string, string>>) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    // Update the section styles
    newScreen.sections[sectionId].styles = {
      ...newScreen.sections[sectionId].styles || {},
      ...styles
    };
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
  
      updateSectionLayout: (sectionId: SectionType, layout: Partial<SectionLayout>) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    // Update the section layout
    newScreen.sections[sectionId].layout = {
      ...newScreen.sections[sectionId].layout,
      ...layout
    };
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
  
  // Element actions
      addElement: (type: ElementType, sectionId: SectionType, screenId?: string) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const targetScreenId = screenId || state.quiz.screens[currentScreenIndex].id;
    const targetScreenIndex = state.quiz.screens.findIndex(screen => screen.id === targetScreenId);
    
    if (targetScreenIndex === -1) return state;
    
        // Get default styles and apply theme settings
        const theme = state.quiz.theme || defaultTheme;
        const { styles: defaultStyles, themeStyles } = getThemedDefaultStyles(type, theme);
        const defaultContent = getDefaultContentForType(type);
        const defaultAttributes = getDefaultAttributesForType(type);
    
    const newElement: QuizElement = {
      id: uuidv4(),
      type,
      content: defaultContent,
      styles: defaultStyles,
      attributes: defaultAttributes,
      sectionId,
          themeStyles,
    };
    
    // Create a copy of the current screen
    const currentScreen = { ...state.quiz.screens[targetScreenIndex] };
    
    // Add the new element to the specified section
    const updatedSection = {
      ...currentScreen.sections[sectionId],
      elements: [...currentScreen.sections[sectionId].elements, newElement],
    };
    
    // Update the sections in the screen
    const updatedSections = {
      ...currentScreen.sections,
      [sectionId]: updatedSection,
    };
    
    // Create the updated screen
    const updatedScreen = {
      ...currentScreen,
      sections: updatedSections,
    };
    
    // Update the screens array
    const updatedScreens = state.quiz.screens.map((screen, index) => {
      if (index === targetScreenIndex) {
        return updatedScreen;
      }
      return screen;
    });
    
    const updatedQuiz = {
      ...state.quiz,
      screens: updatedScreens,
    };
    
    get().saveToHistory(updatedQuiz);
    
    return {
      quiz: updatedQuiz,
      selectedElementIds: [newElement.id],
    };
  }),
  
      updateElement: (elementId: string, updates: Partial<QuizElement>) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Create a copy of the sections
    const updatedSections = { ...currentScreen.sections };
    
    // Find the element in each section and update it if found
    let elementFound = false;
    
    // Helper function to deep clone an object
    const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));
        
        // If styles are being updated, update themeStyles accordingly
        const processStyleUpdates = (element: QuizElement, updates: Partial<QuizElement>) => {
          // If no style updates, return the updates as is
          if (!updates.styles) return updates;
          
          const processedUpdates = { ...updates };
          const updatedThemeStyles = element.themeStyles ? [...element.themeStyles] : [];
          
          // Get current theme for comparison
          const currentTheme = get().quiz.theme || defaultTheme;
          
          // Only remove the specific style properties that are being manually set to different values than theme defaults
          if (updates.styles && element.themeStyles) {
            Object.entries(updates.styles).forEach(([styleKey, newValue]) => {
              // First check if this property is currently themed
              const isThemed = updatedThemeStyles.includes(styleKey);
              
              if (isThemed) {
                // Get the current theme value for this property based on element type
                let themeValue = null;
                if (styleKey === 'backgroundColor' && element.type === 'button') {
                  themeValue = currentTheme.primaryColor;
                } else if (styleKey === 'fontFamily' && ['text', 'button', 'link'].includes(element.type)) {
                  themeValue = currentTheme.fontFamily;
                } else if (styleKey === 'borderRadius' && ['button', 'image'].includes(element.type)) {
                  themeValue = currentTheme.cornerRadius;
                } else if (styleKey === 'fontSize') {
                  if (element.type === 'text' && sizeMappings.fontSize.text[currentTheme.size]) {
                    themeValue = sizeMappings.fontSize.text[currentTheme.size];
                  } else if (element.type === 'button' && sizeMappings.fontSize.button[currentTheme.size]) {
                    themeValue = sizeMappings.fontSize.button[currentTheme.size];
                  } else if (element.type === 'link' && sizeMappings.fontSize.link[currentTheme.size]) {
                    themeValue = sizeMappings.fontSize.link[currentTheme.size];
                  }
                } else if (styleKey === 'padding' && element.type === 'button') {
                  themeValue = sizeMappings.padding.button[currentTheme.size];
                }
                
                // If the new value is different from the theme value, consider it a manual override
                if (themeValue !== null && newValue !== themeValue) {
                  const index = updatedThemeStyles.indexOf(styleKey);
                  if (index !== -1) {
                    // Remove only this specific property from theme styles when manually changed
                    updatedThemeStyles.splice(index, 1);
                  }
                }
              }
            });
            
            // Add themeStyles to the updates
            processedUpdates.themeStyles = updatedThemeStyles;
          }
          
          return processedUpdates;
        };
    
    // Recursive function to find and update an element in nested groups
    const updateElementInGroup = (group: QuizElement, targetId: string, updates: Partial<QuizElement>): boolean => {
      if (!group.isGroup || !group.children) return false;
      
      // Check direct children of this group
      const childIndex = group.children.findIndex((child: QuizElement) => child.id === targetId);
      if (childIndex !== -1) {
            // Process style updates to track manual changes
            const processedUpdates = processStyleUpdates(group.children[childIndex], updates);
            
        // Update the child element
        group.children[childIndex] = {
          ...group.children[childIndex],
              ...processedUpdates,
        };
        return true;
      }
      
      // Check nested groups
      for (let i = 0; i < group.children.length; i++) {
        const childElement = group.children[i];
        if (childElement.isGroup && childElement.children) {
          const found = updateElementInGroup(childElement, targetId, updates);
          if (found) return true;
        }
      }
      
      return false;
    };
    
    // First, check if the element is directly in a section
    Object.keys(updatedSections).forEach((sectionKey) => {
      const sectionId = sectionKey as SectionType;
      const section = updatedSections[sectionId];
      
      const elementIndex = section.elements.findIndex((element: QuizElement) => element.id === elementId);
      if (elementIndex !== -1) {
        elementFound = true;
        
        // Create a copy of the elements array
        const updatedElements = [...section.elements];
            
            // Process style updates to track manual changes
            const processedUpdates = processStyleUpdates(updatedElements[elementIndex], updates);
        
        // Update the element
        updatedElements[elementIndex] = {
          ...updatedElements[elementIndex],
              ...processedUpdates,
        };
        
        // Update the section with the new elements
        updatedSections[sectionId] = {
          ...section,
          elements: updatedElements,
        };
      }
    });
    
    // If not found directly in a section, check inside groups
    if (!elementFound) {
      Object.keys(updatedSections).forEach((sectionKey) => {
        if (elementFound) return; // Skip if already found
        
        const sectionId = sectionKey as SectionType;
        const section = updatedSections[sectionId];
        
        // Create a copy of the elements array
        const updatedElements = deepClone(section.elements);
        
        // Check each element to see if it's a group
        for (let i = 0; i < updatedElements.length; i++) {
          const element: QuizElement = updatedElements[i];
          
          if (element.isGroup && element.children) {
            // Try to update the element in this group (including nested groups)
            const found = updateElementInGroup(element, elementId, updates);
            
            if (found) {
              elementFound = true;
              
              // Update the section with the modified group
              updatedSections[sectionId] = {
                ...section,
                elements: updatedElements,
              };
              
              break; // Exit the loop once found
            }
          }
        }
      });
    }
    
    if (!elementFound) return state;
    
    // Update the screen with the new sections
    const updatedScreens = state.quiz.screens.map((screen, index) => {
      if (index === currentScreenIndex) {
        return {
          ...screen,
          sections: updatedSections,
        };
      }
      return screen;
    });
    
    // Create the updated quiz
    const updatedQuiz = {
      ...state.quiz,
      screens: updatedScreens,
    };
    
    // Save to history
    get().saveToHistory(updatedQuiz);
    
    return {
      ...state,
      quiz: updatedQuiz,
    };
  }),
  
  removeElement: (elementId: string) => set((state) => {
    const { quiz } = state;
    const currentScreen = quiz.screens[quiz.currentScreenIndex];
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[quiz.currentScreenIndex];
    let elementRemoved = false;
    
    // Recursive function to remove an element from nested groups
    const removeElementFromGroup = (group: QuizElement, targetId: string): boolean => {
      if (!group.isGroup || !group.children) return false;
      
      // Check if the element is a direct child of this group
      const initialLength = group.children.length;
      group.children = group.children.filter((child: QuizElement) => child.id !== targetId);
      
      if (group.children.length < initialLength) {
        return true; // Element was found and removed
      }
      
      // If not found directly, check nested groups
      for (let i = 0; i < group.children.length; i++) {
        const childElement = group.children[i];
        if (childElement.isGroup && childElement.children) {
          const removed = removeElementFromGroup(childElement, targetId);
          if (removed) return true;
        }
      }
      
      return false;
    };
    
    // First try to remove the element directly from sections
    for (const sectionKey of Object.keys(newScreen.sections) as SectionType[]) {
      const section = newScreen.sections[sectionKey];
      const initialLength = section.elements.length;
      
      section.elements = section.elements.filter((element: QuizElement) => element.id !== elementId);
      
      if (section.elements.length < initialLength) {
        elementRemoved = true;
        break;
      }
    }
    
    // If not found directly in sections, check inside groups
    if (!elementRemoved) {
      for (const sectionKey of Object.keys(newScreen.sections) as SectionType[]) {
        if (elementRemoved) break;
        
        const section = newScreen.sections[sectionKey];
        
        // Check each group in the section
        for (let i = 0; i < section.elements.length; i++) {
          const element: QuizElement = section.elements[i];
          
          if (element.isGroup && element.children) {
            const removed = removeElementFromGroup(element, elementId);
            if (removed) {
              elementRemoved = true;
              break;
            }
          }
        }
      }
    }
    
    // Save to history if the element was removed
    if (elementRemoved) {
      get().saveToHistory(newState.quiz);
    }
    
    return { 
      ...newState,
      selectedElementIds: state.selectedElementIds.filter(id => id !== elementId)
    };
  }),
  
      removeSelectedElements: () => set((state) => {
        const { quiz, selectedElementIds } = state;
        if (selectedElementIds.length === 0) return state;
        
        const currentScreen = quiz.screens[quiz.currentScreenIndex];
        
        // Create a deep copy of the current screen
        const updatedScreen = JSON.parse(JSON.stringify(currentScreen));
        
        // Remove selected elements from all sections
        for (const sectionKey of Object.keys(updatedScreen.sections) as SectionType[]) {
          const section = updatedScreen.sections[sectionKey];
          
          // Function to recursively remove elements from groups
          const removeFromGroup = (group: QuizElement): boolean => {
            if (!group.isGroup || !group.children) return false;
            
            // Remove direct children
            const initialLength = group.children.length;
            group.children = group.children.filter(child => !selectedElementIds.includes(child.id));
            
            // Check if any children were removed
            const removedDirectly = group.children.length < initialLength;
            
            // Process nested groups
            let removedFromNested = false;
            for (const child of group.children) {
              if (child.isGroup && child.children) {
                const removed = removeFromGroup(child);
                removedFromNested = removedFromNested || removed;
              }
            }
            
            return removedDirectly || removedFromNested;
          };
          
          // Remove from direct section elements
          section.elements = section.elements.filter((element: QuizElement) => !selectedElementIds.includes(element.id));
          
          // Remove from groups
          for (const element of section.elements) {
            if (element.isGroup && element.children) {
              removeFromGroup(element);
            }
          }
        }
        
        // Update the quiz with the new screen
        const updatedScreens = quiz.screens.map((screen, index) => 
          index === quiz.currentScreenIndex ? updatedScreen : screen
        );
        
        const updatedQuiz = {
          ...quiz,
          screens: updatedScreens,
        };
        
        // Save to history
        get().saveToHistory(updatedQuiz);
        
        return { 
          quiz: updatedQuiz,
          selectedElementIds: []
        };
      }),
      
      moveElement: (elementId: string, targetSectionId: SectionType) => set((state) => {
    console.log(`moveElement called with elementId: ${elementId}, targetSectionId: ${targetSectionId}`);
    
    // Get the current screen
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Find the source section and element index
    let sourceSection: SectionType | null = null;
    let elementIndex = -1;
        let elementToMove: QuizElement | null = null;
    
    // Check each section for the element
    for (const sectionKey of ['header', 'body', 'footer'] as SectionType[]) {
      const index = currentScreen.sections[sectionKey].elements.findIndex((el: QuizElement) => el.id === elementId);
      if (index !== -1) {
        sourceSection = sectionKey;
        elementIndex = index;
            elementToMove = { ...currentScreen.sections[sectionKey].elements[index] };
        break;
      }
    }
    
    console.log(`Found element in section: ${sourceSection}, at index: ${elementIndex}`);
    
    // If element wasn't found or source is same as target, do nothing
        if (sourceSection === null || elementIndex === -1 || sourceSection === targetSectionId || !elementToMove) {
      console.log('No action needed - element not found or already in target section');
      return state;
    }
    
    console.log(`Element to move:`, elementToMove);
    
    // Create a new state object with the element moved to the new section
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    // Remove the element from the source section
    newScreen.sections[sourceSection].elements.splice(elementIndex, 1);
    
    // Update the element's sectionId
    elementToMove.sectionId = targetSectionId;
    
    // Add the element to the target section
    newScreen.sections[targetSectionId].elements.push(elementToMove);
    
    console.log(`Element moved to section: ${targetSectionId}`);
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
  
      selectElement: (elementId: string | null, isMultiSelect?: boolean) => set((state) => {
        if (elementId === null) {
          return { selectedElementIds: [] };
        }
    
    if (isMultiSelect) {
          // Toggle selection
          const isSelected = state.selectedElementIds.includes(elementId);
          if (isSelected) {
            return {
              selectedElementIds: state.selectedElementIds.filter(id => id !== elementId)
            };
      } else {
            return {
              selectedElementIds: [...state.selectedElementIds, elementId]
            };
      }
    } else {
          // Single select
        return {
            selectedElementIds: [elementId],
            selectedSectionId: null
          };
        }
      }),
      
      copySelectedElements: () => set((state) => {
        const { quiz, selectedElementIds } = state;
        if (selectedElementIds.length === 0) return state;
    
    const currentScreen = quiz.screens[quiz.currentScreenIndex];
    const elementsToCopy: QuizElement[] = [];
    
    // Helper function to find elements recursively in groups
    const findElementsRecursively = (elements: QuizElement[], targetIds: string[]) => {
      elements.forEach(element => {
        // Check if this element should be copied
        if (targetIds.includes(element.id)) {
          // Create a deep copy of the element
          const deepCopy = JSON.parse(JSON.stringify(element));
          elementsToCopy.push(deepCopy);
        }
        
        // If this is a group, check its children too
        if (element.isGroup && element.children) {
          findElementsRecursively(element.children, targetIds);
        }
      });
    };
    
    // Look for selected elements in all sections
    Object.values(currentScreen.sections).forEach(section => {
      findElementsRecursively(section.elements, selectedElementIds);
    });
    
    // Store in clipboard
        return { clipboard: elementsToCopy };
      }),
      
      pasteElements: (targetSectionId?: SectionType, targetGroupId?: string) => set((state) => {
        const { clipboard, quiz } = state;
        
        if (clipboard.length === 0) return state;
        
        // Get current screen and determine target section
        const currentScreenIndex = quiz.currentScreenIndex;
        const currentScreen = quiz.screens[currentScreenIndex];
        const sectionId = targetSectionId || (state.selectedSectionId || 'body');
        
        // Create a deep copy of the current screen
        const updatedScreen = JSON.parse(JSON.stringify(currentScreen));
        
        // Function to generate new IDs for pasted elements and their children
        const generateNewIds = (element: QuizElement): QuizElement => {
          const newElement = { ...element, id: uuidv4(), sectionId };
          
          // If this is a group, update children IDs too
          if (element.isGroup && element.children) {
            newElement.children = element.children.map(child => generateNewIds(child));
      }
      
      return newElement;
        };
    
        // Generate new elements with fresh IDs
        const newElements = clipboard.map(element => generateNewIds(element));
    
        // If pasting into a specific group
    if (targetGroupId) {
          // Function to find and update the target group
          const updateGroup = (elements: QuizElement[]): boolean => {
            for (let i = 0; i < elements.length; i++) {
              const element = elements[i];
              
              if (element.id === targetGroupId) {
                // Found the target group, add the new elements to its children
                element.children = element.children || [];
                element.children.push(...newElements);
                return true;
              }
              
              // Check nested groups
              if (element.isGroup && element.children) {
                const updated = updateGroup(element.children);
                if (updated) return true;
              }
            }
            return false;
          };
          
          // Try to find and update the target group in all sections
          let found = false;
          for (const secKey of Object.keys(updatedScreen.sections) as SectionType[]) {
            found = updateGroup(updatedScreen.sections[secKey].elements);
            if (found) break;
          }
          
          // If target group wasn't found, paste into the selected section
          if (!found) {
            updatedScreen.sections[sectionId].elements.push(...newElements);
          }
    } else {
          // Paste directly into the section
          updatedScreen.sections[sectionId].elements.push(...newElements);
        }
        
        // Update screens array
        const updatedScreens = quiz.screens.map((screen, index) =>
          index === currentScreenIndex ? updatedScreen : screen
        );
        
        const updatedQuiz = {
        ...quiz,
        screens: updatedScreens,
      };
    
        // Save to history
        get().saveToHistory(updatedQuiz);
    
        // Return updated state with newly pasted elements selected
        return {
      quiz: updatedQuiz,
          selectedElementIds: newElements.map(el => el.id),
        };
      }),
      
      renameQuiz: (id: string, newName: string) => {
        if (!newName.trim()) return false;
        
        const { quizList, quiz } = get();
        const quizToRename = quizList.find(item => item.id === id);
        
        if (!quizToRename) {
          console.error(`Quiz with ID ${id} not found for renaming`);
          return false;
        }
        
        // Update the quiz list
        const updatedQuizList = quizList.map(item => 
          item.id === id 
            ? { ...item, name: newName.trim() } 
            : item
        );
        
        // If renaming the current quiz, update it too
        if (quiz.id === id) {
    const updatedQuiz = {
        ...quiz,
            name: newName.trim(),
            lastEdited: new Date().toISOString()
      };
    
          // Save to storage
          debouncedSaveQuizToStorage(updatedQuiz);
    
          // Update state
    set({ 
      quiz: updatedQuiz,
            quizList: updatedQuizList
          });
    } else {
          // Only update the quiz list
          set({ quizList: updatedQuizList });
          
          // If the quiz exists in storage, update it there
          const storedQuiz = loadQuizFromStorage(id);
          if (storedQuiz) {
            const updatedQuiz = {
              ...storedQuiz,
              name: newName.trim(),
              lastEdited: new Date().toISOString()
            };
            debouncedSaveQuizToStorage(updatedQuiz);
          }
        }
        
        // Save the updated list to storage
        debouncedSaveQuizListToStorage(updatedQuizList);
        console.log(`Renamed quiz ${id} to "${newName}"`);
          return true;
      },
      
      duplicateQuiz: async (id: string) => {
        const { quizList } = get();
        const quizToDuplicate = quizList.find(item => item.id === id);
        
        if (!quizToDuplicate) {
          console.error(`Quiz with ID ${id} not found for duplication`);
          return null;
        }
        
        // Load the quiz data
        const quizData = loadQuizFromStorage(id);
        if (!quizData) {
          console.error(`Quiz data for ID ${id} not found in storage`);
          return null;
        }
        
        // Create a new quiz with the same content but a new ID
        const newId = uuidv4();
        const duplicatedQuiz: Quiz = {
          ...safeClone(quizData),
          id: newId,
          name: `${quizData.name} (Copy)`,
          lastEdited: new Date().toISOString()
        };
        
        // Create a quiz list item
        const newQuizListItem: QuizListItem = {
          id: newId,
          name: duplicatedQuiz.name,
          lastEdited: duplicatedQuiz.lastEdited || new Date().toISOString()
        };
        
        // Update state
        const updatedQuizList = [...quizList, newQuizListItem];
        set({ quizList: updatedQuizList });
        
        // Save to storage
        debouncedSaveQuizToStorage(duplicatedQuiz);
        debouncedSaveQuizListToStorage(updatedQuizList);
        
        console.log(`Duplicated quiz ${id} as ${newId}`);
        return newId;
      },
      
  groupSelectedElements: () => set((state) => {
        const { quiz, selectedElementIds } = state;
    
    // Need at least 2 elements to form a group
        if (selectedElementIds.length < 2) {
          console.log('Need at least 2 elements to form a group');
          return state;
        }
    
        console.log('Grouping elements:', selectedElementIds);
    
        // Deep clone the state to avoid mutations
    const newState = JSON.parse(JSON.stringify(state));
        const currentScreenIndex = quiz.currentScreenIndex;
        const currentScreen = newState.quiz.screens[currentScreenIndex];
        
        // Track which elements were found and which section they belong to
        const elementsToGroup: QuizElement[] = [];
        let sectionCounts: Record<SectionType, number> = {
          header: 0,
          body: 0,
          footer: 0
        };
        
        // Track the section object that contains most elements (to inherit its layout)
        let primarySection: QuizSection | null = null;
        
        // Helper function to recursively find and remove selected elements from groups
        const findAndRemoveFromGroup = (group: QuizElement, targetIds: string[]): QuizElement[] => {
          if (!group.isGroup || !group.children) return [];
          
          const foundElements: QuizElement[] = [];
          const remainingChildren: QuizElement[] = [];
          
          // Check each child
          for (const child of group.children) {
            if (targetIds.includes(child.id)) {
              // This is a selected element, collect it
              foundElements.push(JSON.parse(JSON.stringify(child)));
            } else if (child.isGroup && child.children) {
              // This is a nested group, check its children
              const nestedFound = findAndRemoveFromGroup(child, targetIds);
              
              if (nestedFound.length > 0) {
                // Add elements found in nested group
                foundElements.push(...nestedFound);
                
                // Keep the group even if elements were removed from it
                // with an updated children array excluding found elements
                const updatedChildren = child.children.filter(
                  nestedChild => !targetIds.includes(nestedChild.id)
                );
                
                if (updatedChildren.length > 0) {
                  remainingChildren.push({
                    ...child,
                    children: updatedChildren
                  });
                }
              } else {
                // No elements found, keep the group as is
                remainingChildren.push(child);
              }
            } else {
              // Not selected and not a group, keep as is
              remainingChildren.push(child);
            }
          }
          
          // Update the group's children
          group.children = remainingChildren;
          
          return foundElements;
        };
        
        // First pass: find and remove elements from their current locations
        for (const sectionKey of Object.keys(currentScreen.sections) as SectionType[]) {
          const section = currentScreen.sections[sectionKey];
          
          // Find elements directly in this section
          const directElements = section.elements.filter(
            (el: QuizElement) => selectedElementIds.includes(el.id)
          );
          
          if (directElements.length > 0) {
            // Keep track of which section had the most elements
            sectionCounts[sectionKey] += directElements.length;
            
            // Add to our collection
            elementsToGroup.push(...JSON.parse(JSON.stringify(directElements)));
            
            // Remove the elements from the section
            section.elements = section.elements.filter(
              (el: QuizElement) => !selectedElementIds.includes(el.id)
            );
            
            // Update the primary section if this one has more elements
            if (!primarySection || directElements.length > sectionCounts[primarySection.id]) {
              primarySection = section;
            }
          }
          
          // Find elements in groups in this section
          const groupElements: QuizElement[] = [];
          for (let i = 0; i < section.elements.length; i++) {
            const element = section.elements[i];
            
            if (element.isGroup && element.children) {
              const foundInGroup = findAndRemoveFromGroup(element, selectedElementIds);
              
              if (foundInGroup.length > 0) {
                // Add found elements to our collection
                groupElements.push(...foundInGroup);
                
                // Keep track of which section had the most elements
                sectionCounts[sectionKey] += foundInGroup.length;
                
                // Remove empty groups
                if (element.children.length === 0) {
                  section.elements.splice(i, 1);
                  i--;
                }
                
                // Update the primary section if this one has more elements
                if (!primarySection || foundInGroup.length > sectionCounts[primarySection.id]) {
                  primarySection = section;
                }
              }
            }
          }
          
          elementsToGroup.push(...groupElements);
        }
        
        // If we didn't find any elements, return the original state
        if (elementsToGroup.length === 0) {
          console.log('No elements found to group');
          return state;
        }
        
        // Find the section with the most elements to put the group in
        let targetSection: SectionType = 'body'; // Default to body
        let maxCount = 0;
        
        for (const [section, count] of Object.entries(sectionCounts)) {
          if (count > maxCount) {
            maxCount = count;
            targetSection = section as SectionType;
          }
    }
        
        // Determine the best layout for the new group based on the elements being grouped
        // and the parent section's layout
        const determineOptimalLayout = (): SectionLayout => {
          // Check if all elements being grouped share common layout properties
          let allAreGroups = true;
          let commonDirection: FlexDirection | null = null;
          let commonWrap: FlexWrap | null = null;
          let commonJustifyContent: JustifyContent | null = null;
          let commonAlignItems: AlignItems | null = null;
          let commonAlignContent: AlignContent | null = null;
          let commonGap: string | null = null;
          
          // Check if elements have consistent layout properties
          for (const el of elementsToGroup) {
            if (el.type !== 'group' || !el.layout) {
              allAreGroups = false;
              break;
            }
            
            if (commonDirection === null) {
              commonDirection = el.layout.direction;
            } else if (commonDirection !== el.layout.direction) {
              commonDirection = null;
              break;
            }
            
            if (commonWrap === null) {
              commonWrap = el.layout.wrap;
            } else if (commonWrap !== el.layout.wrap) {
              commonWrap = null;
              break;
            }
            
            if (commonJustifyContent === null) {
              commonJustifyContent = el.layout.justifyContent;
            } else if (commonJustifyContent !== el.layout.justifyContent) {
              commonJustifyContent = null;
              break;
            }
            
            if (commonAlignItems === null) {
              commonAlignItems = el.layout.alignItems;
            } else if (commonAlignItems !== el.layout.alignItems) {
              commonAlignItems = null;
              break;
            }
            
            if (commonAlignContent === null) {
              commonAlignContent = el.layout.alignContent;
            } else if (commonAlignContent !== el.layout.alignContent) {
              commonAlignContent = null;
              break;
            }
            
            if (commonGap === null) {
              commonGap = el.layout.gap;
            } else if (commonGap !== el.layout.gap) {
              commonGap = null;
              break;
            }
          }
          
          // If all elements are groups with consistent layout, use that layout
          if (allAreGroups && commonDirection) {
            return {
              direction: commonDirection || 'row',
              wrap: commonWrap || 'nowrap',
              justifyContent: commonJustifyContent || 'flex-start',
              alignItems: commonAlignItems || 'center',
              alignContent: commonAlignContent || 'flex-start',
              gap: commonGap || '8px'
            };
          }
          
          // Otherwise, inherit from the parent section
          if (primarySection && primarySection.layout) {
            return { ...primarySection.layout };
          }
          
          // Fall back to default if nothing else works
          return getDefaultGroupLayout();
        };
    
    // Create a new group element
        const newGroupId = uuidv4();
        const newGroup: QuizElement = {
          id: newGroupId,
          type: 'group' as ElementType,
          content: `Group (${elementsToGroup.length} items)`,
          styles: getGroupedElementStyles(),
          sectionId: targetSection,
      isGroup: true,
          children: elementsToGroup.map(el => ({
            ...el,
            groupId: newGroupId, // Set the groupId of children
            sectionId: targetSection // Update sectionId to match the group
          })),
          attributes: {},
          // Use optimal layout based on context
          layout: determineOptimalLayout()
        };
        
        // Add the new group to the target section
        currentScreen.sections[targetSection].elements.push(newGroup);
        
        // Update selected element to be the new group
        newState.selectedElementIds = [newGroupId];
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
        console.log(`Created group ${newGroupId} with ${elementsToGroup.length} elements in ${targetSection} section`);
    return newState;
  }),
  
      ungroupElements: (groupId: string) => set((state) => {
        const { quiz } = state;
        console.log('Ungrouping elements from group:', groupId);
        
        // Deep clone the state to avoid mutations
    const newState = JSON.parse(JSON.stringify(state));
        const currentScreenIndex = quiz.currentScreenIndex;
        const currentScreen = newState.quiz.screens[currentScreenIndex];
        
        // Track if the group was found and ungrouped
        let groupFound = false;
        let childrenToSelect: string[] = [];
        
        // Helper function to recursively find and ungroup nested groups
        const findAndUngroupNestedGroup = (parentGroup: QuizElement, targetGroupId: string): boolean => {
          if (!parentGroup.isGroup || !parentGroup.children) return false;
          
          // Check if any direct child is the target group
          for (let i = 0; i < parentGroup.children.length; i++) {
            const child = parentGroup.children[i];
            
            if (child.id === targetGroupId && child.isGroup && child.children) {
              // Found the group to ungroup
              
              // Remember child elements for selection
              childrenToSelect = child.children.map((c: QuizElement) => c.id);
              
              // Remove group ID from all children
              const ungroupedChildren = child.children.map((c: QuizElement) => ({
                ...c,
                groupId: parentGroup.id // New parent is this group
              }));
              
              // Replace the group with its children in the parent's array
              const newChildren = [
                ...parentGroup.children.slice(0, i),
                ...ungroupedChildren,
                ...parentGroup.children.slice(i + 1)
              ];
              
              parentGroup.children = newChildren;
              return true;
            }
            
            // If this child is a group, check recursively
            if (child.isGroup && child.children) {
              const foundInNested = findAndUngroupNestedGroup(child, targetGroupId);
              if (foundInNested) return true;
            }
          }
          
          return false;
        };
        
        // First try to find the group directly in sections
        for (const sectionKey of Object.keys(currentScreen.sections) as SectionType[]) {
          if (groupFound) break;
          
          const section = currentScreen.sections[sectionKey];
          const groupIndex = section.elements.findIndex((el: QuizElement) => el.id === groupId);
          
          if (groupIndex !== -1) {
            // Found the group in this section
            const group = section.elements[groupIndex];
            
            if (group.isGroup && group.children && group.children.length > 0) {
              // Remember child elements for selection
              childrenToSelect = group.children.map((c: QuizElement) => c.id);
              
              // Remove group ID from all children
              const ungroupedChildren = group.children.map((c: QuizElement) => ({
                ...c,
                groupId: undefined, // No longer in a group
                sectionId: section.id // Ensure they have the correct section ID
              }));
              
              // Replace the group with its children in the section
              section.elements.splice(groupIndex, 1, ...ungroupedChildren);
              groupFound = true;
              break;
            }
          }
          
          // If not found directly, check groups in this section
          if (!groupFound) {
            for (const element of section.elements) {
              if (element.isGroup && element.children) {
                if (findAndUngroupNestedGroup(element, groupId)) {
                  groupFound = true;
                  break;
                }
              }
            }
          }
        }
        
        if (!groupFound) {
          console.log(`Group ${groupId} not found`);
          return state;
        }
        
        // Update selected elements to be the children from the ungrouped element
        newState.selectedElementIds = childrenToSelect;
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
        console.log(`Ungrouped ${childrenToSelect.length} elements from group ${groupId}`);
    return newState;
  }),
  
      updateGroupStyles: (groupId: string, styles: Partial<Record<string, string>>) => set((state) => {
        const { quiz } = state;
        console.log('Updating group styles:', { groupId, styles });
        
        // Deep clone the state to avoid mutations
    const newState = JSON.parse(JSON.stringify(state));
        const currentScreenIndex = quiz.currentScreenIndex;
        const currentScreen = newState.quiz.screens[currentScreenIndex];
        
        // Track if the group was found and updated
        let groupFound = false;
        
        // Helper function to recursively find and update a group
        const findAndUpdateGroupStyles = (elements: QuizElement[], targetGroupId: string): boolean => {
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            // Check if this is the target group
            if (element.id === targetGroupId && element.isGroup) {
              // Get existing theme styles or initialize empty array
              const themeStyles = element.themeStyles ? [...element.themeStyles] : [];
              
              // Remove any style keys from themeStyles that are being manually updated
              Object.keys(styles).forEach(styleKey => {
                const index = themeStyles.indexOf(styleKey);
                if (index !== -1) {
                  themeStyles.splice(index, 1);
                }
              });
              
              // Update the styles, preserving existing ones
              element.styles = {
                ...element.styles,
                ...styles
              };
              
              // Update themeStyles
              element.themeStyles = themeStyles;
              return true;
            }
            
            // If this is a group, check its children
            if (element.isGroup && element.children) {
              const found = findAndUpdateGroupStyles(element.children, targetGroupId);
              if (found) return true;
            }
          }
          
          return false;
        };
        
        // Look for the group in all sections
        for (const sectionKey of Object.keys(currentScreen.sections) as SectionType[]) {
          const section = currentScreen.sections[sectionKey];
          
          groupFound = findAndUpdateGroupStyles(section.elements, groupId);
          if (groupFound) break;
        }
        
        // If the group wasn't found, return the original state
        if (!groupFound) {
          console.log(`Group ${groupId} not found for style update`);
          return state;
    }
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
        console.log(`Updated styles for group ${groupId}`);
    return newState;
  }),
  
      updateGroupLayout: (groupId: string, layout: Partial<SectionLayout>) => set((state) => {
        const { quiz } = state;
        console.log('Updating group layout:', { groupId, layout });
        
        // Deep clone the state to avoid mutations
    const newState = JSON.parse(JSON.stringify(state));
        const currentScreenIndex = quiz.currentScreenIndex;
        const currentScreen = newState.quiz.screens[currentScreenIndex];
        
        // Track if the group was found and updated
        let groupFound = false;
        
        // Helper function to recursively find and update a group
        const findAndUpdateGroupLayout = (elements: QuizElement[], targetGroupId: string): boolean => {
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            // Check if this is the target group
            if (element.id === targetGroupId && element.isGroup) {
              // Initialize layout if it doesn't exist
              if (!element.layout) {
                element.layout = {
                  direction: 'row',
                  wrap: 'nowrap',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  alignContent: 'flex-start',
                  gap: '8px'
                };
              }
              
              // Update the layout, preserving existing properties
              element.layout = {
                ...element.layout,
                ...layout
              };
              return true;
            }
            
            // If this is a group, check its children
            if (element.isGroup && element.children) {
              const found = findAndUpdateGroupLayout(element.children, targetGroupId);
              if (found) return true;
            }
          }
          
          return false;
        };
        
        // Look for the group in all sections
        for (const sectionKey of Object.keys(currentScreen.sections) as SectionType[]) {
          const section = currentScreen.sections[sectionKey];
          
          groupFound = findAndUpdateGroupLayout(section.elements, groupId);
          if (groupFound) break;
        }
        
        // If the group wasn't found, return the original state
        if (!groupFound) {
          console.log(`Group ${groupId} not found for layout update`);
          return state;
    }
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
        console.log(`Updated layout for group ${groupId}`);
    return newState;
  }),
  
      reorderElement: (elementId: string, direction: 'up' | 'down' | 'left' | 'right') => set((state) => {
        const { quiz } = state;
        const currentScreenIndex = quiz.currentScreenIndex;
        const currentScreen = quiz.screens[currentScreenIndex];
        
        // Deep clone the state to avoid mutations
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
        let elementReordered = false;
        
        // Helper function to swap elements in an array
        const swapElements = (arr: any[], index1: number, index2: number) => {
          if (index1 < 0 || index1 >= arr.length || index2 < 0 || index2 >= arr.length) {
            return false;
          }
          const temp = arr[index1];
          arr[index1] = arr[index2];
          arr[index2] = temp;
          return true;
        };
        
        // Helper function to determine the new index based on direction
        const getNewIndex = (currentIndex: number, totalItems: number, direction: 'up' | 'down' | 'left' | 'right') => {
          // For simplicity, treat left same as up, and right same as down
          // This allows the function to work with both row and column layouts
          if (direction === 'up' || direction === 'left') {
            return Math.max(0, currentIndex - 1);
          } else {
            return Math.min(totalItems - 1, currentIndex + 1);
          }
        };
        
        // Recursive function to reorder an element in a group
        const reorderElementInGroup = (group: QuizElement, targetId: string, direction: 'up' | 'down' | 'left' | 'right'): boolean => {
          if (!group.isGroup || !group.children) return false;
          
          // Check if element is direct child of this group
          const elementIndex = group.children.findIndex((child: QuizElement) => child.id === targetId);
          if (elementIndex !== -1) {
            // Found the element, reorder it
            const newIndex = getNewIndex(elementIndex, group.children.length, direction);
            return swapElements(group.children, elementIndex, newIndex);
          }
          
          // If not found directly, check nested groups
          for (let i = 0; i < group.children.length; i++) {
            const child = group.children[i];
            if (child.isGroup && child.children) {
              const reordered = reorderElementInGroup(child, targetId, direction);
              if (reordered) return true;
            }
          }
          
          return false;
        };
        
        // First try to reorder the element directly in sections
        for (const sectionKey of Object.keys(newScreen.sections) as SectionType[]) {
          const section = newScreen.sections[sectionKey];
          const elementIndex = section.elements.findIndex((element: QuizElement) => element.id === elementId);
      
      if (elementIndex !== -1) {
            // Found the element in this section, reorder it
            const newIndex = getNewIndex(elementIndex, section.elements.length, direction);
            elementReordered = swapElements(section.elements, elementIndex, newIndex);
        break;
      }
    }
    
        // If not found directly in sections, check inside groups
        if (!elementReordered) {
          for (const sectionKey of Object.keys(newScreen.sections) as SectionType[]) {
            if (elementReordered) break;
            
            const section = newScreen.sections[sectionKey];
            
            // Check each group in the section
            for (let i = 0; i < section.elements.length; i++) {
              const element: QuizElement = section.elements[i];
              
              if (element.isGroup && element.children) {
                elementReordered = reorderElementInGroup(element, elementId, direction);
                if (elementReordered) break;
              }
            }
          }
        }
        
        // Save to history if the element was reordered
        if (elementReordered) {
          get().saveToHistory(newState.quiz);
          return newState;
        }
        
        return state;
      }),
      
      // Theme actions
      updateTheme: (themeSettings: Partial<ThemeSettings>) => {
        const { quiz } = get();
        const theme = { ...(quiz.theme || defaultTheme), ...themeSettings };
        
        // Create a new quiz with updated theme
        const updatedQuiz = {
          ...quiz,
          theme
        };
        
        // Also update the theme in the themes array if activeThemeId is present
        if (quiz.activeThemeId && quiz.themes) {
          const updatedThemes = quiz.themes.map(t => 
            t.id === quiz.activeThemeId 
              ? { ...t, settings: theme } 
              : t
          );
          
          updatedQuiz.themes = updatedThemes;
        }
        
        // Apply the updated theme to all elements
        set({ quiz: updatedQuiz });
        debouncedSaveQuizToStorage(updatedQuiz);
        
        // Apply the updated theme to all elements and sections
        const updatedQuizWithThemedElements = get().applyThemeToAllElements(updatedQuiz);
        
        set({ quiz: updatedQuizWithThemedElements });
        debouncedSaveQuizToStorage(updatedQuizWithThemedElements);
        get().saveToHistory(updatedQuizWithThemedElements);
      },
      
      applyThemeToAllElements: (quizToUpdate = get().quiz) => {
        const theme = quizToUpdate.theme || defaultTheme;
        const updatedQuiz = safeClone(quizToUpdate);
        
        // Recursive function to update elements in groups
        const updateElementsRecursively = (elements: QuizElement[]): QuizElement[] => {
          return elements.map(element => {
            // Initialize variables at the beginning of the function
            let updatedStyles = { ...element.styles };
            let updatedThemeStyles = element.themeStyles ? [...element.themeStyles] : [];
            let updatedChildren: QuizElement[] | undefined = undefined;
            
            // Skip elements with style classes - they use their own styles
            if (element.styleClass) {
              // If this is a group, we still need to process its children
              if (element.isGroup && element.children) {
                updatedChildren = updateElementsRecursively(element.children);
              }
              
              return {
                ...element,
                children: updatedChildren || element.children
              };
            }
            
            // Define theme properties to apply based on element type
            const themeProps: Record<string, { value: string, applyTo: ElementType[] }> = {
              backgroundColor: { 
                value: theme.primaryColor, 
                applyTo: ['button'] 
              },
              fontFamily: { 
                value: theme.fontFamily, 
                applyTo: ['text', 'button', 'link'] 
              },
              borderRadius: {
                value: theme.cornerRadius,
                applyTo: ['button', 'image']
              }
            };
            
            // Add font size properties based on theme size
            if (element.type === 'text' && sizeMappings.fontSize.text[theme.size]) {
              themeProps.fontSize = {
                value: sizeMappings.fontSize.text[theme.size],
                applyTo: ['text']
              };
            } else if (element.type === 'button' && sizeMappings.fontSize.button[theme.size]) {
              themeProps.fontSize = {
                value: sizeMappings.fontSize.button[theme.size],
                applyTo: ['button']
              };
            } else if (element.type === 'link' && sizeMappings.fontSize.link[theme.size]) {
              themeProps.fontSize = {
                value: sizeMappings.fontSize.link[theme.size],
                applyTo: ['link']
              };
            }
            
            // Add width for text and button elements based on theme size
            if (element.type === 'text' && sizeMappings.width.text[theme.size]) {
              themeProps.width = {
                value: sizeMappings.width.text[theme.size],
                applyTo: ['text']
              };
            } else if (element.type === 'button' && sizeMappings.width.button[theme.size]) {
              themeProps.width = {
                value: sizeMappings.width.button[theme.size],
                applyTo: ['button']
              };
            }
            
            // Add padding for buttons based on theme size
            if (element.type === 'button' && sizeMappings.padding.button[theme.size]) {
              themeProps.padding = {
                value: sizeMappings.padding.button[theme.size],
                applyTo: ['button']
              };
            }
            
            // Apply each theme property if applicable to this element type and not manually overridden
            Object.entries(themeProps).forEach(([prop, { value, applyTo }]) => {
              if (applyTo.includes(element.type) && !hasManualStyleOverride(element, prop)) {
                updatedStyles[prop] = value;
                
                // Add to themeStyles if not already there
                if (!updatedThemeStyles.includes(prop)) {
                  updatedThemeStyles.push(prop);
                }
              }
            });
            
            // If this is a group, recursively update its children
            if (element.isGroup && element.children) {
              updatedChildren = updateElementsRecursively(element.children);
            }
            
            return {
              ...element,
              styles: updatedStyles,
              themeStyles: updatedThemeStyles,
              children: updatedChildren || element.children
            };
          });
        };
        
        // Apply theme to all screens
        updatedQuiz.screens = updatedQuiz.screens.map(screen => {
          // Update sections in this screen
          const updatedSections = Object.entries(screen.sections).reduce((acc, [sectionId, section]) => {
            // Apply theme to section background
            const updatedSectionStyles = {
              ...section.styles,
              backgroundColor: theme.backgroundColor
            };
            
            // Apply theme to elements in this section including nested elements
            const updatedElements = updateElementsRecursively(section.elements);
            
            acc[sectionId as SectionType] = {
              ...section,
              styles: updatedSectionStyles,
              elements: updatedElements
            };
            
            return acc;
          }, {} as Record<SectionType, QuizSection>);
          
          return {
            ...screen,
            sections: updatedSections
          };
        });
        
        return updatedQuiz;
      },
      
      applyThemeToElements: (options = {}) => {
        const { quiz, selectedElementIds } = get();
        const theme = quiz.theme || defaultTheme;
        
        // Determine which elements to update
        const elementsToUpdate = options.elementIds || selectedElementIds;
        if (elementsToUpdate.length === 0) return; // No elements to update
        
        // Create a clone of the quiz
        const updatedQuiz = safeClone(quiz);
        
        // Whether to reset all theme-related styles (bypass hasManualStyleOverride checks)
        const resetAll = options.resetAll || false;
        
        // Recursive function to update specific elements in a group
        const updateSpecificElementsInGroup = (elements: QuizElement[], targetIds: string[]): QuizElement[] => {
          return elements.map(element => {
            // Initialize variables at the beginning of the function
            let updatedStyles = { ...element.styles };
            let updatedThemeStyles = element.themeStyles ? [...element.themeStyles] : [];
            let updatedChildren: QuizElement[] | undefined = undefined;
            
            // Check if this element should be updated
            if (targetIds.includes(element.id)) {
              // Skip elements with style classes - they use their own styles
              if (element.styleClass && !resetAll) {
                // If this is a group, we still need to process its children
                if (element.isGroup && element.children) {
                  updatedChildren = updateSpecificElementsInGroup(element.children, targetIds);
                }
                
                return {
                  ...element,
                  children: updatedChildren || element.children
                };
              }

              // Define theme properties to apply based on element type
              const themeProps: Record<string, { value: string, applyTo: ElementType[] }> = {
                backgroundColor: { 
                  value: theme.primaryColor, 
                  applyTo: ['button'] 
                },
                fontFamily: { 
                  value: theme.fontFamily, 
                  applyTo: ['text', 'button', 'link'] 
                },
                borderRadius: {
                  value: theme.cornerRadius,
                  applyTo: ['button', 'image']
                }
              };
              
              // Add font size properties based on theme size
              if (element.type === 'text' && sizeMappings.fontSize.text[theme.size]) {
                themeProps.fontSize = {
                  value: sizeMappings.fontSize.text[theme.size],
                  applyTo: ['text']
                };
              } else if (element.type === 'button' && sizeMappings.fontSize.button[theme.size]) {
                themeProps.fontSize = {
                  value: sizeMappings.fontSize.button[theme.size],
                  applyTo: ['button']
                };
              } else if (element.type === 'link' && sizeMappings.fontSize.link[theme.size]) {
                themeProps.fontSize = {
                  value: sizeMappings.fontSize.link[theme.size],
                  applyTo: ['link']
                };
              }
              
              // Add width for text and button elements based on theme size
              if (element.type === 'text' && sizeMappings.width.text[theme.size]) {
                themeProps.width = {
                  value: sizeMappings.width.text[theme.size],
                  applyTo: ['text']
                };
              } else if (element.type === 'button' && sizeMappings.width.button[theme.size]) {
                themeProps.width = {
                  value: sizeMappings.width.button[theme.size],
                  applyTo: ['button']
                };
              }
              
              // Add padding for buttons based on theme size
              if (element.type === 'button' && sizeMappings.padding.button[theme.size]) {
                themeProps.padding = {
                  value: sizeMappings.padding.button[theme.size],
                  applyTo: ['button']
                };
              }
              
              // Apply each theme property if applicable to this element type
              // And either bypass the manual override check when resetting all styles OR check for overrides normally
              Object.entries(themeProps).forEach(([prop, { value, applyTo }]) => {
                if (applyTo.includes(element.type) && (resetAll || !hasManualStyleOverride(element, prop))) {
                  updatedStyles[prop] = value;
                  
                  // Add to themeStyles if not already there
                  if (!updatedThemeStyles.includes(prop)) {
                    updatedThemeStyles.push(prop);
                  }
                }
              });
            }
            
            // If this is a group, recursively check its children
            if (element.isGroup && element.children) {
              updatedChildren = updateSpecificElementsInGroup(element.children, targetIds);
            }
            
            return {
              ...element,
              styles: updatedStyles,
              themeStyles: updatedThemeStyles,
              children: updatedChildren || element.children
            };
          });
        };
        
        // Update elements in each screen
        updatedQuiz.screens = updatedQuiz.screens.map(screen => {
          // Create a copy of the sections
          const updatedSections = { ...screen.sections };
          
          // Update elements in each section
          for (const sectionId of Object.keys(updatedSections) as SectionType[]) {
            const section = updatedSections[sectionId];
            section.elements = updateSpecificElementsInGroup(section.elements, elementsToUpdate);
          }
          
          return {
            ...screen,
            sections: updatedSections
          };
        });
        
        // Update the quiz state with the updated quiz
        set({ quiz: updatedQuiz });
        
        // Save to history
        get().saveToHistory(updatedQuiz);
      },
      
      applyThemeToSections: (options = {}) => {
        const { quiz } = get();
        const theme = quiz.theme || defaultTheme;
        
        // Determine which sections to update
        const sectionsToUpdate = options.sectionIds || ['header', 'body', 'footer'] as SectionType[];
        if (sectionsToUpdate.length === 0) return; // No sections to update
        
        // Create a clone of the quiz
        const updatedQuiz = safeClone(quiz);
        
        // Apply to all screens for consistency
        updatedQuiz.screens = updatedQuiz.screens.map(screen => {
          // Update each specified section
          sectionsToUpdate.forEach(sectionId => {
            if (screen.sections[sectionId]) {
              screen.sections[sectionId] = {
                ...screen.sections[sectionId],
                styles: {
                  ...screen.sections[sectionId].styles,
                  backgroundColor: theme.backgroundColor
                }
              };
            }
          });
          
          return screen;
        });
        
        set({ quiz: updatedQuiz });
        debouncedSaveQuizToStorage(updatedQuiz);
        get().saveToHistory(updatedQuiz);
      },
      
      switchTheme: (themeId: string) => {
        set((state) => {
          const theme = state.quiz.themes?.find(t => t.id === themeId);
          if (!theme) return state;

          const newQuiz = { ...state.quiz, theme: theme.settings, activeThemeId: themeId };
          // Apply the theme to all elements
          const updatedQuiz = get().applyThemeToAllElements(newQuiz);
          return { quiz: updatedQuiz };
        });
      },

      saveBackgroundColor: (screenId: string, elementOrSectionId: string, color: string) => {
        set((state) => {
          const key = `${screenId}-${elementOrSectionId}`;
          return {
            backgroundColors: {
              ...state.backgroundColors,
              [key]: color
            }
          };
        });
      },

      restoreBackgroundColor: (screenId: string, elementOrSectionId: string) => {
        set((state) => {
          const key = `${screenId}-${elementOrSectionId}`;
          const previousColor = state.backgroundColors[key];
          const themeColor = state.quiz.theme?.backgroundColor || '#ffffff';

          const newQuiz = { ...state.quiz };
          
          // First try to find and update a section
          const screen = newQuiz.screens.find(s => s.id === screenId);
          if (screen) {
            // Check if it's a section ID
            if (elementOrSectionId in screen.sections) {
              const section = screen.sections[elementOrSectionId as SectionType];
              if (section) {
                section.styles = {
                  ...section.styles,
                  backgroundColor: previousColor || themeColor
                };
                return { quiz: newQuiz };
              }
            }
            
            // If not a section, look for a group element
            for (const sectionId of Object.keys(screen.sections) as SectionType[]) {
              const section = screen.sections[sectionId];
              const updateGroupBackground = (elements: QuizElement[]): boolean => {
                for (const element of elements) {
                  if (element.id === elementOrSectionId) {
                    element.styles = {
                      ...element.styles,
                      backgroundColor: previousColor || themeColor
                    };
                    return true;
                  }
                  if (element.isGroup && element.children) {
                    if (updateGroupBackground(element.children)) {
                      return true;
                    }
                  }
                }
                return false;
              };
              
              if (updateGroupBackground(section.elements)) {
                return { quiz: newQuiz };
              }
            }
          }

          return { quiz: newQuiz };
        });
      },
      
      // View actions
      setViewMode: (mode: ViewMode) => set((state) => {
        console.log('Setting view mode in store:', mode);
        console.log('View mode set in store:', mode);
        return {
          viewMode: mode,
        };
      }),

      updateCodeView: (html: string, css: string) => set((state) => ({
        codeView: {
          html,
          css,
        }
      })),

      renameScreen: (screenId: string, newName: string) => set((state) => {
        const screenIndex = state.quiz.screens.findIndex(screen => screen.id === screenId);
        if (screenIndex === -1) return state;
        
        const updatedScreens = [...state.quiz.screens];
        updatedScreens[screenIndex] = {
          ...updatedScreens[screenIndex],
          name: newName
        };
        
        const updatedQuiz = {
          ...state.quiz,
          screens: updatedScreens
        };
        
        get().saveToHistory(updatedQuiz);
        
        return {
          quiz: updatedQuiz
        };
      }),

      duplicateScreen: (screenId: string) => set((state) => {
        const screenIndex = state.quiz.screens.findIndex(screen => screen.id === screenId);
        if (screenIndex === -1) return state;
        
        // Deep clone the screen to duplicate
        const screenToDuplicate = JSON.parse(JSON.stringify(state.quiz.screens[screenIndex]));
        
        // Create a new screen with a new ID
        const duplicatedScreen: QuizScreen = {
          ...screenToDuplicate,
          id: uuidv4(),
          name: `${screenToDuplicate.name} (Copy)`
        };
        
        // Insert the duplicated screen right after the original screen
        const updatedScreens = [...state.quiz.screens];
        updatedScreens.splice(screenIndex + 1, 0, duplicatedScreen);
        
        const updatedQuiz = {
          ...state.quiz,
          screens: updatedScreens,
          currentScreenIndex: screenIndex + 1 // Set the duplicated screen as the current screen
        };
        
        get().saveToHistory(updatedQuiz);
        
        return {
          quiz: updatedQuiz
        };
      }),

      // Style Class actions
      createStyleClass: (name: string, elementType: ElementType, styles: ElementStyle) => {
        const { quiz } = get();
        const updatedQuiz = safeClone(quiz);
        
        // Initialize styleClasses array if it doesn't exist
        if (!updatedQuiz.styleClasses) {
          updatedQuiz.styleClasses = [];
        }
        
        // Create a new style class
        const newClass = {
          id: uuidv4(),
          name,
          elementType,
          styles
        };
        
        updatedQuiz.styleClasses.push(newClass);
        
        set({ quiz: updatedQuiz });
        debouncedSaveQuizToStorage(updatedQuiz);
        get().saveToHistory(updatedQuiz);
        
        return newClass.id;
      },
      
      updateStyleClass: (classId: string, updates: Partial<StyleClass>) => {
        const { quiz } = get();
        const updatedQuiz = safeClone(quiz);
        
        if (!updatedQuiz.styleClasses) return;
        
        // Find and update the class
        updatedQuiz.styleClasses = updatedQuiz.styleClasses.map(styleClass => 
          styleClass.id === classId 
            ? { ...styleClass, ...updates } 
            : styleClass
        );
        
        // Update any elements using this class to reflect the changes
        const updateElementsWithClass = (elements: QuizElement[]): QuizElement[] => {
          return elements.map(element => {
            // If this element uses the class we're updating
            if (element.styleClass === classId) {
              // Find the updated class
              const updatedClass = updatedQuiz.styleClasses?.find(c => c.id === classId);
              if (updatedClass && updatedClass.elementType === element.type) {
                return {
                  ...element,
                  styles: { ...updatedClass.styles }
                };
              }
            }
            
            // Recursively update children if this is a group
            if (element.isGroup && element.children) {
              return {
                ...element,
                children: updateElementsWithClass(element.children)
              };
            }
            
            return element;
          });
        };
        
        // Update elements in all screens and sections
        updatedQuiz.screens = updatedQuiz.screens.map(screen => {
          const updatedSections = { ...screen.sections };
          
          for (const sectionId of Object.keys(updatedSections) as SectionType[]) {
            const section = updatedSections[sectionId];
            section.elements = updateElementsWithClass(section.elements);
          }
          
          return {
            ...screen,
            sections: updatedSections
          };
        });
        
        set({ quiz: updatedQuiz });
        debouncedSaveQuizToStorage(updatedQuiz);
        get().saveToHistory(updatedQuiz);
      },
      
      deleteStyleClass: (classId: string) => {
        const { quiz } = get();
        const updatedQuiz = safeClone(quiz);
        
        if (!updatedQuiz.styleClasses) return;
        
        // Remove the class
        updatedQuiz.styleClasses = updatedQuiz.styleClasses.filter(c => c.id !== classId);
        
        // Remove references to this class from elements
        const removeClassFromElements = (elements: QuizElement[]): QuizElement[] => {
          return elements.map(element => {
            // If this element uses the class we're deleting
            if (element.styleClass === classId) {
              // Remove the class reference but keep the styles
              const { styleClass, ...rest } = element;
              return rest;
            }
            
            // Recursively update children if this is a group
            if (element.isGroup && element.children) {
              return {
                ...element,
                children: removeClassFromElements(element.children)
              };
            }
            
            return element;
          });
        };
        
        // Update elements in all screens and sections
        updatedQuiz.screens = updatedQuiz.screens.map(screen => {
          const updatedSections = { ...screen.sections };
          
          for (const sectionId of Object.keys(updatedSections) as SectionType[]) {
            const section = updatedSections[sectionId];
            section.elements = removeClassFromElements(section.elements);
          }
          
          return {
            ...screen,
            sections: updatedSections
          };
        });
        
        set({ quiz: updatedQuiz });
        debouncedSaveQuizToStorage(updatedQuiz);
        get().saveToHistory(updatedQuiz);
      },
      
      applyStyleClass: (elementIds: string[], classId: string) => {
        const { quiz } = get();
        const updatedQuiz = safeClone(quiz);
        
        if (!updatedQuiz.styleClasses) return;
        
        // Find the class we want to apply
        const styleClass = updatedQuiz.styleClasses.find(c => c.id === classId);
        if (!styleClass) return;
        
        // Apply the class to specified elements
        const applyClassToElements = (elements: QuizElement[], targetIds: string[]): QuizElement[] => {
          return elements.map(element => {
            // If this element is in the target list
            if (targetIds.includes(element.id)) {
              // Only apply if the element type matches the class's intended type
              if (element.type === styleClass.elementType) {
                return {
                  ...element,
                  styles: { ...styleClass.styles },
                  styleClass: classId
                };
              }
            }
            
            // Recursively check children if this is a group
            if (element.isGroup && element.children) {
              return {
                ...element,
                children: applyClassToElements(element.children, targetIds)
              };
            }
            
            return element;
          });
        };
        
        // Update elements in all screens and sections
        updatedQuiz.screens = updatedQuiz.screens.map(screen => {
          const updatedSections = { ...screen.sections };
          
          for (const sectionId of Object.keys(updatedSections) as SectionType[]) {
            const section = updatedSections[sectionId];
            section.elements = applyClassToElements(section.elements, elementIds);
          }
          
          return {
            ...screen,
            sections: updatedSections
          };
        });
        
        set({ quiz: updatedQuiz });
        debouncedSaveQuizToStorage(updatedQuiz);
        get().saveToHistory(updatedQuiz);
      },
      
      removeStyleClass: (elementIds: string[]) => {
        const { quiz } = get();
        const updatedQuiz = safeClone(quiz);
        
        // Remove class from specified elements
        const removeClassFromElements = (elements: QuizElement[], targetIds: string[]): QuizElement[] => {
          return elements.map(element => {
            // If this element is in the target list and has a style class
            if (targetIds.includes(element.id) && element.styleClass) {
              // Create a new element without the styleClass property
              const { styleClass, ...rest } = element;
              return rest;
            }
            
            // Recursively check children if this is a group
            if (element.isGroup && element.children) {
              return {
                ...element,
                children: removeClassFromElements(element.children, targetIds)
              };
            }
            
            return element;
          });
        };
        
        // Update elements in all screens and sections
        updatedQuiz.screens = updatedQuiz.screens.map(screen => {
          const updatedSections = { ...screen.sections };
          
          for (const sectionId of Object.keys(updatedSections) as SectionType[]) {
            const section = updatedSections[sectionId];
            section.elements = removeClassFromElements(section.elements, elementIds);
          }
          
          return {
            ...screen,
            sections: updatedSections
          };
        });
        
        set({ quiz: updatedQuiz });
        debouncedSaveQuizToStorage(updatedQuiz);
        get().saveToHistory(updatedQuiz);
      },
    }),
    {
      name: 'quiz-builder-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        quizList: state.quizList
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const quizId = localStorage.getItem('lastActiveQuizId');
          if (quizId) {
            state.loadQuiz(quizId);
          }
        }
      }
    }
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