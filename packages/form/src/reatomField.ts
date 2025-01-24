import { action, Action, Atom, atom, AtomMut, Ctx, __count, AtomCache } from '@reatom/core'
import { __thenReatomed } from '@reatom/effects'
import { RecordAtom, reatomRecord } from '@reatom/primitives'
import { isDeepEqual, noop, toAbortError } from '@reatom/utils'
import { toError } from './utils'

export interface FieldFocus {
  /** The field is focused. */
  active: boolean

  /** The field state is not equal to the initial state. */
  dirty: boolean

  /** The field has ever gained and lost focus. */
  touched: boolean
}

export interface FieldValidation {
  /** The field validation error text. */
  error: undefined | string

  /** The field validation status. */
  valid: boolean

  /** The field async validation status */
  validating: boolean
}

export interface FieldActions<Value = any> {
  /** Action for handling field blur. */
  blur: Action<[], void>

  /** Action for handling field changes, accepts the "value" parameter and applies it to `toState` option. */
  change: Action<[Value], Value>

  /** Action for handling field focus. */
  focus: Action<[], void>

  /** Action to reset the state, the value, the validation, and the focus. */
  reset: Action<[], void>

  /** Action to trigger field validation. */
  validate: Action<[], FieldValidation>
}

export interface FieldAtom<State = any, Value = State> extends AtomMut<State>, FieldActions<Value> {
  /** Atom of an object with all related focus statuses. */
  focusAtom: RecordAtom<FieldFocus>

  /** The initial state of the atom, readonly. */
  initState: State

  /** Atom of an object with all related validation statuses. */
  validationAtom: RecordAtom<FieldValidation>

  /** Atom with the "value" data, computed by the `fromState` option */
  valueAtom: Atom<Value>
}

export interface FieldValidateOption<State = any, Value = State> {
  (
    ctx: Ctx,
    meta: {
      state: State
      value: Value
      focus: FieldFocus
      validation: FieldValidation
    },
  ): any
}

export interface FieldOptions<State = any, Value = State> {
  /**
   * The callback to filter "value" changes (from the 'change' action). It should return 'false' to skip the update.
   * By default, it always returns `false`.
   */
  filter?: (ctx: Ctx, newValue: Value, prevValue: Value) => boolean

  /**
   * The callback to compute the "value" data from the "state" data.
   * By default, it returns the "state" data without any transformations.
   */
  fromState?: (ctx: Ctx, state: State) => Value

  /**
   * The initial state of the atom, which is the only required option.
   */
  initState: State

  /**
   * The callback used to determine whether the "value" has changed.
   * By default, it utilizes `isDeepEqual` from reatom/utils.
   */
  isDirty?: (ctx: Ctx, newValue: Value, prevValue: Value) => boolean

  /**
   * The name of the field and all related atoms and actions.
   */
  name?: string

  /**
   * The callback to transform the "state" data from the "value" data from the `change` action.
   * By default, it returns the "value" data without any transformations.
   */
  toState?: (ctx: Ctx, value: Value) => State

  /**
   * The callback to validate the field.
   */
  validate?: FieldValidateOption<State, Value>

  /**
   * Defines the reset behavior of the validation state during async validation.
   * It is `false` by default.
   */
  keepErrorDuringValidating?: boolean

  /**
   * @deprecated Use boolean flags instead. It is `blur` by default.
   */
  validationTrigger?: 'change' | 'blur' | 'submit'

  /**
   * Defines if the validation should be triggered with every field change. By default computes from the `validationTrigger` option and `!validateOnBlur`.
   */
  validateOnChange?: boolean

  /**
   * Defines if the validation should be triggered on the field blur. By default computes from the `validationTrigger` option.
   */
  validateOnBlur?: boolean
}

interface AbortableCause extends AtomCache {
  controller: AbortController
}

export const fieldInitFocus: FieldFocus = {
  active: false,
  dirty: false,
  touched: false,
}

export const fieldInitValidation: FieldValidation = {
  error: undefined,
  valid: false,
  validating: false,
}

export const fieldInitValidationLess: FieldValidation = {
  error: undefined,
  valid: true,
  validating: false,
}

export const reatomField = <State, Value>(
  {
    filter = () => true,
    fromState = (ctx, state) => state as unknown as Value,
    initState,
    isDirty = (ctx, newValue, prevValue) => !isDeepEqual(newValue, prevValue),
    name: optionsName,
    toState = (ctx, value) => value as unknown as State,
    validate: validateFn,
    keepErrorDuringValidating = false,
    validationTrigger = 'blur',
    validateOnBlur = validationTrigger === 'blur',
    validateOnChange = validationTrigger === 'change' && !validateOnBlur,
  }: FieldOptions<State, Value>,
  // this is out of the options for eslint compatibility
  name = optionsName ?? __count(`${typeof initState}Field`),
): FieldAtom<State, Value> => {
  interface This extends FieldAtom<State, Value> {}
  const fieldAtom = atom(initState, `${name}.fieldAtom`) as This

  const valueAtom: This['valueAtom'] = atom((ctx) => fromState(ctx, ctx.spy(fieldAtom)), `${name}.valueAtom`)

  const focusAtom: This['focusAtom'] = reatomRecord(fieldInitFocus, `${name}.focusAtom`)
  // @ts-expect-error
  focusAtom.__reatom.computer = (ctx, state: FieldFocus) => {
    const dirty = isDirty(ctx, ctx.spy(valueAtom), fromState(ctx, initState))
    return state.dirty === dirty ? state : { ...state, dirty }
  }

  const validationAtom: This['validationAtom'] = reatomRecord(
    validateFn ? fieldInitValidation : fieldInitValidationLess,
    `${name}.validationAtom`,
  )
  if (validateFn) {
    // @ts-expect-error
    validationAtom.__reatom.computer = (ctx, state: FieldValidation) => {
      ctx.spy(valueAtom)
      return state.valid ? { ...state, valid: false } : state
    }
  }

  const validateControllerAtom = atom(new AbortController(), `${name}.validateControllerAtom`)
  // prevent collisions for different contexts
  validateControllerAtom.__reatom.initState = () => new AbortController()
  const validate: This['validate'] = action((ctx) => {
    const validation = ctx.get(validationAtom)

    if (validation.valid) return validation
    if (!validateFn) return validationAtom.merge(ctx, { valid: true })

    ctx.get(validateControllerAtom).abort(toAbortError('concurrent'))
    const controller = validateControllerAtom(ctx, ((ctx.cause as AbortableCause).controller = new AbortController()))

    const state = ctx.get(fieldAtom)
    const value = ctx.get(valueAtom)
    const focus = ctx.get(focusAtom)

    try {
      var promise = validateFn(ctx, {
        state,
        value,
        focus,
        validation,
      })
    } catch (error) {
      var message: undefined | string = toError(error)
    }

    if (promise instanceof Promise) {
      __thenReatomed(
        ctx,
        promise,
        () => {
          if (controller.signal.aborted) return
          validationAtom.merge(ctx, {
            error: undefined,
            valid: true,
            validating: false,
          })
        },
        (error) => {
          if (controller.signal.aborted) return
          validationAtom.merge(ctx, {
            error: toError(error),
            valid: true,
            validating: false,
          })
        },
      ).catch(noop)

      return validationAtom.merge(ctx, {
        error: keepErrorDuringValidating ? validation.error : undefined,
        valid: true,
        validating: true,
      })
    }

    return validationAtom.merge(ctx, {
      validating: false,
      error: message,
      valid: true,
    })
  }, `${name}.validate`)

  const focus: This['focus'] = action((ctx) => {
    focusAtom.merge(ctx, { active: true })
  }, `${name}.focus`)

  const blur: This['blur'] = action((ctx) => {
    focusAtom.merge(ctx, { active: false, touched: true })
  }, `${name}.blur`)

  const change: This['change'] = action((ctx, newValue) => {
    const prevValue = ctx.get(valueAtom)

    if (!filter(ctx, newValue, prevValue)) return prevValue

    fieldAtom(ctx, toState(ctx, newValue))
    focusAtom.merge(ctx, { touched: true })

    return ctx.get(valueAtom)
  }, `${name}.change`)

  const reset: This['reset'] = action((ctx) => {
    fieldAtom(ctx, initState)
    focusAtom(ctx, fieldInitFocus)
    validationAtom(ctx, fieldInitValidation)
    ctx.get(validateControllerAtom).abort(toAbortError('reset'))
  }, `${name}.reset`)

  if (validateOnChange) {
    fieldAtom.onChange((ctx) => validate(ctx))
  }

  if (validateOnBlur) {
    blur.onCall((ctx) => validate(ctx))
  }

  return Object.assign(fieldAtom, {
    blur,
    change,
    focus,
    reset,
    validate,

    focusAtom,
    initState,
    validationAtom,
    valueAtom,
  })
}
