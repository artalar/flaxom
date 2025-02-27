import {
  action,
  Action,
  Atom,
  atom,
  AtomMut,
  Ctx,
  Fn,
  Rec,
  throwReatomError,
  Unsubscribe,
} from '@reatom/core'
import { addOnUpdate } from '@reatom/hooks'
import { reatomRecord, RecordAtom } from '@reatom/primitives'
import { isObject } from '@reatom/utils'
import {
  FieldAtom,
  FieldOptions,
  Form,
  FormOptions,
  reatomForm,
} from '@reatom/form'

export interface HTMLFieldOptions<State = any, Value = State>
  extends FieldOptions<State, Value> {
  // TODO is it possible to remove it?
  atomName?: string
}

export interface HTMLFieldAtom<
  T = string,
  El extends HTMLElement = HTMLInputElement,
> extends FieldAtom<T> {
  // TODO rename to `propertiesAtom` or change the types to real attributes
  attributesAtom: RecordAtom<Partial<El>>
  elementAtom: Atom<null | El>
  register: Action<[null | El]>
}

export type HTMLInputAttributes<T extends string = string> = Partial<
  Omit<HTMLInputElement, 'type'>
> & {
  type?: T
}

export const UNSUPPORTED_INPUT_TYPES = [
  'button',
  'file',
  'hidden',
  'image',
  'range',
  'submit',
  'datetime',
] as const

export const INPUT_TEXT_TYPES = [
  'color',
  'date',
  'datetime-local',
  'email',
  'month',
  'password',
  'radio',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
] as const
export type INPUT_TEXT_TYPES = (typeof INPUT_TEXT_TYPES)[number]

const getType = (initState: unknown) => {
  if (Array.isArray(initState)) return 'select'

  const stateType = typeof initState

  if (stateType === 'number') return 'number'
  if (stateType === 'boolean') return 'checkbox'

  return 'text'
}

const getElementValue = (
  el: HTMLInputElement | HTMLSelectElement,
  type: string,
) => {
  if (type === 'number') {
    return +(el as HTMLInputElement).value
  }
  if (type === 'checkbox' || type === 'radio') {
    return (el as HTMLInputElement).checked
  }
  if (type === 'select') {
    const res = []
    for (const { value } of (el as HTMLSelectElement).selectedOptions) {
      res.push(value)
    }
    return res
  }
  return el.value
}
const setElementValue = (el: HTMLElement, type: string, value: any) => {
  if (type === 'checkbox' || type === 'radio') {
    ;(el as HTMLInputElement).checked = value
  }
  if (type === 'select') {
    for (const option of (el as HTMLSelectElement).selectedOptions) {
      if (value.includes(option.value)) option.selected = true
    }
  } else {
    ;(el as HTMLInputElement).value = value
  }
}

const getAttributes = (el: HTMLElement) =>
  Object.keys(el).reduce((acc, k) => {
    if (!k.startsWith('_')) {
      // @ts-expect-error
      const v = el[k]
      acc[k] = v
    }
    return acc
  }, {} as Rec)

// @ts-ignore
export const withHtmlRegistration: {
  (
    attributes?: HTMLInputAttributes<INPUT_TEXT_TYPES>,
  ): Fn<[FieldAtom<string>], HTMLFieldAtom<string>>
  (
    attributes?: HTMLInputAttributes<'number'>,
  ): Fn<[FieldAtom<number>], HTMLFieldAtom<number>>
  (
    attributes?: HTMLInputAttributes<'checkbox'>,
  ): Fn<[FieldAtom<boolean>], HTMLFieldAtom<boolean>>
  (
    attributes?: Partial<HTMLSelectElement>,
  ): Fn<[FieldAtom<string[]>], HTMLFieldAtom<string[], HTMLSelectElement>>
  // TODO
  // <T extends FieldAtom<[]>>(options: { multiple?: boolean }): Fn<[T], HTMLFieldAtom<HTMLSelectElement, T>>
  // <T extends FieldAtom<string>>(options: { multiple?: boolean }): Fn<[T], HTMLFieldAtom<HTMLTextAreaElement, T>>
  // radio
} =
  (attributes: HTMLInputAttributes | Partial<HTMLSelectElement> = {}) =>
  (fieldAtom: FieldAtom) => {
    const { type = getType(fieldAtom.initState) } =
      attributes as HTMLInputAttributes
    const name = fieldAtom.__reatom.name?.replace('.dataAtom', '')
    // TODO onUpdate(fieldAtom.reset, (ctx) => attributesAtom(ctx, attributes))
    const attributesAtom = reatomRecord(
      attributes,
      name?.concat('.attributesAtom'),
    )
    const elementAtom = atom<null | HTMLElement>(
      null,
      name?.concat('.elementAtom'),
    )
    const unsubscribeAtom = atom<null | Unsubscribe>(null)

    const register: HTMLFieldAtom['register'] = action((ctx, el) => {
      // TODO warn?
      if (el === ctx.get(elementAtom)) return

      if (el === null) {
        const un = ctx.get(unsubscribeAtom)
        unsubscribeAtom(ctx, null)
        un?.()
        return
      }
      // TODO
      // throwReatomError(
      //   !(el instanceof HTMLInputElement),
      //   'unsupported element kind',
      // )
      if (
        [HTMLInputElement, HTMLTextAreaElement, HTMLSelectElement].every(
          (HTMLElement) => el instanceof HTMLElement === false,
        )
      ) {
        throw new Error('Unsupported element kind')
      }

      let lastInput = ctx.get(fieldAtom)
      if (type === 'select' && lastInput.length === 0) {
        lastInput = fieldAtom(ctx, getElementValue(el, type))
      }

      // TODO https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity
      const validateNative = action((ctx) => {
        const validation = ctx.get(fieldAtom.validationAtom)

        return validation.validating || !validation.valid || el.checkValidity()
          ? validation
          : fieldAtom.validationAtom(ctx, (state) => ({
              ...state,
              valid: false,
              error: el.validationMessage,
            }))
      }, name?.concat('.validateNative'))

      elementAtom(ctx, el)
      attributesAtom.merge(ctx, getAttributes(el))

      const handleFocus = () => fieldAtom.focus(ctx)
      const handleBlur = () => fieldAtom.blur(ctx)
      const changeInput = action((ctx) => {
        const _lastInput = lastInput
        ctx.schedule(
          () => setElementValue(el, type, (lastInput = _lastInput)),
          -1,
        )

        const input = getElementValue(el, type)

        if (ctx.get(fieldAtom) !== fieldAtom.change(ctx, input)) {
          lastInput = input
        } else {
          setElementValue(el, type, lastInput)
        }
      }, name?.concat('.changeInput'))
      const handleChange = () => changeInput(ctx)
      const handleChangeAttributes = (
        ctx: Ctx,
        { state }: { state: typeof attributes },
      ) => {
        Object.assign(el, state)
        ctx.schedule(() => {
          // TODO
          console.warn('Element assign rollback is not implemented')
        }, -1)
      }

      // TODO codestyle
      const un = ctx.subscribe(fieldAtom, () => {})
      ctx.schedule(un, -1)

      ctx.schedule(() => {
        // TODO el to attributesAtom by MutationObserver (optional)
        // FIXME ctx origin!
        addOnUpdate(fieldAtom.validate, validateNative)
        addOnUpdate(attributesAtom, handleChangeAttributes)

        Object.assign(el, ctx.get(attributesAtom))
        setElementValue(el, type, lastInput)

        el.addEventListener('focus', handleFocus)
        el.addEventListener('blur', handleBlur)
        el.addEventListener('input', handleChange)
      })

      unsubscribeAtom(ctx, () => () => {
        fieldAtom.validate.__reatom.updateHooks!.delete(validateNative)
        attributesAtom.__reatom.updateHooks!.delete(handleChangeAttributes)

        el.removeEventListener('focus', handleFocus)
        el.removeEventListener('blur', handleBlur)
        el.removeEventListener('input', handleChange)

        ctx.get(() => {
          un()
          elementAtom(ctx, null)
        })
      })
    }, name?.concat('.register'))

    ;(fieldAtom.reset.__reatom.updateHooks ??= new Set()).add((ctx) => {
      const el = ctx.get(elementAtom)
      if (el) {
        setElementValue(el, type, fieldAtom.initState)
        // FIXME: do not work
        el.dispatchEvent(new Event('formReset', { bubbles: false }))
      }
    })

    return Object.assign(fieldAtom, {
      attributesAtom,
      elementAtom,
      register,
    })
  }

export type HTMLForm = Form & {
  elementAtom: Atom<null | HTMLFormElement>
  onHTMLSubmit: Action<[event: SubmitEvent]>
  reatomHTMLField: {
    (initState: string, name?: string): HTMLFieldAtom<string>
    (initState: number, name?: string): HTMLFieldAtom<number>
    (initState: boolean, name?: string): HTMLFieldAtom<boolean>
    (
      initState: [],
      name?: string,
    ): HTMLFieldAtom<Array<string>, HTMLSelectElement>
    <T extends string>(
      initState: Array<T>,
      name?: string,
    ): HTMLFieldAtom<Array<T>, HTMLSelectElement>
    <T extends Rec<boolean>>(
      initState: T,
      name?: string,
    ): AtomMut<undefined | keyof T> & {
      [K in keyof T]: HTMLFieldAtom<boolean>
    }
    (
      options: HTMLFieldOptions<string> & HTMLInputAttributes<INPUT_TEXT_TYPES>,
    ): HTMLFieldAtom<string>
    (
      options: HTMLFieldOptions<number> & HTMLInputAttributes<'number'>,
    ): HTMLFieldAtom<number>
    (
      options: HTMLFieldOptions<boolean> &
        HTMLInputAttributes<'checkbox' | 'radio'>,
    ): HTMLFieldAtom<boolean>
    (
      options: HTMLFieldOptions<[]> & Partial<HTMLSelectElement>,
    ): HTMLFieldAtom<string[], HTMLSelectElement>
    <T extends string>(
      options: HTMLFieldOptions<Array<T>> & Partial<HTMLSelectElement>,
    ): HTMLFieldAtom<Array<T>, HTMLSelectElement>
    <T extends Rec<boolean>>(
      options: HTMLFieldOptions<T> & HTMLInputAttributes<'radio'>,
    ): AtomMut<keyof T> & {
      [K in keyof T]: HTMLFieldAtom<boolean>
    }
  }
  reatomHTMLFields<
    T extends Rec<
      | string
      | number
      | boolean
      | []
      | Array<string>
      | Rec<boolean>
      | HTMLFieldOptions
    >,
  >(
    fieldsOptions: T,
  ): {
    [K in keyof T]: T[K] extends string
      ? HTMLFieldAtom<string>
      : T[K] extends number
        ? HTMLFieldAtom<number>
        : T[K] extends boolean
          ? HTMLFieldAtom<boolean>
          : T[K] extends []
            ? HTMLFieldAtom<Array<string>, HTMLSelectElement>
            : T[K] extends Array<infer T extends string>
              ? HTMLFieldAtom<Array<T>, HTMLSelectElement>
              : T[K] extends Rec<boolean>
                ? AtomMut<undefined | keyof T[K]> & {
                    [k in keyof T[K]]: HTMLFieldAtom<boolean>
                  }
                : T[K] extends HTMLFieldOptions<string> &
                      HTMLInputAttributes<INPUT_TEXT_TYPES>
                  ? HTMLFieldAtom<string>
                  : T[K] extends HTMLFieldOptions<number> &
                        HTMLInputAttributes<'number'>
                    ? HTMLFieldAtom<number>
                    : T[K] extends HTMLFieldOptions<boolean> &
                          HTMLInputAttributes<'checkbox' | 'radio'>
                      ? HTMLFieldAtom<boolean>
                      : T[K] extends HTMLFieldOptions<[]> &
                            Partial<HTMLSelectElement>
                        ? HTMLFieldAtom<string[], HTMLSelectElement>
                        : T[K] extends HTMLFieldOptions<
                              Array<infer T extends string>
                            > &
                              Partial<HTMLSelectElement>
                          ? HTMLFieldAtom<Array<T>, HTMLSelectElement>
                          : T[K] extends HTMLFieldOptions<Rec<boolean>> &
                                HTMLInputAttributes<'radio'>
                            ? AtomMut<keyof T[K]> & {
                                [k in keyof T[K]]: HTMLFieldAtom<boolean>
                              }
                            : never
  }
  register: Action<[null | HTMLFormElement]>
}

export type HTMLFormOptions = FormOptions & {
  focusOnError?: boolean
  preventDefault?: boolean
}

export const reatomHTMLForm = ({
  focusOnError = true,
  preventDefault = true,
  ...options
}: HTMLFormOptions): HTMLForm => {
  const { name, onSubmitError } = options

  if (focusOnError) {
    options = {
      ...options,
      onSubmitError(ctx) {
        let htmlFieldAtom
        for (const fieldAtom of ctx.get(form.fieldsListAtom)) {
          const { valid, validating } = ctx.get(fieldAtom.validationAtom)

          if (!valid) {
            htmlFieldAtom = fieldAtom as unknown as HTMLFieldAtom
            break
          }

          if (validating) htmlFieldAtom = fieldAtom as unknown as HTMLFieldAtom
        }

        if (htmlFieldAtom?.elementAtom) {
          // TODO
          // if(options.shouldFocusOnError) ctx.get(htmlFieldAtom.elementAtom)?.focus()
        }

        onSubmitError?.(ctx)
      },
    }
  }

  const form = reatomForm(options)

  const elementAtom = atom<null | HTMLFormElement>(
    null,
    name?.concat('.elementAtom'),
  )
  const unsubscribeAtom = atom<null | Unsubscribe>(null)

  const register: HTMLForm['register'] = action((ctx, el) => {
    if (el === null) {
      const un = ctx.get(unsubscribeAtom)
      unsubscribeAtom(ctx, null)
      un?.()
      return
    }

    throwReatomError(ctx.get(elementAtom), 'form already registered')

    elementAtom(ctx, el)

    const handleSubmit = (event: SubmitEvent) => {
      onHTMLSubmit(ctx, event)
    }

    ctx.schedule(() => {
      el.addEventListener('submit', handleSubmit)
    })

    unsubscribeAtom(ctx, () => () => {
      el.removeEventListener('submit', handleSubmit)
      elementAtom(ctx, null)
    })
  }, name?.concat('.register'))

  // @ts-expect-error
  const reatomHTMLField: HTMLForm['reatomHTMLField'] = (options, fieldName) => {
    const {
      filter,
      initState,
      validate,
      validationTrigger,
      ...attributes
    }: HTMLFieldOptions =
      isObject(options) && 'initState' in options
        ? options
        : { initState: options }

    attributes.name ??= fieldName
    const { atomName = attributes.name } = attributes

    if (isObject(initState) && !Array.isArray(initState)) {
      const kv = Object.entries(initState)

      throwReatomError(
        kv.length === 0 || kv.some(([k, v]) => typeof v !== 'boolean'),
        'unexpected initState',
      )

      // TODO throwReatomError(!attributes.name, 'radio required name')
      attributes.name ??= `radio${(Math.random() * 1e5) | 0}`

      const radios = kv.reduce((acc, [k, v]) => {
        acc[k] = reatomHTMLField({
          atomName: `${atomName}(${k})`,
          filter,
          initState: v as boolean,
          type: 'radio',
          validate,
          validationTrigger,
          ...attributes,
        })

        return acc
      }, {} as Rec)

      const theAtom = Object.assign(
        atom(
          (ctx) =>
            kv.reduce<string | undefined>(
              (acc, [value]) => (ctx.spy(radios[value]) ? value : acc),
              undefined,
            ),
          name ? `${name}.${attributes.name}` : attributes.name,
        ),
        radios,
      )

      return theAtom
    }
    // @ts-ignore
    /* prettier-ignore */ return form.reatomField({ filter, initState, name: name ? `${name}.${atomName}` : atomName, validate, validationTrigger }).pipe(withHtmlRegistration(attributes))
  }

  const reatomHTMLFields: HTMLForm['reatomHTMLFields'] = (fields) =>
    Object.entries(fields).reduce(
      (acc, [k, v]) => {
        // @ts-expect-error
        acc[k] = reatomHTMLField(v, k)
        return acc
      },
      {} as ReturnType<HTMLForm['reatomHTMLFields']>,
    )

  const onHTMLSubmit = action((ctx, event: SubmitEvent) => {
    preventDefault && event.preventDefault()
    form.onSubmit(ctx)
  }, name?.concat('.onHTMLSubmit'))

  const touched = new WeakSet()
  form.fieldsListAtom.onChange((ctx, list) => {
    for (const fieldAtom of list) {
      if (touched.has(fieldAtom)) continue
      touched.add(fieldAtom)
      fieldAtom.onChange((ctx, value) => {
        const el = ctx.get((fieldAtom as unknown as HTMLFieldAtom).elementAtom)
        if (el) el.value = ctx.get(fieldAtom.valueAtom)
      })
    }
  })

  return {
    ...form,
    elementAtom,
    onHTMLSubmit,
    reatomHTMLField,
    reatomHTMLFields,
    register,
  }
}
