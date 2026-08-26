import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne les classes Tailwind intelligemment.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
