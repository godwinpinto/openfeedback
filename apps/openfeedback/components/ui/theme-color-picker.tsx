"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Sun, Moon } from "lucide-react"

interface ThemeColorPickerProps {
  lightPrimary: string
  darkPrimary: string
  onLightPrimaryChange: (color: string) => void
  onDarkPrimaryChange: (color: string) => void
}

export function ThemeColorPicker({
  lightPrimary,
  darkPrimary,
  onLightPrimaryChange,
  onDarkPrimaryChange,
}: ThemeColorPickerProps) {
  const lightColorInputRef = React.useRef<HTMLInputElement>(null)
  const darkColorInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Sun className="size-4 text-muted-foreground" />
        <div className="relative">
          <div
            className="h-8 w-8 rounded-full border-2 border-border pointer-events-none"
            style={{ backgroundColor: lightPrimary }}
          />
          <input
            ref={lightColorInputRef}
            type="color"
            value={lightPrimary}
            onChange={(e) => onLightPrimaryChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            style={{ width: '2rem', height: '2rem' }}
            title="Click to change light mode primary color"
          />
        </div>
        <Input
          type="text"
          value={lightPrimary}
          onChange={(e) => onLightPrimaryChange(e.target.value)}
          placeholder="#000000"
          className="w-20 h-8 text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <Moon className="size-4 text-muted-foreground" />
        <div className="relative">
          <div
            className="h-8 w-8 rounded-full border-2 border-border pointer-events-none"
            style={{ backgroundColor: darkPrimary }}
          />
          <input
            ref={darkColorInputRef}
            type="color"
            value={darkPrimary}
            onChange={(e) => onDarkPrimaryChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            style={{ width: '2rem', height: '2rem' }}
            title="Click to change dark mode primary color"
          />
        </div>
        <Input
          type="text"
          value={darkPrimary}
          onChange={(e) => onDarkPrimaryChange(e.target.value)}
          placeholder="#ffffff"
          className="w-20 h-8 text-xs"
        />
      </div>
    </div>
  )
}

