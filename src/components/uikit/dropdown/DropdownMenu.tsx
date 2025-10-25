"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type React from "react";
import { cn } from "../utils/cn";
import styles from "./DropdownMenu.module.scss";

export const DropdownMenuRoot = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;

export function DropdownMenuContent({
  children,
  id,
  className,
  sideOffset = 8,
  align = "start",
  ...rest
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
  sideOffset?: number;
  align?: "start" | "center" | "end";
} & Omit<
  React.ComponentProps<typeof Dropdown.Content>,
  "className" | "sideOffset" | "align"
>) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        id={id}
        className={cn(styles.content, className)}
        sideOffset={sideOffset}
        align={align}
        {...rest}
      >
        {children}
      </Dropdown.Content>
    </Dropdown.Portal>
  );
}

export function DropdownMenuItem({
  children,
  id,
  className,
  onSelect,
  ...rest
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
  onSelect?: (event: Event) => void;
} & Omit<
  React.ComponentProps<typeof Dropdown.Item>,
  "className" | "onSelect"
>) {
  return (
    <Dropdown.Item
      id={id}
      className={cn(styles.item, className)}
      {...(onSelect ? { onSelect } : {})}
      {...rest}
    >
      {children}
    </Dropdown.Item>
  );
}

export const DropdownMenuSeparator = (
  props: Omit<React.ComponentProps<typeof Dropdown.Separator>, "className">,
) => <Dropdown.Separator {...props} className={styles.separator} />;
export const DropdownMenuLabel = ({
  children,
  id,
  className,
  ...rest
}: { children: React.ReactNode; id?: string; className?: string } & Omit<
  React.ComponentProps<typeof Dropdown.Label>,
  "className"
>) => (
  <Dropdown.Label id={id} {...rest} className={cn(styles.label, className)}>
    {children}
  </Dropdown.Label>
);
