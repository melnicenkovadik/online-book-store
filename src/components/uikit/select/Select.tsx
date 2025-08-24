"use client";

import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import * as RSelect from "@radix-ui/react-select";
import type React from "react";
import { cn } from "../utils/cn";
import styles from "./Select.module.scss";

export const SelectRoot = RSelect.Root;
export const SelectValue = RSelect.Value;

export function SelectTrigger({
  className,
  ...props
}: React.ComponentProps<typeof RSelect.Trigger>) {
  return (
    <RSelect.Trigger {...props} className={cn(styles.trigger, className)}>
      <RSelect.Value />
      <RSelect.Icon className={styles.icon}>
        <ChevronDownIcon />
      </RSelect.Icon>
    </RSelect.Trigger>
  );
}

export function SelectContent({
  children,
  className,
  position = "popper",
  sideOffset = 8,
  ...props
}: { children: React.ReactNode; className?: string } & Omit<
  React.ComponentProps<typeof RSelect.Content>,
  "className"
>) {
  return (
    <RSelect.Portal>
      <RSelect.Content
        className={cn(styles.content, className)}
        position={position}
        sideOffset={sideOffset}
        {...props}
      >
        <RSelect.Viewport>{children}</RSelect.Viewport>
      </RSelect.Content>
    </RSelect.Portal>
  );
}

export function SelectItem({
  children,
  value,
  className,
  ...props
}: { children: React.ReactNode; value: string; className?: string } & Omit<
  React.ComponentProps<typeof RSelect.Item>,
  "className" | "value"
>) {
  return (
    <RSelect.Item
      value={value}
      className={cn(styles.item, className)}
      {...props}
    >
      <RSelect.ItemIndicator>
        <CheckIcon />
      </RSelect.ItemIndicator>
      <RSelect.ItemText>{children}</RSelect.ItemText>
    </RSelect.Item>
  );
}

export const SelectGroup = RSelect.Group;
export const SelectLabel = (
  props: React.ComponentProps<typeof RSelect.Label>,
) => <RSelect.Label {...props} className={styles.label} />;
