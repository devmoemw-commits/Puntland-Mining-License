// utils/formatDate.ts
import { format } from "date-fns";

/**
 * Format a date string or Date object into readable format.
 * @param date Date string or object
 * @param dateFormat Optional date-fns format string (default: 'PPP')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, dateFormat = "PP"): string {
  try {
    return format(new Date(date), dateFormat);
  } catch (error) {
    return "Invalid date"+error;
  }
}
