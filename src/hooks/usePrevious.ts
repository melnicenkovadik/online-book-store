"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook to get the previous value of a state or prop
 * @param value Current value
 * @returns Previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  // Create a ref to store the previous value
  const ref = useRef<T>();

  // Update the ref value when the value changes
  useEffect(() => {
    ref.current = value;
  }, [value]);

  // Return the previous value (which is undefined on first render)
  return ref.current;
}
