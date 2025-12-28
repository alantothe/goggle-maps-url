import * as React from "react";
import { type Control } from "react-hook-form";
import { Input } from "@client/components/ui";
import { FormBase } from "./form-base";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  control: Control<any>;
  description?: string;
  onPaste?: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onInput?: (event: React.FormEvent<HTMLInputElement>) => void;
}

export function FormInput({
  name,
  label,
  control,
  description,
  onPaste,
  onInput,
  ...inputProps
}: FormInputProps) {
  return (
    <FormBase
      name={name}
      label={label}
      control={control}
      description={description}
    >
      {(field, fieldState) => (
        <Input
          id={field.name}
          {...field}
          {...inputProps}
          onPaste={onPaste}
          onInput={onInput}
          aria-invalid={fieldState.invalid}
        />
      )}
    </FormBase>
  );
}
