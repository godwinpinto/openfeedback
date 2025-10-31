"use client";

import Link from "next/link";
import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubmenuItem {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

interface SubmenuProps {
  title: string;
  items: SubmenuItem[];
  footer?: {
    title: string;
    href: string;
  };
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function Submenu({
  title,
  items,
  footer,
  isOpen,
  onToggle,
  onClose,
}: SubmenuProps) {
  return (
    <div className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="flex items-start gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={onClose}
          >
            <item.icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {item.description}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {footer && (
        <div className="mt-4 pt-4 border-t">
          <Link
            href={footer.href}
            className="text-sm font-medium text-primary hover:underline"
            onClick={onClose}
          >
            {footer.title} →
          </Link>
        </div>
      )}
    </div>
  );
}

