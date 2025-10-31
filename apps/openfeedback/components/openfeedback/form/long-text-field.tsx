"use client";

import * as React from "react";
import {
  Textarea,
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@shared-ui";

// TypeScript Types
export type LongTextFieldProps = {
  questionTitle: string;
  questionHint?: string;
  required: boolean;
  type: "long_text";
  placeholder?: string;
  rows?: number;
};

type LongTextFieldEditProps = {
  field: LongTextFieldProps;
  fieldId: string;
  value?: string;
  error?: string;
  onChange?: (value: string) => void;
  hideLabel?: boolean;
};

type LongTextFieldViewProps = {
  field: LongTextFieldProps;
  fieldId: string;
  value?: string;
};

// Edit Mode Component
export const LongTextFieldEdit = ({
  field,
  fieldId,
  value = "",
  error,
  onChange,
  hideLabel = false,
}: LongTextFieldEditProps) => {
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
        {error && (
          <FieldError id={`${fieldId}-error`} className="mt-1">
            {error}
          </FieldError>
        )}
      </FieldContent>
    </Field>
  );
};

// View Mode Component
export const LongTextFieldView = ({
  field,
  fieldId,
  value,
}: LongTextFieldViewProps) => {
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
        <div className="min-h-16 px-3 py-2 text-sm border rounded-md bg-muted/50 whitespace-pre-wrap">
          {value || (
            <span className="text-muted-foreground">Not answered</span>
          )}
        </div>
      </FieldContent>
    </Field>
  );
};

