'use client'

import * as React from 'react'
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Label } from './label'

const Form = FormProvider

/* ── Context ── */
interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)
const FormItemContext  = React.createContext<{ id: string }>({} as { id: string })

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext  = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) throw new Error('useFormField must be used within <FormField>')

  const { id } = itemContext

  return {
    id,
    name:          fieldContext.name,
    formItemId:    `${id}-form-item`,
    formDescId:    `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

/* ── FormField ── */
function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

/* ── FormItem ── */
const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId()
    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn('flex flex-col gap-1.5 w-full', className)} {...props} />
      </FormItemContext.Provider>
    )
  }
)
FormItem.displayName = 'FormItem'

/* ── FormLabel ── */
const FormLabel = React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<typeof Label> & { required?: boolean }>(
  ({ className, required, ...props }, ref) => {
    const { error, formItemId } = useFormField()
    return (
      <Label
        ref={ref}
        htmlFor={formItemId}
        required={required}
        className={cn(error && 'text-[var(--danger)]', className)}
        {...props}
      />
    )
  }
)
FormLabel.displayName = 'FormLabel'

/* ── FormControl ── */
const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    const { error, formItemId, formDescId, formMessageId } = useFormField()
    return (
      <div
        ref={ref}
        id={formItemId}
        aria-describedby={!error ? formDescId : `${formDescId} ${formMessageId}`}
        aria-invalid={!!error}
        {...props}
      />
    )
  }
)
FormControl.displayName = 'FormControl'

/* ── FormDescription ── */
const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescId } = useFormField()
    return (
      <p
        ref={ref}
        id={formDescId}
        className={cn('text-xs text-[var(--text-muted)] leading-relaxed', className)}
        {...props}
      />
    )
  }
)
FormDescription.displayName = 'FormDescription'

/* ── FormMessage ── */
const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children }, ref) => {
    const { error, formMessageId } = useFormField()
    const body = error ? String(error?.message ?? '') : children

    if (!body) return null

    return (
      <motion.p
        ref={ref}
        id={formMessageId}
        role="alert"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'text-xs font-medium',
          error ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]',
          className
        )}
      >
        {body}
      </motion.p>
    )
  }
)
FormMessage.displayName = 'FormMessage'

export {
  Form, FormField, FormItem, FormLabel,
  FormControl, FormDescription, FormMessage,
  useFormField,
}
