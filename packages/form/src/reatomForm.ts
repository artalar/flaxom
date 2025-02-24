import {
  type Action,
  type Atom,
  AtomState,
  type Ctx,
  CtxSpy,
  type Rec,
  __count,
  action,
  atom,
  createCtx,
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
  LinkedListAtom,
  isLinkedListAtom,
  reatomLinkedList,
} from '@reatom/primitives';

import { parseAtoms, withReset, type ParseAtoms } from '@reatom/lens';
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

type FormInitStateElement =
  | string
  | number
  | boolean
  | null
  | undefined
  | File
  | symbol
  | bigint
  | Date
  // TODO contract as parsing method
  // | ((state: any) => any)
  | FieldAtom
  | FormFieldOptions
  | FormFieldArray<any>
  | Array<FormInitStateElement>
  | Rec<FormInitStateElement>

export type FormInitState = Rec<FormInitStateElement | FormInitState>;

type FormFieldElement<T extends FormInitStateElement = FormInitStateElement> =
  T extends FieldLikeAtom
  ? T
  : T extends Date
  ? FieldAtom<T>
  : T extends Array<infer Item>
  ? Item extends FormInitStateElement
  ? FormFieldElement<FormFieldArray<Item, Item>>
  : never
  : T extends FormFieldArray<infer Param, infer Node>
  ? LinkedListAtom<[Param], FormFieldElement<Node>> & {
    reset: Action<[], AtomState<T>>
  }
  : T extends FieldOptions & { initState: infer State }
  ? T extends FieldOptions<State, State>
  ? FieldAtom<State>
  : T extends FieldOptions<State, infer Value>
  ? FieldAtom<State, Value>
  : never
  : T extends Rec
  ? { [K in keyof T]: FormFieldElement<T[K]> }
  : FieldAtom<T>;

export type FormFields<T extends FormInitState = FormInitState> = {
  [K in keyof T]: FormFieldElement<T[K]>
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

  /** The callback to validate form fields. */
  validate?: (ctx: Ctx, state: FormState<T>) => any;

  /** Should reset the state after success submit? @default true */
  resetOnSubmit?: boolean;

  /**
   * Defines the default reset behavior of the validation state during async validation for all fields.
   * @default false
   */
  keepErrorDuringValidating?: boolean

  /**
   * Defines the default reset behavior of the validation state on field change for all fields.
   * Useful if the validation is triggered on blur or submit only.
   * @default !validateOnChange
   */
  keepErrorOnChange?: boolean

  /**
   * Defines if the validation should be triggered with every field change by default for all fields.
   * @default false
   */
  validateOnChange?: boolean

  /**
   * Defines if the validation should be triggered on the field blur by default for all fields.
   * @default false
   */
  validateOnBlur?: boolean
}

const reatomFormFields = <T extends FormInitState>(
  initState: T,
  options: {
    name: string,
    defaultFieldOptions?: FieldOptions
  }
): FormFields<T> => {
  const { name, defaultFieldOptions } = options;
  const fields = Array.isArray(initState)
    ? ([] as FormFields<T>)
    : ({} as FormFields<T>);

  const createFieldElement = (element: FormInitStateElement, name: string): FormFieldElement => {
    if (isAtom(element)) {
      return element
    }
    else if (isObject(element) && !(element instanceof Date)) {
      if (Array.isArray(element)) {
        return createFieldElement(createFieldArray(element), name)
      }
      else if (isFieldArray(element)) {
        // @ts-expect-error bad keys type inference
        return reatomLinkedList({
          create: (ctx, param) => createFieldElement(element.create(ctx, param), `${name}.item`),
          initSnapshot: element.initState.map(state => ([state] as const))
        }, name).pipe(withReset())
      }
      else if ('initState' in element) {
        return reatomField(element.initState, {
          name,
          ...defaultFieldOptions,
          ...(element as FieldOptions),
        });
      }
      else {
        // @ts-expect-error bad keys type inference
        return reatomFormFields(element, { name, defaultFieldOptions })
      }
    }
    else {
      return reatomField(element, { name, ...defaultFieldOptions })
    }
  }

  for (const [key, value] of Object.entries(initState)) {
    // @ts-expect-error bad keys type inference
    fields[key] = createFieldElement(value, `${name}.${key}`);
  }
  return fields;
};

const computeFieldsList = <T extends FormInitState>(
  ctx: CtxSpy,
  fields: FormFields<T>,
  acc: Array<FieldAtom> = [],
): Array<FieldAtom> => {
  const computeElement = (element: FormFieldElement, acc: Array<FieldAtom> = []) => {
    if (isLinkedListAtom(element)) {
      const elements = ctx.spy((element as LinkedListAtom<[FormFieldElement], FormFieldElement>).array);
      acc.push(...elements.flatMap(e => computeElement(e, acc)));
    }
    else if (isAtom(element)) acc.push(element);
    else computeFieldsList(ctx, element, acc);

    return acc;
  }

  for (const [_, field] of entries(fields))
    acc.push(...computeElement(field));

  return acc;
};

interface FormFieldArray<Param, Node extends FormInitStateElement = FormInitStateElement> {
  create: (ctx: Ctx, param: Param) => Node,
  initState: Array<Param>;
  __fieldArray: true;
}

function createFieldArray<Param extends FormInitStateElement>(
  initState: Array<Param>
): FormFieldArray<Param, Param>;

function createFieldArray<Param, Node extends FormInitStateElement = FormInitStateElement>(
  create: ((ctx: Ctx, params: Param) => Node)
): FormFieldArray<Param, Node>;

function createFieldArray<Param, Node extends FormInitStateElement = FormInitStateElement>(
  options: {
    create: (ctx: Ctx, param: Param) => Node
    initState?: Array<Param>,
  }
): FormFieldArray<Param, Node>;

function createFieldArray<Param, Node extends FormInitStateElement = FormInitStateElement>(
  options:
    | Array<Param>
    | ((ctx: Ctx, params: Param) => Node)
    | {
      create: (ctx: Ctx, param: Param) => Node
      initState?: Array<Param>,
    }
): FormFieldArray<Param, Node> {
  const {
    create,
    initState = [],
  } = typeof options === 'function'
      ? { create: options }
      : Array.isArray(options)
        ? { 
          create: (ctx: Ctx, param: Param) => param as unknown as Node,
          initState: options
        }
        : options;

  return {
    create,
    initState,
    __fieldArray: true
  }
}

const isFieldArray = (value: any): value is FormFieldArray<any> => value?.__fieldArray;

export const reatomForm = <T extends FormInitState>(
  initState: T | ((fieldArray: typeof createFieldArray) => T),
  options: string | FormOptions<T> = {},
): Form<T> => {
  const {
    name = __count('form'),
    onSubmit,
    resetOnSubmit = true,
    validate,
    validateOnBlur = false,
    validateOnChange = false,
    keepErrorDuringValidating = false,
    keepErrorOnChange = !validateOnChange,
  } = typeof options === 'string'
      ? ({ name: options } as FormOptions<T>)
      : options;

  const fields = reatomFormFields(initState instanceof Function ? initState(createFieldArray) : initState, {
    name: `${name}.fields`,
    defaultFieldOptions: {
      validateOnBlur,
      validateOnChange,
      keepErrorDuringValidating,
      keepErrorOnChange
    }
  });

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
      if (isLinkedListAtom(fields[key])) {
        // CAUTION: Currently, resetting reatomLinkedList leads to an unconditional error
        fields[key].reset(ctx); // TODO: add recursive reset for structures inside the default value of reatomLinkedList
      }
      else if (
        isObject(value) &&
        !(value instanceof Date) &&
        key in fields &&
        !isAtom(fields[key])
      ) {
        reinitState(ctx, value, fields[key] as unknown as FormFields);
      }
      else if (isAtom(fields[key])) {
        fields[key].initState(ctx, value);
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
