import {
  type Action,
  type Atom,
  type Ctx,
  CtxSpy,
  type Rec,
  __count,
  action,
  atom,
  isAtom,
} from '@reatom/core';

import { take } from '@reatom/effects';

import {
  type AsyncAction,
  withErrorAtom,
  withStatusesAtom,
  type AsyncStatusesAtom,
  reatomAsync,
  withAbort,
} from '@reatom/async';

import {
  ArrayAtom,
  SetAtom,
  LinkedListAtom,
  isLinkedListAtom,
  isSetAtom,
  isArrayAtom
} from '@reatom/primitives';

import { parseAtoms, type ParseAtoms } from '@reatom/lens';
import { entries, isObject, isShallowEqual } from '@reatom/utils';

import {
  type FieldAtom,
  type FieldFocus,
  type FieldValidation,
  fieldInitFocus,
  fieldInitValidation,
  reatomField,
  type FieldOptions,
  FieldLikeAtom,
} from './reatomField';

export interface FormFieldOptions<State = any, Value = State>
  extends FieldOptions<State, Value> {
  initState: State;
}

export type FormFieldArray =
  | ArrayAtom<FieldAtom>
  | SetAtom<FieldAtom>
  | LinkedListAtom<[], FieldAtom>;

export type FormInitState = Rec<
  | string
  | number
  | boolean
  | null
  | undefined
  | File
  | symbol
  | bigint
  | Date
  | Array<any>
  // TODO contract as parsing method
  // | ((state: any) => any)
  | FormFieldArray
  | FieldAtom
  | FormFieldOptions
  | FormInitState
>;

export type FormFields<T extends FormInitState = FormInitState> = {
  [K in keyof T]: T[K] extends FieldLikeAtom
  ? T[K]
  : T[K] extends Date
  ? FieldAtom<T[K]>
  : T[K] extends FieldOptions & { initState: infer State }
  ? T[K] extends FieldOptions<State, State>
  ? FieldAtom<State>
  : T[K] extends FieldOptions<State, infer Value>
  ? FieldAtom<State, Value>
  : never
  : T[K] extends FormFieldArray
  ? T[K]
  : T[K] extends Rec
  ? FormFields<T[K]>
  : FieldAtom<T[K]>;
};

export type FormState<T extends FormInitState = FormInitState> = ParseAtoms<
  FormFields<T>
>;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Rec ? DeepPartial<T[K]> : T[K];
};

export type FormPartialState<T extends FormInitState = FormInitState> =
  DeepPartial<FormState<T>>;

export interface SubmitAction extends AsyncAction<[], void> {
  error: Atom<Error | undefined>;
  statusesAtom: AsyncStatusesAtom;
}

export interface Form<T extends FormInitState = any> {
  /** Fields from the init state */
  fields: FormFields<T>;

  /** Atom with the state of the form, computed from all the fields in `fieldsList` */
  fieldsState: Atom<FormState<T>>;

  /** Atom with focus state of the form, computed from all the fields in `fieldsList` */
  focus: Atom<FieldFocus>;

  init: Action<[initState: FormPartialState<T>], void>;

  /** Action to reset the state, the value, the validation, and the focus states. */
  reset: Action<[], void>;

  /** Submit async handler. It checks the validation of all the fields in `fieldsList`, calls the form's `validate` options handler, and then the `onSubmit` options handler. Check the additional options properties of async action: https://www.reatom.dev/package/async/. */
  submit: SubmitAction;

  submitted: Atom<boolean>;

  /** Atom with validation state of the form, computed from all the fields in `fieldsList` */
  validation: Atom<FieldValidation>;
}

export interface FormOptions<T extends FormInitState = any> {
  name?: string;

  /** The callback to process valid form data */
  onSubmit?: (ctx: Ctx, state: FormState<T>) => void | Promise<void>;

  /** Should reset the state after success submit? @default true */
  resetOnSubmit?: boolean;

  /** The callback to validate form fields. */
  validate?: (ctx: Ctx, state: FormState<T>) => any;
}

const reatomFormFields = <T extends FormInitState>(
  initState: T,
  name: string,
): FormFields<T> => {
  const fields = Array.isArray(initState)
    ? ([] as FormFields<T>)
    : ({} as FormFields<T>);
  for (const [key, value] of Object.entries(initState)) {
    if (isAtom(value)) {
      // @ts-expect-error bad keys type inference
      fields[key] = value;
    } else if (isObject(value) && !(value instanceof Date)) {
      if ('initState' in value) {
        // @ts-expect-error bad keys type inference
        fields[key] = reatomField(value.initState, {
          name: `${name}.${key}`,
          ...(value as FieldOptions),
        });
      } else {
        // @ts-expect-error bad keys type inference
        fields[key] = reatomFormFields(value, `${name}.${key}`);
      }
    } else {
      // @ts-expect-error bad keys type inference
      fields[key] = reatomField(value, {
        name: `${name}.${key}`,
      });
    }
  }
  return fields;
};

const computeFieldsList = <T extends FormInitState>(
  ctx: CtxSpy,
  fields: FormFields<T>,
  acc: Array<FieldAtom> = [],
): Array<FieldAtom> => {
  for (const [_, field] of entries(fields)) {
    if (isArrayAtom(field)) acc.push(...ctx.spy(field));
    else if (isSetAtom(field)) acc.push(...ctx.spy(field));
    else if (isLinkedListAtom(field)) acc.push(...ctx.spy(field.array));
    else if (isAtom(field)) acc.push(field as FieldAtom);
    else computeFieldsList(ctx, field as FormFields, acc);
  }
  return acc;
};

export const reatomForm = <T extends FormInitState>(
  initState: T,
  options: string | FormOptions<T> = {},
): Form<T> => {
  const {
    name = __count('form'),
    onSubmit,
    resetOnSubmit = true,
    validate,
  } = typeof options === 'string'
      ? ({ name: options } as FormOptions<T>)
      : options;

  const fields = reatomFormFields(initState, `${name}.fields`);

  const fieldsState = atom(
    (ctx) => parseAtoms(ctx, fields),
    `${name}.fieldsState`,
  );

  const fieldsList = atom(ctx => computeFieldsList(ctx, fields), `${name}.fieldsList`);

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

  const reinitState = (ctx: Ctx, initState: FormPartialState<T>, fields: FormFields) => {
    for (const [key, value] of Object.entries(initState as Rec)) {
      if (
        isObject(value) &&
        !(value instanceof Date) &&
        key in fields &&
        !isAtom(fields[key])
      ) {
        reinitState(ctx, value, fields[key] as unknown as FormFields);
      } else {
        fields[key]?.initState(ctx, value);
      }
    }
  };

  const init = action((ctx, initState: FormPartialState<T>) => {
    reinitState(ctx, initState, fields as FormFields);
  }, `${name}.init`);

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

    const state = ctx.get(fieldsState);

    if (validate) {
      const promise = validate(ctx, state);
      if (promise instanceof promise) {
        await ctx.schedule(() => promise);
      }
    }

    if (onSubmit) await ctx.schedule(() => onSubmit(ctx, state));

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

  return {
    fields,
    fieldsState,
    focus,
    init,
    reset,
    submit,
    submitted,
    validation,
  };
};
