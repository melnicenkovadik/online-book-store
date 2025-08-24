"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type React from "react";
import { cn } from "../utils/cn";
import styles from "./Popover.module.scss";

export const PopoverRoot = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({
  children,
  className,
  sideOffset = 8,
  ...props
}: { children: React.ReactNode; className?: string } & Omit<
  React.ComponentProps<typeof PopoverPrimitive.Content>,
  "className"
>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        className={cn(styles.content, className)}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
