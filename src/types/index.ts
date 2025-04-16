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

export type Quiz = {
  id: string;
  name: string;
  screens: QuizScreen[];
  currentScreenIndex: number;
  lastEdited?: string; // ISO string for when the quiz was last edited
  theme?: ThemeSettings; // Currently active theme settings
  themes?: ThemeItem[]; // List of saved themes
  activeThemeId?: string; // ID of the active theme
};

// Theme settings that can be applied globally
export type ThemeSettings = {
  primaryColor: string; // Used for buttons, active elements, etc.
  fontFamily: string; // Default font for all text elements
  backgroundColor: string; // Default background for sections
}; 