import { StyleClass } from '@/types';

/**
 * Handles renaming a style class
 * @param classToRename The ID of the class to rename
 * @param newName The new name for the class
 * @param availableStyleClasses List of available style classes
 * @param updateStyleClass Function to update the style class
 * @returns Whether the operation was successful
 */
export function handleRenameStyleClass(
  classToRename: string | null,
  newName: string,
  availableStyleClasses: StyleClass[],
  updateStyleClass: (id: string, updates: Partial<StyleClass>) => void
): boolean {
  if (!classToRename || !newName.trim()) return false;
  
  // Find the class to rename
  const classToUpdate = availableStyleClasses.find(c => c.id === classToRename);
  if (!classToUpdate) return false;
  
  // Update the class name
  updateStyleClass(classToRename, {
    name: newName.trim()
  });
  
  return true;
}

/**
 * Handles duplicating a style class
 * @param classId The ID of the class to duplicate
 * @param availableStyleClasses List of available style classes
 * @param createStyleClass Function to create a new style class
 * @returns The ID of the newly created class, or null if the operation failed
 */
export function handleDuplicateStyleClass<T = string>(
  classId: string,
  availableStyleClasses: StyleClass[],
  createStyleClass: (name: string, elementType: T, styles: Record<string, any>) => string | null
): string | null {
  // Find the class to duplicate
  const classToDuplicate = availableStyleClasses.find(c => c.id === classId);
  if (!classToDuplicate) return null;
  
  // Create a new class with the same properties
  return createStyleClass(
    `${classToDuplicate.name} (Copy)`,
    classToDuplicate.elementType as unknown as T,
    { ...classToDuplicate.styles }
  );
} 