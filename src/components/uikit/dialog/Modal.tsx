"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import type React from "react";
import { cn } from "../utils/cn";
import styles from "./Modal.module.scss";

export const ModalRoot = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;

export function ModalContent({
  title,
  description,
  children,
  id,
  className,
  ...props
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
} & Omit<React.ComponentProps<typeof Dialog.Content>, "className">) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content
        id={id}
        className={cn(styles.content, className)}
        {...props}
      >
        <div className={styles.header}>
          {title ? (
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          ) : null}
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Закрити"
              className={styles.closeBtn}
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </div>
        {description ? (
          <Dialog.Description className={styles.description}>
            {description}
          </Dialog.Description>
        ) : null}
        <div>{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
