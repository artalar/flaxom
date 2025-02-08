import { type Action, type Atom, type AtomMut, AtomState, type Ctx, CtxSpy, __count, action, atom } from '@reatom/core'
import { __thenReatomed, abortCauseContext, withAbortableSchedule } from '@reatom/effects'
import { type RecordAtom, reatomRecord } from '@reatom/primitives'
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

  /** The field validation meta. */
  meta: unknown | undefined

  /** The validation actuality status. */
  triggered: boolean

  /** The field async validation status */
  validating: boolean
}

export interface FocusAtom extends RecordAtom<FieldFocus> {
  /** Action for handling field focus. */
  in: Action<[], void>

  /** Action for handling field blur. */
  out: Action<[], void>
}

export interface ValidationAtom extends RecordAtom<FieldValidation> {
  /** Action to trigger field validation. */
  trigger: Action<[], FieldValidation>
}

export interface FieldAtom<State = any, Value = State> extends AtomMut<State> {
  /** Action for handling field changes, accepts the "value" parameter and applies it to `toState` option. */
  change: Action<[Value], Value>

  /** Atom of an object with all related focus statuses. */
  focus: FocusAtom

  /** The initial state of the atom. */
  initState: AtomMut<State>

  /** Action to reset the state, the value, the validation, and the focus. */
  reset: Action<[], void>

  /** Atom of an object with all related validation statuses. */
  validation: ValidationAtom

  /** Atom with the "value" data, computed by the `fromState` option */
  value: Atom<Value>
}

export type FieldValidateOption<State = any, Value = State> = (
  ctx: Ctx,
  meta: {
    state: State
    value: Value
    focus: FieldFocus
    validation: FieldValidation
  },
) => any

export interface FieldOptions<State = any, Value = State> {
  /**
   * The callback to filter "value" changes (from the 'change' action). It should return 'false' to skip the update.
   * By default, it always returns `true`.
   */
  filter?: (ctx: Ctx, newValue: Value, prevValue: Value) => boolean

  /**
   * The callback to compute the "value" data from the "state" data.
   * By default, it returns the "state" data without any transformations.
   */
  fromState?: (ctx: CtxSpy, state: State) => Value

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
   * The callback to validate field contract.
   */
  contract?: (state: State) => unknown

  /**
   * Defines the reset behavior of the validation state during async validation.
   * @default false
   */
  keepErrorDuringValidating?: boolean

  /**
   * Defines the reset behavior of the validation state on field change.
   * Useful if the validation is triggered on blur or submit only.
   * @default !validateOnChange
   */
  keepErrorOnChange?: boolean

  /**
   * Defines if the validation should be triggered with every field change.
   * @default false
   */
  validateOnChange?: boolean

  /**
   * Defines if the validation should be triggered on the field blur.
   * @default false
   */
  validateOnBlur?: boolean
}

export const fieldInitFocus: FieldFocus = {
  active: false,
  dirty: false,
  touched: false,
}

export const fieldInitValidation: FieldValidation = {
  error: undefined,
  meta: undefined,
  triggered: false,
  validating: false,
}

export const fieldInitValidationLess: FieldValidation = {
  error: undefined,
  meta: undefined,
  triggered: true,
  validating: false,
}

export const reatomField = <State, Value>(
  _initState: State,
  options: string | FieldOptions<State, Value> = {},
  _stateAtom?: AtomMut<State>
): FieldAtom<State, Value> => {
  interface This extends FieldAtom<State, Value> { }

  const {
    filter = () => true,
    fromState = (ctx, state) => state as unknown as Value,
    isDirty = (ctx, newValue, prevValue) => !isDeepEqual(newValue, prevValue),
    name = __count(`${typeof _initState}Field`),
    toState = (ctx, value) => value as unknown as State,
    validate: validateFn,
    contract,
    validateOnBlur = false,
    validateOnChange = false,
    keepErrorDuringValidating = false,
    keepErrorOnChange = validateOnChange,
  } = typeof options === 'string' ? ({ name: options } as FieldOptions<State, Value>) : options

  const initState = atom(_initState, `${name}.initState`)

  const field = _stateAtom ?? atom(_initState, `${name}.field`);

  const value: This['value'] = atom((ctx) => fromState(ctx, ctx.spy(field)), `${name}.value`)

  const focus = reatomRecord(fieldInitFocus, `${name}.focus`) as This['focus']
  // @ts-expect-error the original computed state can't be typed properly
  focus.__reatom.computer = (ctx, state: FieldFocus) => {
    const dirty = isDirty(ctx, ctx.spy(value), fromState(ctx, ctx.spy(initState)))
    return state.dirty === dirty ? state : { ...state, dirty }
  }

  focus.in = action((ctx) => {
    focus.merge(ctx, { active: true })
  }, `${name}.focus.in`)

  focus.out = action((ctx) => {
    focus.merge(ctx, { active: false, touched: true })
  }, `${name}.focus.out`)

  const validation = reatomRecord(
    validateFn || contract ? fieldInitValidation : fieldInitValidationLess,
    `${name}.validation`,
  ) as This['validation']

  if (validateFn || contract) {
    // @ts-expect-error the original computed state can't be typed properly
    validation.__reatom.computer = (ctx, state: FieldValidation) => {
      ctx.spy(value)
      return state.triggered ? { ...state, triggered: false } : state
    }
  }

  const validationController = atom(new AbortController(), `${name}._validationController`)
  // prevent collisions for different contexts
  validationController.__reatom.initState = () => new AbortController()

  validation.trigger = action((ctx) => {
    const validationValue = ctx.get(validation)

    if (validationValue.triggered) return validationValue
    if (!validateFn && !contract) {
      return validation.merge(ctx, { triggered: true })
    }

    ctx.get(validationController).abort(toAbortError('concurrent'))

    const controller = validationController(ctx, new AbortController())
    abortCauseContext.set(ctx.cause, controller)

    const state = ctx.get(field)
    const valueValue = ctx.get(value)
    const focusValue = ctx.get(focus)
    let promise: any
    let message: undefined | string

    try {
      contract?.(state)
      promise = validateFn?.(withAbortableSchedule(ctx), {
        state,
        value: valueValue,
        focus: focusValue,
        validation: validationValue,
      })
    } catch (error) {
      message = toError(error)
    }

    if (promise instanceof Promise) {
      __thenReatomed(
        ctx,
        promise,
        () => {
          if (controller.signal.aborted) return
          validation.merge(ctx, {
            error: undefined,
            meta: undefined,
            triggered: true,
            validating: false,
          })
        },
        (error) => {
          if (controller.signal.aborted) return
          validation.merge(ctx, {
            error: toError(error),
            meta: undefined,
            triggered: true,
            validating: false,
          })
        },
      ).catch(noop)

      return validation.merge(ctx, {
        error: keepErrorDuringValidating ? validationValue.error : undefined,
        meta: undefined,
        triggered: true,
        validating: true,
      })
    }

    return validation.merge(ctx, {
      validating: false,
      error: message,
      meta: undefined,
      triggered: true,
    })
  }, `${name}.validation.trigger`)

  const change: This['change'] = action((ctx, newValue) => {
    const prevValue = ctx.get(value)

    if (!filter(ctx, newValue, prevValue)) return prevValue

    field(ctx, toState(ctx, newValue))
    focus.merge(ctx, { touched: true })

    return ctx.get(value)
  }, `${name}.change`)

  const reset: This['reset'] = action((ctx) => {
    field(ctx, ctx.get(initState))
    focus(ctx, fieldInitFocus)
    validation(ctx, fieldInitValidation)
    ctx.get(validationController).abort(toAbortError('reset'))
  }, `${name}.reset`)

  if (!keepErrorOnChange) {
    field.onChange((ctx) => {
      validation(ctx, fieldInitValidation)
      ctx.get(validationController).abort(toAbortError('change'))
    })
  }

  if (validateOnChange) {
    field.onChange((ctx) => validation.trigger(ctx))
  }

  if (validateOnBlur) {
    focus.out.onCall((ctx) => validation.trigger(ctx))
  }

  return Object.assign(field, {
    change,
    focus,
    initState,
    reset,
    validation,
    value,
  })
}

export const withField = <T extends AtomMut, Value = AtomState<T>>(
  _initState: AtomState<T>,
  options: Omit<FieldOptions<AtomState<T>, Value>, 'name'> = {}
): ((anAtom: T) => T & FieldAtom<AtomState<T>, Value>) => {
  return (anAtom: T) => Object.assign(
    anAtom,
    reatomField(_initState, { name: anAtom.__reatom.name, ...options }, anAtom)
  );
}
