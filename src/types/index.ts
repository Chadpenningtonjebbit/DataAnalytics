export type ElementType = 
  | 'text' 
  | 'button'
  | 'image'
  | 'link'
  | 'input'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'textarea'
  | 'product'
  | 'group';

export type ViewMode = 'desktop' | 'tablet' | 'mobile';

export type SectionType = 'header' | 'body' | 'footer';

export type ElementStyle = {
  width?: string;
  height?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  boxShadow?: string;
  textShadow?: string;
  [key: string]: string | undefined;
};

export type QuizElement = {
  id: string;
  type: ElementType;
  content: string;
  styles: ElementStyle;
  attributes: Record<string, string>;
  sectionId: SectionType;
  children?: QuizElement[];
  isGroup?: boolean;
  groupId?: string;
  layout?: SectionLayout;
  position?: {
    x: number;
    y: number;
  };
  themeStyles?: string[]; // Track which styles come from theme
  styleClass?: string; // Reference to a style class
};

// Simplified to only use flexbox
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'nowrap';
export type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
export type AlignContent = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';

export type SectionLayout = {
  direction: FlexDirection;
  wrap: FlexWrap;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
  alignContent: AlignContent;
  gap: string;
};

export type QuizSection = {
  id: SectionType;
  name: string;
  enabled: boolean;
  elements: QuizElement[];
  styles?: Record<string, string>;
  layout: SectionLayout;
};

export type QuizScreen = {
  id: string;
  name: string;
  sections: {
    header: QuizSection;
    body: QuizSection;
    footer: QuizSection;
  };
};

// Theme type to support multiple themes
export type ThemeItem = {
  id: string;
  name: string;
  settings: ThemeSettings;
};

export type StyleClass = {
  id: string;
  name: string;
  elementType: ElementType;
  styles: ElementStyle;
};

export type Quiz = {
  id: string;
  name: string;
  screens: QuizScreen[];
  currentScreenIndex: number;
  lastEdited?: string; // ISO string for when the quiz was last edited
  theme?: ThemeSettings; // Currently active theme settings
  themes?: ThemeItem[]; // List of saved themes
  activeThemeId?: string; // ID of the active theme
  styleClasses?: StyleClass[]; // Custom style classes
  productFeed?: {
    url: string;
    name: string;
  }; // Selected product feed for the experience
  aiSettings?: string; // Experience-wide AI personalization settings
};

// Theme settings that can be applied globally
export type ThemeSettings = {
  primaryColor: string; // Used for buttons, active elements, etc.
  textColor: string; // Default text color for all text elements
  fontFamily: string; // Default font for all text elements
  backgroundColor: string; // Default background for sections
  cornerRadius: string; // Default border radius for elements
  size: 'small' | 'medium' | 'large'; // Size controls for fonts and padding
};

export type QuizListItem = {
  id: string;
  name: string;
  lastEdited: string;
};

export type QuizState = {
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
  history: Quiz[];
  historyIndex: number;
  futureSaves: Quiz[];
  clipboard: QuizElement[];
  backgroundColors: Record<string, string>;
  
  // Quiz management actions
  createQuiz: (name: string) => void;
  loadQuiz: (id: string) => Promise<boolean>;
  deleteQuiz: (id: string) => void;
  saveCurrentQuiz: () => void;
  setQuiz: (quiz: Quiz) => void;
  updateQuiz: (updates: Partial<Quiz>) => void;
  renameQuiz: (id: string, newName: string) => boolean;
  duplicateQuiz: (id: string) => Promise<string | null>;
  
  // Theme actions
  updateTheme: (themeSettings: Partial<ThemeSettings>) => void;
  applyThemeToElements: (options?: { elementIds?: string[], resetAll?: boolean }) => void;
  applyThemeToSections: (options?: { sectionIds?: SectionType[] }) => void;
  applyThemeToAllElements: (quizToUpdate?: Quiz) => Quiz;
  switchTheme: (themeId: string) => void;
  restoreBackgroundColor: (screenId: string, sectionId: SectionType) => void;
}; 