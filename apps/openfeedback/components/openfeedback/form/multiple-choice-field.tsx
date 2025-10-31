"use client";

import * as React from "react";
import {
  RadioGroup,
  RadioGroupItem,
  Label,
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
  FieldError,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@shared-ui";
import { Check } from "lucide-react";
import { Plus, Trash2 } from "lucide-react";

// TypeScript Types
export type MultipleChoiceDisplayMode = "list" | "grid-2" | "grid-3";

export type MultipleChoiceFieldProps = {
  questionTitle: string;
  questionHint?: string;
  required: boolean;
  type: "multiple_choice";
  options: string[];
  displayMode?: MultipleChoiceDisplayMode;
};

type MultipleChoiceFieldEditProps = {
  field: MultipleChoiceFieldProps;
  fieldId: string;
  value?: string;
  error?: string;
  onChange?: (value: string) => void;
  onUpdateField?: (updates: Partial<MultipleChoiceFieldProps>) => void;
  hideLabel?: boolean;
};

type MultipleChoiceFieldViewProps = {
  field: MultipleChoiceFieldProps;
  fieldId: string;
  value?: string;
};

// Edit Mode Component
export const MultipleChoiceFieldEdit = ({
  field,
  fieldId,
  value = "",
  error,
  onChange,
  onUpdateField,
  hideLabel = false,
}: MultipleChoiceFieldEditProps) => {
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
            onValueChange={(value: MultipleChoiceDisplayMode) =>
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
        <RadioGroup value={value} onValueChange={onChange}>
          {field.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${fieldId}-${index}`} />
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...field.options];
                  newOptions[index] = e.target.value;
                  onUpdateField?.({ options: newOptions });
                }}
                className="flex-1 h-8 text-sm"
                placeholder="Enter option text"
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
          ))}
        </RadioGroup>
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
export const MultipleChoiceFieldView = ({
  field,
  fieldId,
  value,
}: MultipleChoiceFieldViewProps) => {
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
          <div className="text-sm">
            {value || (
              <span className="text-muted-foreground">Not answered</span>
            )}
          </div>
        ) : (
          <RadioGroup value={value || ""}>
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
                  <RadioGroupItem value={option} id={`${fieldId}-view-${index}`} />
                  <Label
                    htmlFor={`${fieldId}-view-${index}`}
                    className="cursor-pointer text-center text-sm"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </FieldContent>
    </Field>
  );
};

// Response Mode Component (interactive for end users)
export const MultipleChoiceFieldResponse = ({
  field,
  fieldId,
  value = "",
  error,
  onChange,
}: {
  field: MultipleChoiceFieldProps;
  fieldId: string;
  value?: string;
  error?: string;
  onChange?: (value: string) => void;
}) => {
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
            {field.options.map((option, index) => {
              const active = value === option;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onChange?.(option)}
                  className={cn(
                    "w-full text-left border rounded-md px-3 py-2 flex items-center justify-between",
                    active ? "border-primary bg-accent" : "hover:bg-accent"
                  )}
                  aria-pressed={active}
                >
                  <span className="text-sm">{option}</span>
                  <Check aria-hidden className={cn("size-5", active ? "text-primary" : "opacity-0")} />
                </button>
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
              const active = value === option;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onChange?.(option)}
                  className={cn(
                    "text-left border rounded-md px-3 py-2 flex items-center justify-between",
                    active ? "border-primary bg-accent" : "hover:bg-accent"
                  )}
                  aria-pressed={active}
                >
                  <span className="text-sm">{option}</span>
                  <Check aria-hidden className={cn("size-5", active ? "text-primary" : "opacity-0")} />
                </button>
              );
            })}
          </div>
        )}
      </FieldContent>
      <div className="text-xs text-muted-foreground">Single selection</div>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
};

