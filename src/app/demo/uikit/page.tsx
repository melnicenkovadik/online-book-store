"use client";

import React from 'react';
import {
  Button,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  ModalRoot,
  ModalTrigger,
  ModalContent,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
} from '@/components/uikit';

export default function UIKitDemoPage() {
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }} id="uikit-demo">
      <h1 id="uikit-title">UI Kit Demo</h1>

      <section id="uikit-buttons">
        <h2 id="uikit-buttons-title">Buttons</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button id="btn-primary" variant="primary">Primary</Button>
          <Button id="btn-secondary" variant="secondary">Secondary</Button>
          <Button id="btn-ghost" variant="ghost">Ghost</Button>
          <Button id="btn-small" variant="primary" size="sm">Small</Button>
          <Button id="btn-large" variant="primary" size="lg">Large</Button>
        </div>
      </section>

      <section id="uikit-dropdown">
        <h2 id="uikit-dropdown-title">Dropdown Menu</h2>
        <DropdownMenuRoot>
          <DropdownMenuTrigger asChild>
            <Button id="uikit-dropdown-trigger" variant="secondary">Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent id="uikit-dropdown-content">
            <DropdownMenuItem id="uikit-dropdown-profile" onSelect={() => alert('Profile')}>Profile</DropdownMenuItem>
            <DropdownMenuItem id="uikit-dropdown-settings" onSelect={() => alert('Settings')}>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuRoot>
      </section>

      <section id="uikit-modal">
        <h2 id="uikit-modal-title">Modal</h2>
        <ModalRoot open={open} onOpenChange={setOpen}>
          <ModalTrigger asChild>
            <Button id="uikit-modal-trigger" variant="primary">Open Modal</Button>
          </ModalTrigger>
          <ModalContent id="uikit-modal-content" title="Modal Title" description="Short description">
            <p>Any content goes here.</p>
            <div style={{ marginTop: 12 }}>
              <Button id="uikit-modal-close" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </ModalContent>
        </ModalRoot>
      </section>

      <section id="uikit-select">
        <h2 id="uikit-select-title">Select</h2>
        <SelectRoot defaultValue="ua">
          <SelectTrigger id="uikit-select-trigger" style={{ minWidth: 200 }}>
            <SelectValue placeholder="Choose language" />
          </SelectTrigger>
          <SelectContent id="uikit-select-content">
            <SelectItem id="uikit-select-ua" value="ua">Українська</SelectItem>
            <SelectItem id="uikit-select-en" value="en">English</SelectItem>
            <SelectItem id="uikit-select-pl" value="pl">Polski</SelectItem>
          </SelectContent>
        </SelectRoot>
      </section>

      <section id="uikit-popover">
        <h2 id="uikit-popover-title">Popover</h2>
        <PopoverRoot>
          <PopoverTrigger asChild>
            <Button id="uikit-popover-trigger" variant="ghost">Open Popover</Button>
          </PopoverTrigger>
          <PopoverContent id="uikit-popover-content">
            <div style={{ display: 'grid', gap: 8 }}>
              <strong>Popover content</strong>
              <span>Use for small hints or actions.</span>
            </div>
          </PopoverContent>
        </PopoverRoot>
      </section>
    </div>
  );
}
