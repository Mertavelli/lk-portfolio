import cn from 'clsx'
import { contactForm } from 'config/contact-form'
import { useStore } from 'lib/store'
import { Fragment, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  InputField,
  SelectField,
  TextArea,
} from 'components/hubspot/input-fields'
import s from 'components/hubspot/hubspot.module.scss'

function FieldTypeSwitcher({ field, input, errors }) {
  switch (input.inputType) {
    case 'single_line_text':
      return (
        <InputField
          error={errors[input.name]}
          label={input.label}
          placeholder={input.placeholder}
          required={input.required}
          type={input.type}
          {...field}
        />
      )
    case 'dropdown':
      return (
        <SelectField
          label={input.label}
          placeholder={input.placeholder}
          options={input.options}
          required={input.required}
          {...field}
        />
      )
    case 'multi_line_text':
      return (
        <TextArea
          error={errors[input.name]}
          label={input.label}
          placeholder={input.placeholder}
          required={input.required}
          {...field}
        />
      )
    default:
      return null
  }
}

export function ContactEmailForm({ className }) {
  const [setShowThanks] = useStore((state) => [state.setShowThanks])
  const [submitError, setSubmitError] = useState('')
  const { register, control, reset, handleSubmit, formState } = useForm({
    mode: 'onChange',
  })
  const { errors, isSubmitting } = formState

  const onSubmit = async (fields) => {
    setSubmitError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      })

      if (!response.ok) {
        throw new Error('The request could not be sent.')
      }

      reset()
      setShowThanks(true)
    } catch (error) {
      setSubmitError(
        'Something went wrong. Please try again or email hello@louiskarakas.com.',
      )
    }
  }

  return (
    <form
      className={className}
      onSubmit={handleSubmit(onSubmit)}
      id={contactForm.id}
    >
      <input
        aria-hidden="true"
        autoComplete="off"
        {...register('website')}
        name="website"
        style={{ display: 'none' }}
        tabIndex="-1"
        type="text"
      />
      {contactForm.fields.map((input, key) => (
        <Fragment key={`form-input-${key}`}>
          <Controller
            name={input.name}
            control={control}
            rules={{ required: input.required }}
            render={({ field }) => (
              <FieldTypeSwitcher field={field} input={input} errors={errors} />
            )}
          />
        </Fragment>
      ))}
      <button
        type="submit"
        className={cn('button', s.button)}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'SENDING...' : contactForm.submitButton.text}
      </button>
      {submitError && <p className="p-s">{submitError}</p>}
    </form>
  )
}
