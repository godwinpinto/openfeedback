"use client";

import * as React from "react";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Plus, Trash2 } from "lucide-react";
import { GenUIInput } from "@/components/genui-input";

// TypeScript Types
export type MultipleSelectDisplayMode = "list" | "grid-2" | "grid-3";

export type MultipleSelectFieldProps = {
  questionTitle: string;
  questionHint?: string;
  required: boolean;
  type: "multiple_select";
  options: string[];
  displayMode?: MultipleSelectDisplayMode;
};

type MultipleSelectFieldEditProps = {
  field: MultipleSelectFieldProps;
  fieldId: string;
  value?: string[];
  error?: string;
  onChange?: (value: string[]) => void;
  onUpdateField?: (updates: Partial<MultipleSelectFieldProps>) => void;
  hideLabel?: boolean;
};

type MultipleSelectFieldViewProps = {
  field: MultipleSelectFieldProps;
  fieldId: string;
  value?: string[];
};

// Edit Mode Component
export const MultipleSelectFieldEdit = ({
  field,
  fieldId,
  value = [],
  error,
  onChange,
  onUpdateField,
  hideLabel = false,
}: MultipleSelectFieldEditProps) => {
  const handleChange = (option: string, checked: boolean) => {
    const selectedValues = value || [];
    if (checked) {
      onChange?.([...selectedValues, option]);
    } else {
      onChange?.(selectedValues.filter((v) => v !== option));
    }
  };

  const handleAddOption = () => {
    const newOption = `Option ${field.options.length + 1}`;
    onUpdateField?.({
      options: [...field.options, newOption],
    });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = field.options.filter((_, i) => i !== index);
    onUpdateField?.({ options: newOptions });
  };

  return (
    <Field orientation="vertical" className="space-y-2">
      {!hideLabel && (
        <>
          <FieldLabel>
            {field.questionTitle}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FieldLabel>
          {field.questionHint && (
            <FieldDescription>{field.questionHint}</FieldDescription>
          )}
        </>
      )}
      <FieldContent>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 shrink-0"></div>
          <Label htmlFor={`display-mode-${fieldId}`} className="text-sm whitespace-nowrap">
            Display:
          </Label>
          <Select
            value={field.displayMode || "list"}
            onValueChange={(value: MultipleSelectDisplayMode) =>
              onUpdateField?.({ displayMode: value })
            }
          >
            <SelectTrigger id={`display-mode-${fieldId}`} className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="grid-2">Grid 2</SelectItem>
              <SelectItem value="grid-3">Grid 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          {field.options.map((option, index) => {
            const sharedContext = `Question type: multiple_select.

Question title: "${field.questionTitle}"
${field.questionHint ? `Question description/hint: "${field.questionHint}"` : ''}

Current option label (for this specific option): "${option}"
Existing options: ${field.options.filter((_, idx) => idx !== index).map(opt => `"${opt}"`).join(', ') || '(none)'}

This is an option label for a multiple select question option. Requirements: Keep it concise (under 10 words), use clear and simple language, make it a single short phrase or word that represents a distinct choice, and ensure it is easy to understand at a glance. The option should be specific and can be selected alongside other options.

CRITICAL: Generate ONLY ONE option label, not multiple options. Return a single short text label that fits the context of the question.`;

            return (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${fieldId}-${index}`}
                  checked={value?.includes(option) || false}
                  onCheckedChange={(checked) => handleChange(option, checked as boolean)}
                />
                <GenUIInput
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...field.options];
                    newOptions[index] = e.target.value;
                    onUpdateField?.({ options: newOptions });
                  }}
                  className="h-8 text-sm"
                  containerClassName="flex-1"
                  placeholder="Enter option text"
                  features={["compose", "improve", "fix-grammar", "translate", "auto-suggest"]}
                  translateTargets={["en", "fr", "es", "de", "hi", "ja", "zh-CN"]}
                  translateLanguageMap={{
                    en: 'English',
                    fr: 'French',
                    es: 'Spanish',
                    de: 'German',
                    hi: 'Hindi',
                    ja: 'Japanese',
                    'zh-CN': 'Chinese (Simplified)'
                  }}
                  placeholderPrompt="Describe what you want"
                  writerOptions={{
                    tone: 'neutral',
                    format: 'plain-text',
                    length: 'short',
                    sharedContext,
                    expectedInputLanguages: ['en'],
                    expectedContextLanguages: ['en'],
                    outputLanguage: 'en',
                  }}
                  onAccept={(text) => {
                    const newOptions = [...field.options];
                    newOptions[index] = text;
                    onUpdateField?.({ options: newOptions });
                  }}
                  onAIError={(e) => console.error('AI input error:', e)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOption(index)}
                  disabled={field.options.length <= 2}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          className="mt-2"
        >
          <Plus className="size-4 mr-2" />
          Add Option
        </Button>
      </FieldContent>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
};

// View Mode Component
export const MultipleSelectFieldView = ({
  field,
  fieldId,
  value,
}: MultipleSelectFieldViewProps) => {
  const displayMode = field.displayMode || "list";

  return (
    <Field orientation="vertical" className="space-y-2">
      <FieldLabel>
        {field.questionTitle}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      {field.questionHint && (
        <FieldDescription>{field.questionHint}</FieldDescription>
      )}
      <FieldContent>
        {displayMode === "list" ? (
          <div className="space-y-2">
            {Array.isArray(value) && value.length > 0 ? (
              <ul className="space-y-1">
                {value.map((selectedOption, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{selectedOption}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-muted-foreground text-sm">
                Not answered
              </span>
            )}
          </div>
        ) : (
          <div
            className={
              displayMode === "grid-2"
                ? "grid grid-cols-2 gap-4"
                : "grid grid-cols-3 gap-4"
            }
          >
            {field.options.map((option, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center space-y-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
              >
                <Checkbox
                  id={`${fieldId}-view-${index}`}
                  checked={Array.isArray(value) && value.includes(option)}
                  disabled
                />
                <Label
                  htmlFor={`${fieldId}-view-${index}`}
                  className="cursor-pointer text-center text-sm"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )}
      </FieldContent>
    </Field>
  );
};

// Response Mode Component (interactive for end users)
export const MultipleSelectFieldResponse = ({
  field,
  fieldId,
  value = [],
  error,
  onChange,
}: {
  field: MultipleSelectFieldProps;
  fieldId: string;
  value?: string[];
  error?: string;
  onChange?: (value: string[]) => void;
}) => {
  const displayMode = field.displayMode || "list";

  const toggle = (option: string) => {
    const selected = Array.isArray(value) ? value : [];
    const exists = selected.includes(option);
    const next = exists ? selected.filter((v) => v !== option) : [...selected, option];
    onChange?.(next);
  };

  return (
    <Field orientation="vertical" className="space-y-2">
      <FieldLabel>
        {field.questionTitle}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      {field.questionHint && (
        <FieldDescription>{field.questionHint}</FieldDescription>
      )}
      <FieldContent>
        {displayMode === "list" ? (
          <div className="space-y-2">
            {field.options.map((option, index) => {
              const checked = (value || []).includes(option);
              return (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(option)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle(option);
                    }
                  }}
                  className={cn(
                    "w-full text-left border rounded-md px-3 py-2 flex items-center justify-between cursor-pointer",
                    checked ? "border-primary bg-accent" : "hover:bg-accent"
                  )}
                  aria-pressed={checked}
                >
                  <span className="text-sm">{option}</span>
                  <Check aria-hidden className={cn("size-5", checked ? "text-primary" : "opacity-0")} />
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={(function () {
              const desired = displayMode === "grid-2" ? 2 : 3;
              const count = Array.isArray(field.options) ? field.options.length : 0;
              const cols = Math.max(1, Math.min(desired, Math.min(3, count)));
              return cols === 1
                ? "grid grid-cols-1 gap-3"
                : cols === 2
                ? "grid grid-cols-2 gap-3"
                : "grid grid-cols-3 gap-3";
            })()}
          >
            {field.options.map((option, index) => {
              const checked = (value || []).includes(option);
              return (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(option)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle(option);
                    }
                  }}
                  className={cn(
                    "text-left border rounded-md px-3 py-2 flex items-center justify-between cursor-pointer",
                    checked ? "border-primary bg-accent" : "hover:bg-accent"
                  )}
                  aria-pressed={checked}
                >
                  <span className="text-sm">{option}</span>
                  <Check aria-hidden className={cn("size-5", checked ? "text-primary" : "opacity-0")} />
                </div>
              );
            })}
          </div>
        )}
      </FieldContent>
      <div className="text-xs text-muted-foreground">Multiple selections allowed</div>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
};

