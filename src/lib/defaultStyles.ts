import { ElementType, SectionLayout, FlexDirection, FlexWrap, JustifyContent, AlignItems, AlignContent } from "@/types";

type StyleMap = Record<string, string>;

// Default styles for each element type
const elementStyles: Record<ElementType, StyleMap> = {
  button: {
    padding: '8px 16px',
    borderRadius: '4px',
    backgroundColor: '#000000',
    color: 'white',
    fontSize: '16px',
    fontWeight: '400',
    fontFamily: 'Arial, sans-serif',
    cursor: 'pointer',
    textAlign: 'center'
  },
  text: {
    fontSize: '16px',
    color: '#000000',
    fontWeight: '400',
    fontFamily: 'Arial, sans-serif',
    padding: '0px',
    textAlign: 'center'
  },
  image: {
    width: 'auto',
    height: 'auto',
    objectFit: 'cover',
    border: 'none'
  },
  link: {
    color: '#355DF9',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center'
  },
  input: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '100%',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center'
  },
  checkbox: {
    margin: '8px 0',
    textAlign: 'center'
  },
  radio: {
    margin: '8px 0',
    textAlign: 'center'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '100%',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center'
  },
  textarea: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '100%',
    height: '100px',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    resize: 'vertical',
    textAlign: 'center'
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '0px',
    border: '0px solid transparent',
    borderRadius: '4px',
    textAlign: 'center'
  }
};

// Default styles for grouped elements (different from regular group elements)
const groupedElementStyles: StyleMap = {
  width: 'auto',
  padding: '0px',
  border: '0px solid transparent',
  borderRadius: '4px',
  backgroundColor: 'transparent'
};

// Default layout for grouped elements
const defaultGroupLayout: SectionLayout = {
  direction: 'row',
  wrap: 'nowrap',
  justifyContent: 'flex-start',
  alignItems: 'center',
  alignContent: 'flex-start',
  gap: '8px'
};

/**
 * Get default styles for a specific element type
 */
export function getDefaultStylesForType(type: ElementType): StyleMap {
  return elementStyles[type] || {};
}

/**
 * Get default styles for a grouped element (when multiple elements are grouped)
 */
export function getGroupedElementStyles(): StyleMap {
  return { ...groupedElementStyles };
}

/**
 * Get default layout for a grouped element
 */
export function getDefaultGroupLayout(): SectionLayout {
  return { ...defaultGroupLayout };
}

/**
 * Get default content for a specific element type
 */
export function getDefaultContentForType(type: ElementType): string {
  switch (type) {
    case 'button': return 'Button';
    case 'text': return 'New Text';
    case 'link': return 'Link Text';
    case 'checkbox': return 'Checkbox Label';
    case 'radio': return 'Radio Option';
    case 'select': return '<option value="1">Option 1</option><option value="2">Option 2</option>';
    default: return '';
  }
}

/**
 * Get default attributes for a specific element type
 */
export function getDefaultAttributesForType(type: ElementType): Record<string, any> {
  switch (type) {
    case 'image':
      return { src: 'https://via.placeholder.com/100', alt: 'Image' };
    case 'link':
      return { href: '#', target: '_blank' };
    case 'input':
      return { placeholder: 'Enter text...', type: 'text' };
    case 'checkbox':
      return { value: 'option1', checked: false };
    case 'radio':
      return { name: 'radioGroup', value: 'option1' };
    case 'textarea':
      return { placeholder: 'Enter multiple lines of text...' };
    case 'group':
      return { isGroup: true, children: [] };
    default:
      return {};
  }
} 