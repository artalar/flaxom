import { action, Action, Atom, atom, Ctx, Fn, __count } from '@reatom/core'
import { isInit } from '@reatom/hooks'
import { isShallowEqual } from '@reatom/utils'
import {
  FieldAtom,
  FieldFocus,
  FieldOptions,
  FieldValidation,
  fieldInitFocus,
  fieldInitValidation,
  reatomField,
} from './reatomField'
import { take } from '@reatom/effects'
import { AsyncAction, reatomAsync, withAbort } from '@reatom/async'
import { reatomRecord } from '@reatom/primitives'
import { toError } from './utils'

export interface FormFieldAtom<State = any, Value = State>
  extends FieldAtom<State, Value> {
  remove: Action<[], void>
}

export interface Form {
  /** Atom with a list of currently connected fields created by this form's `reatomField` method. */
  fieldsListAtom: Atom<Array<FormFieldAtom>>
  /** Atom with focus state of the form, computed from all the fields in `fieldsListAtom` */
  focusAtom: Atom<FieldFocus>
  /** Submit async handler. It checks the validation of all the fields in `fieldsListAtom`, calls the form's `validate` options handler, and then the `onSubmit` options handler. Check the additional options properties of async action: https://www.reatom.dev/package/async/. */
  onSubmit: AsyncAction<[], void>
  /** The same `reatomField` method, but with bindings to `fieldsListAtom`. */
  reatomField<State, Value>(
    options: FieldOptions<State, Value>,
    name?: string,
  ): FormFieldAtom<State, Value>
  /** Action to reset the state, the value, the validation, and the focus states. */
  reset: Action<[], void>
  /** Atom with validation state of the form, computed from all the fields in `fieldsListAtom` */
  validationAtom: Atom<FieldValidation>
  /** Atom with validation statuses around form `validate` options handler. */
  formValidationAtom: Atom<FieldValidation>
}

export interface FormOptions {
  name?: string
  /** The callback to process valid form data */
  onSubmit: (ctx: Ctx, form: Form) => void | Promise<void>
  /** The callback to handle validation errors on the attempt to submit */
  onSubmitError?: Fn<[ctx: Ctx]>
  /** The callback to validate form fields. */
  validate?: (ctx: Ctx, form: Form) => any
}

export const reatomForm = (
  { name: optionsName, onSubmit, onSubmitError, validate }: FormOptions,
  // this is out of the options for eslint compatibility
  name = optionsName ?? __count('form'),
): Form => {
  const fieldsListAtom = atom<Array<FormFieldAtom>>(
    [],
    `${name}.fieldsListAtom`,
  )
  const focusAtom = atom((ctx, state = fieldInitFocus) => {
    const formFocus = { ...fieldInitFocus }
    for (const fieldAtom of ctx.spy(fieldsListAtom)) {
      const { active, dirty, touched } = ctx.spy(fieldAtom.focusAtom)
      formFocus.active ||= active
      formFocus.dirty ||= dirty
      formFocus.touched ||= touched
    }
    return isShallowEqual(formFocus, state) ? state : formFocus
  }, `${name}.focusAtom`)
  const formValidationAtom: FieldAtom['validationAtom'] = reatomRecord(
    fieldInitValidation,
    `${name}.formValidationAtom`,
  )
  const validationAtom = atom((ctx, state = fieldInitValidation) => {
    const formValid = { ...fieldInitValidation }

    const check = ({ valid, validating, error }: FieldValidation) => {
      formValid.valid &&= valid
      formValid.validating ||= validating
      formValid.error ||= error
    }

    check(ctx.spy(formValidationAtom))

    for (const fieldAtom of ctx.spy(fieldsListAtom)) {
      check(ctx.spy(fieldAtom.validationAtom))
    }

    return isShallowEqual(formValid, state) ? state : formValid
  }, `${name}.validationAtom`)

  const reset = action((ctx) => {
    formValidationAtom.reset(ctx)
    ctx.get(fieldsListAtom).forEach((fieldAtom) => fieldAtom.reset(ctx))
    handleSubmit.abort(ctx)
  }, `${name}.reset`)

  const handleSubmit = reatomAsync(async (ctx) => {
    for (const fieldAtom of ctx.get(fieldsListAtom)) {
      if (!ctx.get(fieldAtom.validationAtom).valid) {
        fieldAtom.validate(ctx)
      }
    }

    let { valid, validating } = ctx.get(validationAtom)

    if (validating) {
      valid = await take(
        ctx,
        validationAtom,
        (ctx, { validating, valid }, skip) => (validating ? skip : valid),
      )
    }

    if (valid) {
      if (validate) {
        try {
          formValidationAtom.merge(ctx, {
            error: undefined,
            valid,
            validating: true,
          })
          const promise = validate(ctx, form)
          if (promise instanceof promise) {
            await ctx.schedule(() => promise)
          }
          formValidationAtom.merge(ctx, { valid, validating: false })
        } catch (error) {
          formValidationAtom.merge(ctx, {
            error: toError(error),
            valid: false,
            validating: false,
          })
          throw error
        }
      }

      await ctx.schedule(() => onSubmit(ctx, form))
    } else {
      onSubmitError?.(ctx)
    }
  }, `${name}.onSubmit`).pipe(withAbort())

  const reatomFormField: Form['reatomField'] = (
    options,
    fieldName = options.name ?? __count(`${typeof options.initState}Field`),
  ) => {
    fieldName = `${name}.${fieldName}`
    const atomField = reatomField(options, fieldName) as FormFieldAtom

    atomField.onChange((ctx) => {
      if (isInit(ctx)) {
        fieldsListAtom(ctx, (list) => [...list, atomField])
      }
    })
    atomField.remove = action((ctx) => {
      fieldsListAtom(ctx, (list) => [...list, atomField])
    }, `${fieldName}.remove`)

    return atomField
  }

  const form: Form = {
    fieldsListAtom,
    focusAtom,
    onSubmit: handleSubmit,
    reatomField: reatomFormField,
    reset,
    validationAtom,
    formValidationAtom,
  }

  return form
}
