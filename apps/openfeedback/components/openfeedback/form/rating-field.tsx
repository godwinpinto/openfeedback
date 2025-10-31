"use client";

import * as React from "react";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

// TypeScript Types
export type RatingFieldProps = {
  questionTitle: string;
  questionHint?: string;
  required: boolean;
  type: "rating";
  maxRating?: number; // Default 5
};

type RatingFieldEditProps = {
  field: RatingFieldProps;
  fieldId: string;
  value?: number;
  error?: string;
  onChange?: (value: number) => void;
  hideLabel?: boolean;
};

type RatingFieldViewProps = {
  field: RatingFieldProps;
  fieldId: string;
  value?: number;
};

// Rating Component for Edit Mode
const RatingInput = ({
  value,
  onChange,
  maxRating = 5,
  disabled = false,
}: {
  value?: number;
  onChange?: (value: number) => void;
  maxRating?: number;
  disabled?: boolean;
}) => {
  return (
    <div className="flex gap-2">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => !disabled && onChange?.(rating)}
          disabled={disabled}
          className={cn(
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded",
            disabled && "cursor-not-allowed opacity-50"
          )}
          aria-label={`Rate ${rating} out of ${maxRating}`}
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              value && value >= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground hover:text-yellow-400"
            )}
          />
        </button>
      ))}
    </div>
  );
};

// Rating Component for View Mode
const RatingDisplay = ({
  value,
  maxRating = 5,
}: {
  value?: number;
  maxRating?: number;
}) => {
  if (value === undefined || value === null) {
    return (
      <span className="text-muted-foreground text-sm">Not answered</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
          <Star
            key={rating}
            className={cn(
              "h-5 w-5",
              value >= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground"
            )}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {value} / {maxRating}
      </span>
    </div>
  );
};

// Edit Mode Component
export const RatingFieldEdit = ({
  field,
  fieldId,
  value,
  error,
  onChange,
  hideLabel = false,
}: RatingFieldEditProps) => {
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
        <RatingInput value={value} onChange={onChange} maxRating={field.maxRating || 5} />
      </FieldContent>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
};

// View Mode Component
export const RatingFieldView = ({
  field,
  fieldId,
  value,
}: RatingFieldViewProps) => {
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
        <RatingDisplay value={value} maxRating={field.maxRating || 5} />
      </FieldContent>
    </Field>
  );
};

// Response Mode Component (interactive for end users)
export const RatingFieldResponse = ({
  field,
  fieldId,
  value,
  error,
  onChange,
}: {
  field: RatingFieldProps;
  fieldId: string;
  value?: number;
  error?: string;
  onChange?: (value: number) => void;
}) => {
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
        <RatingInput value={value} onChange={onChange} maxRating={field.maxRating || 5} />
      </FieldContent>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
};

