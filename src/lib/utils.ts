import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Quiz, QuizElement, QuizSection, SectionType, QuizScreen } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mapping of critical visual properties that should be applied as inline styles
// for better thumbnail rendering
const criticalStyleProperties = {
  default: ['width', 'height', 'boxShadow', 'textShadow'],
  button: ['width', 'height', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'padding', 'borderRadius', 'color', 'border', 'fontSize', 'fontFamily', 'fontWeight', 'textAlign', 'boxShadow', 'textShadow'],
  text: ['width', 'height', 'color', 'fontSize', 'fontWeight', 'fontFamily', 'textAlign', 'textShadow'],
  image: ['width', 'height', 'objectFit', 'borderRadius', 'border', 'boxShadow'],
  link: ['width', 'height', 'color', 'fontSize', 'fontWeight', 'fontFamily', 'textDecoration', 'textAlign', 'textShadow'],
  group: ['width', 'height', 'padding', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'gap', 'border', 'borderRadius', 'display', 'flexDirection', 'boxShadow']
};

export function generateElementHtml(element: QuizElement): string {
  let html = ''
  
  // Get element-specific critical properties plus default ones
  const elementType = element.type as keyof typeof criticalStyleProperties;
  const propertiesToInclude = [
    ...criticalStyleProperties.default,
    ...(criticalStyleProperties[elementType] || [])
  ];
  
  // Always include typography properties for text-based elements
  if (['text', 'button', 'link'].includes(element.type)) {
    if (!propertiesToInclude.includes('fontSize')) propertiesToInclude.push('fontSize');
    if (!propertiesToInclude.includes('fontFamily')) propertiesToInclude.push('fontFamily');
    if (!propertiesToInclude.includes('fontWeight')) propertiesToInclude.push('fontWeight');
    if (!propertiesToInclude.includes('color')) propertiesToInclude.push('color');
    if (!propertiesToInclude.includes('textAlign')) propertiesToInclude.push('textAlign');
  }
  
  // Extract critical visual properties for inline style
  let inlineStyle: string[] = [];
  propertiesToInclude.forEach(prop => {
    if (element.styles?.[prop]) {
      // Convert camelCase to kebab-case for CSS
      const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      
      // Add px to numeric values for certain properties
      let value = element.styles[prop];
      if (['width', 'height', 'padding', 'margin', 'top', 'right', 'bottom', 'left', 'gap', 'fontSize']
          .includes(prop) && (typeof value === 'number' || /^\d+$/.test(value))) {
        value = `${value}px`;
      }
      
      // Ensure background-image has url() format
      if (prop === 'backgroundImage' && typeof value === 'string' && !value.startsWith('url(')) {
        value = `url(${value})`;
      }
      
      // Replace CSS variables with direct colors
      if (typeof value === 'string' && value.includes('var(--')) {
        if (value.includes('var(--primary)')) {
          value = value.replace(/var\(--primary\)/g, '#355DF9');
        } else if (value.includes('var(--secondary)')) {
          value = value.replace(/var\(--secondary\)/g, '#f8fafc');
        } else if (value.includes('var(--accent)')) {
          value = value.replace(/var\(--accent\)/g, '#f8fafc');
        } else if (value.includes('var(--border)')) {
          value = value.replace(/var\(--border\)/g, '#e2e8f0');
        } else if (value.includes('var(--destructive)')) {
          value = value.replace(/var\(--destructive\)/g, '#ef4444');
        }
      }
      
      inlineStyle.push(`${cssProp}: ${value}`);
    }
  });
  
  // Add max-width: 100% to all elements to prevent overflow
  if (!inlineStyle.some(style => style.startsWith('max-width:'))) {
    inlineStyle.push('max-width: 100%');
  }
  
  // Add defaults for typography properties if not specified
  if (['text', 'button', 'link'].includes(element.type)) {
    if (!element.styles?.fontSize && !inlineStyle.some(s => s.startsWith('font-size:'))) {
      inlineStyle.push('font-size: 16px');
    }
    if (!element.styles?.fontFamily && !inlineStyle.some(s => s.startsWith('font-family:'))) {
      inlineStyle.push('font-family: Arial, sans-serif');
    }
    if (!element.styles?.fontWeight && !inlineStyle.some(s => s.startsWith('font-weight:'))) {
      inlineStyle.push('font-weight: 400');
    }
    if (!element.styles?.color && !inlineStyle.some(s => s.startsWith('color:'))) {
      inlineStyle.push('color: #000000');
    }
    if (!element.styles?.textAlign && !inlineStyle.some(s => s.startsWith('text-align:'))) {
      inlineStyle.push('text-align: center');
    }
  }
  
  // Add critical inline styles for better rendering
  const styleAttr = inlineStyle.length > 0 ? ` style="${inlineStyle.join('; ')}"` : '';
  
  // Generate interaction data attributes
  let interactionAttrs = '';
  
  // Get default action type based on element type
  let defaultActionType = 'none';
  if (element.type === 'button') defaultActionType = 'next-screen';
  if (element.type === 'link') defaultActionType = 'open-url';
  if (element.type === 'image') defaultActionType = 'none';
  if (element.type === 'text') defaultActionType = 'none';
  
  // Add data attributes for interaction
  const actionType = element.attributes?.actionType || defaultActionType;
  // If action type is brand-page, treat it as open-url for HTML generation
  const finalActionType = actionType === 'brand-page' ? 'open-url' : actionType;
  const targetScreenId = element.attributes?.targetScreenId || '';
  const url = element.attributes?.url || '';
  const targetWindow = element.attributes?.targetWindow || '_blank';
  
  if (['button', 'link', 'text', 'image'].includes(element.type)) {
    interactionAttrs = ` data-action-type="${finalActionType}" data-target-screen-id="${targetScreenId}" data-url="${url}" data-target-window="${targetWindow}"`;
  }
  
  // Handle group elements specially
  if ((element.type === 'group' || element.type === 'product') && element.children && element.children.length > 0) {
    // Create a div with group styles
    let layoutAttributes = '';
    
    // Add layout attributes if present
    if (element.layout) {
      const layout = element.layout;
      layoutAttributes = ` 
        data-direction="${layout.direction || 'column'}"
        data-wrap="${layout.wrap || 'nowrap'}"
        data-justify="${layout.justifyContent || 'flex-start'}"
        data-align-items="${layout.alignItems || 'flex-start'}"
        data-align-content="${layout.alignContent || 'flex-start'}"
        data-gap="${layout.gap || '0px'}"`;
        
      // Make sure gap is added to inline styles if present
      if (layout.gap) {
        // Remove any existing gap style
        inlineStyle = inlineStyle.filter(style => !style.startsWith('gap:'));
        
        // Add gap with proper units
        let gapValue = layout.gap;
        if ((typeof gapValue === 'number' || /^\d+$/.test(gapValue)) && !gapValue.toString().includes('px')) {
          gapValue = `${gapValue}px`;
        }
        
        inlineStyle.push(`gap: ${gapValue}`);
      }
    }
    
    // Ensure display: flex is added
    if (!inlineStyle.some(style => style.startsWith('display:'))) {
      inlineStyle.push('display: flex');
    }
    
    // Ensure flex-direction is added
    if (!inlineStyle.some(style => style.startsWith('flex-direction:'))) {
      const direction = element.layout?.direction || 'column';
      inlineStyle.push(`flex-direction: ${direction}`);
    }
    
    // Update style attribute with new styles
    const updatedStyleAttr = inlineStyle.length > 0 ? ` style="${inlineStyle.join('; ')}"` : '';
    
    // Use appropriate class based on element type
    const className = element.type === 'product' ? 'product-element' : 'element-group';
    
    // Add product-specific data attributes if needed
    const productAttrs = element.type === 'product' ? ` data-product-id="${element.attributes?.productId || ''}"` : '';
    
    html = `<div id="${element.id}" class="${className}"${layoutAttributes}${updatedStyleAttr}${interactionAttrs}${productAttrs}>\n`;
    
    // Process all children elements recursively
    element.children.forEach(childElement => {
      // Add child element with proper indentation
      html += `  ${generateElementHtml({...childElement, sectionId: element.sectionId}).replace(/\n/g, '\n  ')}\n`;
    });
    
    html += '</div>';
  } else {
    // Handle regular elements as before
    switch (element.type) {
      case 'text':
        html = `<p id="${element.id}"${styleAttr}${interactionAttrs}>${element.content}</p>`
        break
      case 'button':
        html = `<button id="${element.id}"${styleAttr}${interactionAttrs}>${element.content}</button>`
        break
      case 'image':
        html = `<img id="${element.id}" src="${element.attributes?.src || ''}" alt="${element.attributes?.alt || ''}"${styleAttr}${interactionAttrs} />`
        break
      case 'link':
        const href = element.attributes?.url || '#';
        const target = element.attributes?.target || '_self';
        html = `<a id="${element.id}" href="${href}" target="${target}" data-link-element="true"${styleAttr}${interactionAttrs}>${element.content || 'Link'}</a>`
        break
      case 'input':
        html = `<input id="${element.id}" type="${element.attributes.type || 'text'}" placeholder="${element.attributes.placeholder || ''}"${styleAttr} />`
        break
      case 'checkbox':
        html = `<div id="${element.id}"${styleAttr}><input type="checkbox" value="${element.attributes.value || ''}" ${element.attributes.checked ? 'checked' : ''} /> ${element.content}</div>`
        break
      case 'radio':
        html = `<div id="${element.id}"${styleAttr}><input type="radio" name="${element.attributes.name || ''}" value="${element.attributes.value || ''}" /> ${element.content}</div>`
        break
      case 'select':
        html = `<select id="${element.id}"${styleAttr}>${element.content}</select>`
        break
      case 'textarea':
        html = `<textarea id="${element.id}" placeholder="${element.attributes.placeholder || ''}"${styleAttr}>${element.content || ''}</textarea>`
        break
      case 'product':
        // Only used for product elements without children
        html = `<div id="${element.id}" class="product-element"${styleAttr}${interactionAttrs} data-product-id="${element.attributes?.productId || ''}">
          <p class="no-product-data">Product preview</p>
        </div>`
        break
      default:
        html = `<div id="${element.id}"${styleAttr}>${element.content || ''}</div>`
    }
  }
  
  return html
}

export function generateElementCss(element: QuizElement): string {
  let css = '';
  const styles = element.styles;
  
  // Use a more specific selector including the section ID for better specificity
  css += `#section-${element.sectionId} #${element.id} {\n`;
  
  // Process all styles without any filtering
  for (const [property, value] of Object.entries(styles)) {
    if (value) {
      // Convert CSS variables to direct hex colors if needed
      let processedValue = value;
      if (typeof value === 'string') {
        // Replace CSS variables with direct colors
        if (value.includes('var(--primary)')) {
          processedValue = value.replace(/var\(--primary\)/g, '#355DF9');
        } else if (value.includes('var(--secondary)')) {
          processedValue = value.replace(/var\(--secondary\)/g, '#f8fafc');
        } else if (value.includes('var(--accent)')) {
          processedValue = value.replace(/var\(--accent\)/g, '#f8fafc');
        } else if (value.includes('var(--border)')) {
          processedValue = value.replace(/var\(--border\)/g, '#e2e8f0');
        } else if (value.includes('var(--destructive)')) {
          processedValue = value.replace(/var\(--destructive\)/g, '#ef4444');
        }
      }
      
      // Ensure numeric values have units for width, height, padding, margin, etc.
      if (['width', 'height', 'padding', 'margin', 'top', 'right', 'bottom', 'left', 'gap'].includes(property) && 
          (typeof processedValue === 'number' || /^\d+$/.test(processedValue))) {
        processedValue = `${processedValue}px`;
      }
      
      // Convert camelCase to kebab-case
      const kebabProperty = property.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
      
      // Add !important to typography properties to ensure they override defaults
      if (['font-family', 'font-size', 'font-weight', 'color', 'text-align'].includes(kebabProperty)) {
        css += `  ${kebabProperty}: ${processedValue} !important;\n`;
      } else {
        css += `  ${kebabProperty}: ${processedValue};\n`;
      }
    }
  }
  
  css += '}\n';
  
  // Handle child elements of group or product
  if ((element.type === 'group' || element.type === 'product') && element.children && element.children.length > 0) {
    // Add CSS for each child element, maintaining proper selectors
    element.children.forEach(childElement => {
      // Pass the same sectionId to ensure proper CSS selector hierarchy
      css += generateElementCss({...childElement, sectionId: element.sectionId});
    });
  }
  
  return css;
}

export function generateScreenHtml(screen: QuizScreen): string {
  let html = `<div id="${screen.id}" class="quiz-screen">\n`;
  
  // Process each section
  Object.entries(screen.sections).forEach(([sectionId, section]) => {
    if (section.enabled) {
      // Add layout attributes as data attributes
      let layoutAttributes = '';
      if (section.layout) {
        const layout = section.layout;
        layoutAttributes = `
          data-direction="${layout.direction || 'column'}"
          data-wrap="${layout.wrap || 'nowrap'}"
          data-justify="${layout.justifyContent || 'flex-start'}"
          data-align-items="${layout.alignItems || 'flex-start'}"
          data-align-content="${layout.alignContent || 'flex-start'}"
          data-gap="${layout.gap || '0px'}"`;
      }
      
      // Add critical section styles as inline styles for better thumbnail rendering
      const inlineStyles: string[] = [];
      
      if (section.styles) {
        const criticalSectionProps = [
          'backgroundColor', 
          'backgroundImage',
          'backgroundSize',
          'backgroundPosition',
          'backgroundRepeat',
          'padding', 
          'margin', 
          'border', 
          'borderRadius'
        ];
        
        criticalSectionProps.forEach(prop => {
          if (section.styles?.[prop]) {
            // Convert camelCase to kebab-case for CSS
            const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
            let value = section.styles[prop];
            
            // Add background image properties
            if (prop === 'backgroundImage') {
              inlineStyles.push(`${cssProp}: ${value}`);
              if (value) {
                inlineStyles.push('background-size: cover');
                inlineStyles.push('background-position: center');
                inlineStyles.push('background-repeat: no-repeat');
              }
            } else {
              inlineStyles.push(`${cssProp}: ${value}`);
            }
          }
        });
      }
      
      // Ensure layout properties are added to inline styles for better rendering
      if (section.layout) {
        // Always add display: flex
        if (!inlineStyles.some(style => style.startsWith('display:'))) {
          inlineStyles.push('display: flex');
        }
        
        // Always add flex-direction
        if (!inlineStyles.some(style => style.startsWith('flex-direction:'))) {
          inlineStyles.push(`flex-direction: ${section.layout.direction || 'column'}`);
        }
        
        // Always add justify-content
        if (!inlineStyles.some(style => style.startsWith('justify-content:'))) {
          inlineStyles.push(`justify-content: ${section.layout.justifyContent || 'flex-start'}`);
        }
        
        // Always add align-items
        if (!inlineStyles.some(style => style.startsWith('align-items:'))) {
          inlineStyles.push(`align-items: ${section.layout.alignItems || 'flex-start'}`);
        }
        
        // Add gap if specified
        if (section.layout.gap && !inlineStyles.some(style => style.startsWith('gap:'))) {
          inlineStyles.push(`gap: ${section.layout.gap}`);
        }
      }
      
      // Add style attribute if there are inline styles
      const styleAttr = inlineStyles.length > 0 ? ` style="${inlineStyles.join('; ')}"` : '';
      
      html += `  <div id="section-${sectionId}" class="quiz-section quiz-section-${sectionId}"${layoutAttributes}${styleAttr}>\n`;
      
      // Process elements in this section
      section.elements.forEach(element => {
        html += `    ${generateElementHtml(element).replace(/\n/g, '\n    ')}\n`;
      });
      
      html += `  </div>\n`;
    }
  });
  
  html += '</div>';
  
  return html;
}

export function generateScreenCss(screen: QuizScreen): string {
  let css = `.quiz-screen {\n  width: 100%;\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n}\n\n`;
  
  // Add base styles for each section type
  css += `.quiz-section {\n  display: flex;\n  position: relative;\n}\n\n`;
  
  // Process each section's custom styles
  Object.entries(screen.sections).forEach(([sectionId, section]) => {
    if (section.enabled) {
      // Use a more specific selector for section CSS
      css += `#${screen.id} #section-${sectionId} {\n`;
      
      // Add layout properties
      if (section.layout) {
        const layout = section.layout;
        css += `  display: flex;\n`;
        css += `  flex-direction: ${layout.direction || 'column'};\n`;
        css += `  flex-wrap: ${layout.wrap || 'nowrap'};\n`;
        css += `  justify-content: ${layout.justifyContent || 'flex-start'};\n`;
        css += `  align-items: ${layout.alignItems || 'flex-start'};\n`;
        css += `  align-content: ${layout.alignContent || 'flex-start'};\n`;
        if (layout.gap) css += `  gap: ${layout.gap};\n`;
      }
      
      // Add custom styles
      if (section.styles) {
        for (const [property, value] of Object.entries(section.styles)) {
          if (value) {
            // Convert camelCase to kebab-case for CSS
            const kebabProperty = property.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
            css += `  ${kebabProperty}: ${value};\n`;
          }
        }
      }
      
      // Add specific properties based on section type
      if (sectionId === 'body') {
        css += `  flex: 1;\n`;
        css += `  overflow: auto;\n`;  // Make body section scrollable
        css += `  display: flex;\n`;
        css += `  flex-direction: column;\n`;
        css += `  min-height: 0;\n`;  // Needed for proper flex container sizing with overflow
      }
      
      css += '}\n\n';
      
      // Add CSS for each element in this section
      section.elements.forEach(element => {
        css += generateElementCss(element) + '\n';
      });
    }
  });
  
  return css;
}

export function parseHtml(html: string): { elements: QuizElement[] } {
  // This is a simplified parser for demonstration purposes
  // In a real application, you would use a proper HTML parser
  
  const elements: QuizElement[] = []
  
  // Simple regex to extract elements (this is not a robust solution)
  const elementRegex = /<([a-z]+)[^>]*id="([^"]+)"[^>]*>([^<]*)<\/\1>/g
  let match
  
  while ((match = elementRegex.exec(html)) !== null) {
    const [_, tagName, id, content] = match
    
    let type: any = 'text'
    switch (tagName) {
      case 'p':
        type = 'text'
        break
      case 'button':
        type = 'button'
        break
      case 'img':
        type = 'image'
        break
      case 'input':
        type = 'input'
        break
      case 'select':
        type = 'select'
        break
      case 'textarea':
        type = 'textarea'
        break
      default:
        type = 'text'
    }
    
    // Try to determine the section from the HTML context
    // Default to 'body' if we can't determine it
    let sectionId: SectionType = 'body'
    
    // Check if the element is inside a section div
    const sectionMatch = html.substring(0, match.index).match(/id="section-([^"]+)"/)
    if (sectionMatch && ['header', 'body', 'footer'].includes(sectionMatch[1])) {
      sectionId = sectionMatch[1] as SectionType
    }
    
    elements.push({
      id,
      type,
      content,
      styles: {},
      attributes: {},
      sectionId,
    })
  }
  
  return { elements }
}

export function parseCss(css: string, elements: QuizElement[]): QuizElement[] {
  // This is a simplified parser for demonstration purposes
  // In a real application, you would use a proper CSS parser
  
  const updatedElements = [...elements]
  
  // Simple regex to extract CSS rules (this is not a robust solution)
  const ruleRegex = /#([a-zA-Z0-9-_]+)\s*{([^}]*)}/g
  let match
  
  while ((match = ruleRegex.exec(css)) !== null) {
    const [_, id, stylesText] = match
    
    const element = updatedElements.find(el => el.id === id)
    if (element) {
      const styleProps = stylesText.split(';').filter(Boolean)
      
      for (const prop of styleProps) {
        const [property, value] = prop.split(':').map(s => s.trim())
        if (property && value) {
          // Convert kebab-case to camelCase
          const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
          element.styles[camelProperty] = value
        }
      }
    }
  }
  
  return updatedElements
}

// Helper function to extract all colors from an element's styles
export function extractColorsFromStyles(styles: Record<string, string | undefined>): string[] {
  const colors: string[] = [];
  
  // Color-related style properties
  const colorProperties = [
    'color',
    'backgroundColor',
    'borderColor',
    'outlineColor',
    'textDecorationColor'
  ];
  
  // Extract colors from styles
  Object.entries(styles || {}).forEach(([key, value]) => {
    if (value && (
      colorProperties.includes(key) || 
      (key === 'border' && value.split(' ').length === 3)
    )) {
      // If it's a border property with 3 parts (width style color), extract the color
      if (key === 'border' && value.split(' ').length === 3) {
        const borderColor = value.split(' ')[2];
        if (borderColor && (borderColor.startsWith('#') || borderColor.startsWith('rgb'))) {
          colors.push(borderColor);
        }
      } 
      // For regular color properties
      else if (value.startsWith('#') || value.startsWith('rgb')) {
        colors.push(value);
      }
    }
  });
  
  return colors;
}

// Extract all unique colors used in a quiz
export function getQuizColors(quiz: any): string[] {
  const colors = new Set<string>();
  
  // Process all screens in the quiz
  quiz.screens.forEach((screen: any) => {
    // Process all sections in the screen
    Object.values(screen.sections).forEach((section: any) => {
      // Add section background color if defined
      if (section.styles?.backgroundColor) {
        colors.add(section.styles.backgroundColor);
      }
      
      // Process all elements in the section
      const processElement = (element: any) => {
        // Extract colors from element styles
        extractColorsFromStyles(element.styles).forEach(color => colors.add(color));
        
        // Process child elements if this is a group
        if (element.isGroup && element.children) {
          element.children.forEach(processElement);
        }
      };
      
      section.elements.forEach(processElement);
    });
  });
  
  // Filter out CSS variables and convert to array
  return Array.from(colors).filter(color => 
    (color.startsWith('#') || color.startsWith('rgb')) && 
    !color.includes('var(--')
  );
}

function generateSectionCss(section: QuizSection): string {
  if (!section.styles) return '';
  
  const styles = section.styles;
  
  // Define required CSS properties for sections
  const cssProperties = [
    'backgroundColor',
    'color',
    'padding',
    'margin',
    'borderRadius',
    'border',
    'boxShadow',
    'textShadow'
  ];
  
  // Build CSS classes for the section
  let css = `.${getSafeSectionId(section.id)} {\n`;
  
  // Add critical styles
  cssProperties.forEach(prop => {
    if (styles[prop]) {
      // Convert camelCase to kebab-case
      const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      css += `  ${cssProp}: ${styles[prop]};\n`;
    }
  });
  
  // Add flex layout properties from the section's layout
  if (section.layout) {
    css += `  display: flex;\n`;
    css += `  flex-direction: ${section.layout.direction};\n`;
    css += `  flex-wrap: ${section.layout.wrap};\n`;
    css += `  justify-content: ${section.layout.justifyContent};\n`;
    css += `  align-items: ${section.layout.alignItems};\n`;
    css += `  align-content: ${section.layout.alignContent};\n`;
    css += `  gap: ${section.layout.gap};\n`;
  }
  
  css += '}\n';
  
  return css;
}

// Function to get a safe CSS ID for a section
function getSafeSectionId(sectionId: string): string {
  return `quiz-section-${sectionId}`;
}
