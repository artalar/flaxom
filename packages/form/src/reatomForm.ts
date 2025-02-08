import {
  type Action,
  type Atom,
  AtomMut,
  AtomState,
  type Ctx,
  type Unsubscribe,
  __count,
  action,
  atom,
} from '@reatom/core';
import { take } from '@reatom/effects';

import {
  reatomAsync,
  withAbort,
  type AsyncAction,
  withErrorAtom,
  withStatusesAtom,
  type AsyncStatusesAtom,
} from '@reatom/async';

import { withAssign } from '@reatom/primitives'
import { isShallowEqual } from '@reatom/utils';

import {
  type FieldAtom,
  type FieldFocus,
  type FieldValidation,
  fieldInitFocus,
  fieldInitValidation,
  reatomField,
  type FieldOptions,
} from './reatomField';
import { isInit } from '@reatom/hooks';

export interface FormFieldOptions<State = any, Value = State>
  extends FieldOptions<State, Value> {
  initState: State;
}

export interface FieldsAtom extends Atom<Array<FieldAtom>> {
  add: Action<[FieldAtom], Unsubscribe>;
  remove: Action<[FieldAtom], void>;
}

export interface SubmitAction extends AsyncAction<[], void> {
  error: Atom<Error | undefined>;
  statusesAtom: AsyncStatusesAtom;
}

export interface FormFieldAtom<State = any, Value = State>
  extends FieldAtom<State, Value> {
  remove: Action<[], void>
}

export interface Form {
  /** Atom with the list of fields in the form */
  fieldsList: FieldsAtom;

  /** The same `reatomField` method, but with bindings to `fieldsList`. */
  reatomField<State, Value>(
    _initState: State,
    options?: string | FieldOptions<State, Value>,
  ): FormFieldAtom<State, Value>;

  /** The same `withField` operator, but with bindings to `fieldsList`. */
  withField: <T extends AtomMut, Value = AtomState<T>>(
    _initState: AtomState<T>,
    options?: Omit<FieldOptions<AtomState<T>, Value>, 'name'>
  ) => ((anAtom: T) => T & FieldAtom<AtomState<T>, Value>)

  /** Atom with the focus state of the form, computed from all the fields in `fieldsList` */
  focus: Atom<FieldFocus>;

  /** Action to reset the state, the value, the validation, and the focus states. */
  reset: Action<[], void>;

  /** Submit async handler. It checks the validation of all the fields in `fieldsList`, calls the form's `validate` options handler, and then the `onSubmit` options handler. Check the additional options properties of async action: https://www.reatom.dev/package/async/. */
  submit: SubmitAction;

  /** Atom with the submitted state of the form, true if the form is submitted and valid, false otherwise initially or after form reset */
  submitted: Atom<boolean>;

  /** Atom with validation state of the form, computed from all the fields in `fieldsList` */
  validation: Atom<FieldValidation>;
}

export interface FormOptions {
  name?: string

  /** The callback to process valid form data */
  onSubmit: (ctx: Ctx, form: Form) => void | Promise<void>

  /** The callback to validate form fields. */
  validate?: (ctx: Ctx, form: Form) => any

  /** Should reset the state after success submit? @default true */
  resetOnSubmit?: boolean;
}

export const reatomForm = (
  { name: optionsName, onSubmit, resetOnSubmit, validate }: FormOptions,
  name = optionsName ?? __count('form'),
): Form => {
  const fieldsList = atom<FieldAtom[]>([], `${name}.fieldsList`).pipe(
    withAssign((list) => ({
      add: action((ctx, fieldAtom) => {
        list(ctx, (list) => [...list, fieldAtom]);
        return () => {
          list(ctx, (list) => list.filter((v) => v !== fieldAtom));
        };
      }),
      remove: action((ctx, fieldAtom) => {
        list(ctx, (list) => list.filter((v) => v !== fieldAtom));
      }),
    }))
  ) satisfies FieldsAtom;

  const focus = atom((ctx, state = fieldInitFocus) => {
    const formFocus = { ...fieldInitFocus };

    for (const field of ctx.spy(fieldsList)) {
      const { active, dirty, touched } = ctx.spy(field.focus);
      formFocus.active ||= active;
      formFocus.dirty ||= dirty;
      formFocus.touched ||= touched;
    }

    return isShallowEqual(formFocus, state) ? state : formFocus;
  }, `${name}.focus`);

  const validation = atom((ctx, state = fieldInitValidation) => {
    const formValid = { ...fieldInitValidation };
    formValid.triggered = true;

    for (const field of ctx.spy(fieldsList)) {
      const { triggered, validating, error } = ctx.spy(field.validation);

      formValid.triggered &&= triggered;
      formValid.validating ||= validating;
      formValid.error ||= error;
    }

    return isShallowEqual(formValid, state) ? state : formValid;
  }, `${name}.validation`);

  const submitted = atom(false, `${name}.submitted`);

  const reset = action((ctx) => {
    ctx.get(fieldsList).forEach((fieldAtom) => fieldAtom.reset(ctx));
    submitted(ctx, false);
    submit.errorAtom.reset(ctx);
    submit.abort(ctx, `${name}.reset`);
  }, `${name}.reset`);

  const submit = reatomAsync(async (ctx) => {
    ctx.get(() => {
      for (const field of ctx.get(fieldsList)) {
        if (!ctx.get(field.validation).triggered) {
          field.validation.trigger(ctx);
        }
      }
    });

    if (ctx.get(validation).validating) {
      await take(ctx, validation, (ctx, { validating }, skip) => {
        if (validating) return skip;
      });
    }

    const error = ctx.get(validation).error;

    if (error) throw new Error(error);

    if (validate) {
      const promise = validate(ctx, form);
      if (promise instanceof promise) {
        await ctx.schedule(() => promise);
      }
    }

    if (onSubmit) await ctx.schedule(() => onSubmit(ctx, form));

    submitted(ctx, true);

    if (resetOnSubmit) {
      // do not use `reset` action here to not abort the success
      ctx.get(fieldsList).forEach((fieldAtom) => fieldAtom.reset(ctx));
      submit.errorAtom.reset(ctx);
      submit.statusesAtom.reset(ctx);
      submitted(ctx, false);
    }
  }, `${name}.onSubmit`).pipe(
    withStatusesAtom(),
    withAbort(),
    withErrorAtom(undefined, { resetTrigger: 'onFulfill' }),
    (submit) => Object.assign(submit, { error: submit.errorAtom }),
  );

  const reatomFormField = ((
    _initState,
    options = {},
    _stateAtom?: AtomMut<typeof _initState> | undefined
  ) => {
    const {
      name: fieldName = __count(`${typeof _initState}Field`),
      ...restOptions
    } = typeof options === 'string' ? { name: options } : options

    const atomField = reatomField(_initState, {
      name: `${name}.${fieldName}`,
      ...restOptions
    }, _stateAtom) as FormFieldAtom;

    atomField.onChange((ctx) => {
      if (isInit(ctx)) {
        fieldsList.add(ctx, atomField)
      }
    })

    atomField.remove = action((ctx) => {
      fieldsList.remove(ctx, atomField)
    }, `${fieldName}.remove`)

    return atomField
  }) satisfies Form['reatomField']

  const withField: Form['withField'] = (_initState, options) => (
    anAtom => Object.assign(
      anAtom,
      reatomFormField(_initState, { name, ...options }, anAtom)
    )
  );

  const form = {
    fieldsList,
    focus,
    reset,
    submit,
    submitted,
    validation,
    reatomField: reatomFormField,
    withField
  }

  return form;
};
