/**
 * Utilities for handling dates in Brazilian timezone
 * Solves timezone issues when dealing with date-only values
 */

/**
 * Formats a date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY)
 * Handles timezone issues by treating the date as local date
 */
export const formatDateToBrazilian = (dateStr: string): string => {
  if (!dateStr) return "";
  
  // Handle ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
  const isoDateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    // Create date as local date to avoid timezone conversion issues
    return `${day}/${month}/${year}`;
  }
  
  // Fallback: try to parse as Date and format
  try {
    const date = new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};

/**
 * Formats a date string for display in Brazilian format using Intl.DateTimeFormat
 * Alternative method that handles timezone properly
 */
export const formatDateToBrazilianIntl = (dateStr: string): string => {
  if (!dateStr) return "";
  
  try {
    // Parse as ISO date and add 12:00 to avoid timezone issues
    const isoDateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    
    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;
      // Create date in local timezone
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo'
      }).format(date);
    }
    
    return "";
  } catch {
    return "";
  }
};

/**
 * Converts Brazilian date format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
 * Used when submitting forms to the backend
 */
export const formatDateToISO = (dateStr: string): string | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  
  // Check if it's in DD/MM/YYYY format
  const ddmmyyyyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(ddmmyyyyPattern);
  
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Validate if the date is valid
    if (date.getDate() == parseInt(day) && 
        date.getMonth() == parseInt(month) - 1 && 
        date.getFullYear() == parseInt(year)) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return null; // Invalid date
};

/**
 * Formats a date string from backend to display format for form fields (DD/MM/YYYY)
 * Handles both ISO strings and Date objects from backend
 */
export const formatDateForDisplay = (dateStr: string | Date): string => {
  if (!dateStr) return "";
  
  let dateToFormat: string;
  if (dateStr instanceof Date) {
    // Convert Date object to ISO string
    const year = dateStr.getFullYear();
    const month = (dateStr.getMonth() + 1).toString().padStart(2, '0');
    const day = dateStr.getDate().toString().padStart(2, '0');
    dateToFormat = `${year}-${month}-${day}`;
  } else {
    dateToFormat = dateStr;
  }
  
  return formatDateToBrazilian(dateToFormat);
};

/**
 * Gets the year from a date string, handling timezone issues
 */
export const getYearFromDate = (dateStr: string): number => {
  if (!dateStr) return new Date().getFullYear();
  
  const isoDateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    return parseInt(isoDateMatch[1]);
  }
  
  // Fallback
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date.getFullYear();
  } catch {
    return new Date().getFullYear();
  }
};

/**
 * Compares two date strings for sorting, handling timezone issues
 */
export const compareDates = (dateA: string, dateB: string): number => {
  if (!dateA || !dateB) return 0;
  
  const getTimeFromDateStr = (dateStr: string): number => {
    const isoDateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
    }
    return new Date(dateStr + 'T12:00:00').getTime();
  };
  
  return getTimeFromDateStr(dateA) - getTimeFromDateStr(dateB);
};

/**
 * Formats currency value for Brazilian format
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}; 