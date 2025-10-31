"use client";

import * as React from "react";
import {
  Input,
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@shared-ui";

// TypeScript Types
export type ShortTextFieldProps = {
  questionTitle: string;
  questionHint?: string;
  required: boolean;
  type: "short_text";
  placeholder?: string;
};

type ShortTextFieldEditProps = {
  field: ShortTextFieldProps;
  fieldId: string;
  value?: string;
  error?: string;
  onChange?: (value: string) => void;
  hideLabel?: boolean;
};

type ShortTextFieldViewProps = {
  field: ShortTextFieldProps;
  fieldId: string;
  value?: string;
};

// Edit Mode Component
export const ShortTextFieldEdit = ({
  field,
  fieldId,
  value = "",
  error,
  onChange,
  hideLabel = false,
}: ShortTextFieldEditProps) => {
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
export const ShortTextFieldView = ({
  field,
  fieldId,
  value,
}: ShortTextFieldViewProps) => {
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
        <div className="min-h-9 px-3 py-2 text-sm border rounded-md bg-muted/50">
          {value || (
            <span className="text-muted-foreground">Not answered</span>
          )}
        </div>
      </FieldContent>
    </Field>
  );
};

