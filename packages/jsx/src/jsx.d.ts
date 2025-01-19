/*
Respectfully copied from https://github.com/ryansolid/dom-expressions/blob/ae71a417aa13b33517082628aff09513629df8b2/packages/dom-expressions/src/jsx.d.ts
*/

import * as csstype from 'csstype'
import { Atom, AtomMaybe, AtomMut, Ctx } from '@reatom/core'
import { LinkedListLikeAtom, LinkedList, LLNode } from '@reatom/primitives'

// TODO write it manually to improve perf
type AttributesAtomMaybe<T extends Record<keyof any, any>> = {
  [K in keyof T]: T[K] | Atom<T[K]>
}

// TODO write it manually to improve perf
type ElementsAttributesAtomMaybe<T extends Record<keyof any, any>> = {
  [K in keyof T]: AttributesAtomMaybe<T[K]>
}

export namespace JSX {
  type Element = HTMLElement | SVGElement

  type ElementPrimitiveChildren = Node | Element | (string & {}) | number | boolean | null | undefined

  type ElementChildren =
    | Array<ElementChildren | AtomMaybe<ElementPrimitiveChildren>>
    | AtomMaybe<ElementPrimitiveChildren>
    | ElementPrimitiveChildren

  interface ElementClass {
    // empty, libs can define requirements downstream
  }

  interface ElementAttributes<T> {
    [k: `attr:${string}`]: unknown
  }

  interface ElementProperties<T> {
    [k: `prop:${string}`]: unknown
  }

  interface $Spread<T> {
    $spread?: Partial<this>
  }

  interface ElementChildrenAttribute {
    children: {}
  }

  interface CssAttributes {
    css?: string
    [css: `css:${string}`]: string | number | false | null | undefined
  }

  interface EventHandler<T extends Element = Element, E extends Event = Event> {
    (
      ctx: Ctx,
      e: E & {
        currentTarget: T
        target: Element
      },
    ): void
  }

  interface MouseEventHandler<T extends Element = Element, E extends MouseEvent = MouseEvent> {
    (
      ctx: Ctx,
      e: E & {
        currentTarget: T
        target: Element
      },
    ): void
  }

  interface InputEventHandler<T = HTMLInputElement, E extends InputEvent = InputEvent> {
    (
      ctx: Ctx,
      e: E & {
        currentTarget: T
        target: T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement ? T : Element
      },
    ): void
  }

  interface ChangeEventHandler<T = HTMLInputElement, E extends Event = Event> {
    (
      ctx: Ctx,
      e: E & {
        currentTarget: T
        target: T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement ? T : Element
      },
    ): void
  }

  interface FocusEventHandler<T = HTMLInputElement, E extends FocusEvent = FocusEvent> {
    (
      ctx: Ctx,
      e: E & {
        currentTarget: T
        target: T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement ? T : Element
      },
    ): void
  }

  // const SERIALIZABLE: unique symbol
  // interface SerializableAttributeValue {
  //   toString(): string
  //   [SERIALIZABLE]: never
  // }

  interface IntrinsicAttributes {
    // TODO?
    // ref?: (ctx: Ctx, e: unknown) => void | (() => any)
  }
  interface CustomAttributes<T> {
    ref?: (ctx: Ctx, el: T) => void | ((ctx: Ctx, el: T) => any)
    // classList?: {
    //   [k: string]: boolean | undefined
    // }
  }
  interface Directives {}
  interface DirectiveFunctions {
    [x: string]: (el: Element, accessor: Atom<any>) => void
  }
  interface ExplicitProperties {}
  interface ExplicitAttributes {}
  interface CustomEvents {}
  type DirectiveAttributes = {
    [Key in keyof Directives as `use:${Key}`]?: Directives[Key]
  }
  type DirectiveFunctionAttributes<T> = {
    [K in keyof DirectiveFunctions as string extends K ? never : `use:${K}`]?: DirectiveFunctions[K] extends (
      el: infer E, // will be unknown if not provided
      ...rest: infer R // use rest so that we can check whether it's provided or not
    ) => void
      ? T extends E // everything extends unknown if E is unknown
        ? R extends [infer A] // check if has accessor provided
          ? A extends Atom<infer V>
            ? V // it's an accessor
            : never // it isn't, type error
          : true // no accessor provided
        : never // T is the wrong element
      : never // it isn't a function
  }
  type PropAttributes = {
    [Key in keyof ExplicitProperties as `prop:${Key}`]?: AtomMaybe<ExplicitProperties[Key]>
  }
  type AttrAttributes = {
    [Key in keyof ExplicitAttributes as `attr:${Key}`]?: AtomMaybe<ExplicitAttributes[Key]>
  }
  type OnAttributes<T> = {
    [Key in keyof CustomEvents as `on:${Key}`]?: EventHandler<T, CustomEvents[Key]>
  }
  interface DOMAttributes<T>
    extends CustomAttributes<T>,
      DirectiveAttributes,
      DirectiveFunctionAttributes<T>,
      PropAttributes,
      AttrAttributes,
      OnAttributes<T>,
      CustomEventHandlers<T> {
    children?: ElementChildren | LinkedListLikeAtom<LinkedList<LLNode<Element>>>
    innerHTML?: AtomMaybe<string>
    innerText?: AtomMaybe<string | number>
    textContent?: AtomMaybe<string | number>
    'on:copy'?: EventHandler<T, ClipboardEvent>
    'on:cut'?: EventHandler<T, ClipboardEvent>
    'on:paste'?: EventHandler<T, ClipboardEvent>
    'on:compositionend'?: EventHandler<T, CompositionEvent>
    'on:compositionstart'?: EventHandler<T, CompositionEvent>
    'on:compositionupdate'?: EventHandler<T, CompositionEvent>
    'on:focusout'?: FocusEventHandler<T, FocusEvent>
    'on:focusin'?: FocusEventHandler<T, FocusEvent>
    'on:encrypted'?: EventHandler<T, Event>
    'on:dragexit'?: EventHandler<T, DragEvent>
  }
  /**
   * @type {GlobalEventHandlers}
   */
  interface CustomEventHandlers<T> {
    'on:abort'?: EventHandler<T, Event>
    'on:animationend'?: EventHandler<T, AnimationEvent>
    'on:animationiteration'?: EventHandler<T, AnimationEvent>
    'on:animationstart'?: EventHandler<T, AnimationEvent>
    'on:auxclick'?: EventHandler<T, MouseEvent>
    'on:beforeinput'?: InputEventHandler<T, InputEvent>
    'on:blur'?: FocusEventHandler<T, FocusEvent>
    'on:canplay'?: EventHandler<T, Event>
    'on:canplaythrough'?: EventHandler<T, Event>
    'on:change'?: ChangeEventHandler<T, Event>
    'on:click'?: EventHandler<T, MouseEvent>
    'on:contextmenu'?: EventHandler<T, MouseEvent>
    'on:dblclick'?: EventHandler<T, MouseEvent>
    'on:drag'?: EventHandler<T, DragEvent>
    'on:dragend'?: EventHandler<T, DragEvent>
    'on:dragenter'?: EventHandler<T, DragEvent>
    'on:dragleave'?: EventHandler<T, DragEvent>
    'on:dragover'?: EventHandler<T, DragEvent>
    'on:dragstart'?: EventHandler<T, DragEvent>
    'on:drop'?: EventHandler<T, DragEvent>
    'on:durationchange'?: EventHandler<T, Event>
    'on:emptied'?: EventHandler<T, Event>
    'on:ended'?: EventHandler<T, Event>
    'on:error'?: EventHandler<T, Event>
    'on:focus'?: FocusEventHandler<T, FocusEvent>
    'on:gotpointercapture'?: EventHandler<T, PointerEvent>
    'on:input'?: InputEventHandler<T, InputEvent>
    'on:invalid'?: EventHandler<T, Event>
    'on:keydown'?: EventHandler<T, KeyboardEvent>
    'on:keypress'?: EventHandler<T, KeyboardEvent>
    'on:keyup'?: EventHandler<T, KeyboardEvent>
    'on:load'?: EventHandler<T, Event>
    'on:loadeddata'?: EventHandler<T, Event>
    'on:loadedmetadata'?: EventHandler<T, Event>
    'on:loadstart'?: EventHandler<T, Event>
    'on:lostpointercapture'?: EventHandler<T, PointerEvent>
    'on:mousedown'?: EventHandler<T, MouseEvent>
    'on:mouseenter'?: EventHandler<T, MouseEvent>
    'on:mouseleave'?: EventHandler<T, MouseEvent>
    'on:mousemove'?: EventHandler<T, MouseEvent>
    'on:mouseout'?: EventHandler<T, MouseEvent>
    'on:mouseover'?: EventHandler<T, MouseEvent>
    'on:mouseup'?: EventHandler<T, MouseEvent>
    'on:pause'?: EventHandler<T, Event>
    'on:play'?: EventHandler<T, Event>
    'on:playing'?: EventHandler<T, Event>
    'on:pointercancel'?: EventHandler<T, PointerEvent>
    'on:pointerdown'?: EventHandler<T, PointerEvent>
    'on:pointerenter'?: EventHandler<T, PointerEvent>
    'on:pointerleave'?: EventHandler<T, PointerEvent>
    'on:pointermove'?: EventHandler<T, PointerEvent>
    'on:pointerout'?: EventHandler<T, PointerEvent>
    'on:pointerover'?: EventHandler<T, PointerEvent>
    'on:pointerup'?: EventHandler<T, PointerEvent>
    'on:progress'?: EventHandler<T, Event>
    'on:ratechange'?: EventHandler<T, Event>
    'on:reset'?: EventHandler<T, Event>
    'on:scroll'?: EventHandler<T, Event>
    'on:scrollend'?: EventHandler<T, Event>
    'on:seeked'?: EventHandler<T, Event>
    'on:seeking'?: EventHandler<T, Event>
    'on:select'?: EventHandler<T, UIEvent>
    'on:stalled'?: EventHandler<T, Event>
    'on:submit'?: EventHandler<
      T,
      Event & {
        submitter: HTMLElement
      }
    >
    'on:suspend'?: EventHandler<T, Event>
    'on:timeupdate'?: EventHandler<T, Event>
    'on:touchcancel'?: EventHandler<T, TouchEvent>
    'on:touchend'?: EventHandler<T, TouchEvent>
    'on:touchmove'?: EventHandler<T, TouchEvent>
    'on:touchstart'?: EventHandler<T, TouchEvent>
    'on:transitionstart'?: EventHandler<T, TransitionEvent>
    'on:transitionend'?: EventHandler<T, TransitionEvent>
    'on:transitionrun'?: EventHandler<T, TransitionEvent>
    'on:transitioncancel'?: EventHandler<T, TransitionEvent>
    'on:volumechange'?: EventHandler<T, Event>
    'on:waiting'?: EventHandler<T, Event>
    'on:wheel'?: EventHandler<T, WheelEvent>
  }

  /** Controls automatic capitalization in inputted text. */
  type HTMLAutocapitalize = 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters'
  // TODO add combinations
  /**
   * The autocomplete attribute provides a hint to the user agent specifying how to, or indeed whether to, prefill a form control.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
   */
  type HTMLAutocomplete =
    | 'additional-name'
    | 'address-level1'
    | 'address-level2'
    | 'address-level3'
    | 'address-level4'
    | 'address-line1'
    | 'address-line2'
    | 'address-line3'
    | 'bday-day'
    | 'bday-month'
    | 'bday-year'
    | 'bday'
    | 'billing'
    | 'cc-additional-name'
    | 'cc-csc'
    | 'cc-exp-month'
    | 'cc-exp-year'
    | 'cc-exp'
    | 'cc-family-name'
    | 'cc-given-name'
    | 'cc-name'
    | 'cc-number'
    | 'cc-type'
    | 'country-name'
    | 'country'
    | 'current-password'
    | 'email'
    | 'family-name'
    | 'fax'
    | 'given-name'
    | 'home'
    | 'honorific-prefix'
    | 'honorific-suffix'
    | 'impp'
    | 'language'
    | 'mobile'
    | 'name'
    | 'new-password'
    | 'nickname'
    | 'off'
    | 'on'
    | 'one-time-code'
    | 'organization-title'
    | 'organization'
    | 'page'
    | 'photo'
    | 'postal-code'
    | 'sex'
    | 'shipping'
    | 'street-address'
    | 'tel-area-code'
    | 'tel-country-code'
    | 'tel-extension'
    | 'tel-local-prefix'
    | 'tel-local-suffix'
    | 'tel-local'
    | 'tel-national'
    | 'tel'
    | 'transaction-amount'
    | 'transaction-currency'
    | 'url'
    | 'username'
    | 'webauthn'
    | 'work'
    | `section-${string}`
    | (string & {})
  type HTMLDir = 'ltr' | 'rtl' | 'auto'
  type HTMLFormEncType = 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain'
  type HTMLFormMethod = 'post' | 'get' | 'dialog'
  type HTMLCrossorigin = 'anonymous' | 'use-credentials' | ''
  type HTMLReferrerPolicy =
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
  type HTMLIframeSandbox =
    | 'allow-downloads-without-user-activation'
    | 'allow-downloads'
    | 'allow-forms'
    | 'allow-modals'
    | 'allow-orientation-lock'
    | 'allow-pointer-lock'
    | 'allow-popups'
    | 'allow-popups-to-escape-sandbox'
    | 'allow-presentation'
    | 'allow-same-origin'
    | 'allow-scripts'
    | 'allow-storage-access-by-user-activation'
    | 'allow-top-navigation'
    | 'allow-top-navigation-by-user-activation'
    | 'allow-top-navigation-to-custom-protocols'
  type HTMLLinkAs =
    | 'audio'
    | 'document'
    | 'embed'
    | 'fetch'
    | 'font'
    | 'image'
    | 'object'
    | 'script'
    | 'style'
    | 'track'
    | 'video'
    | 'worker'

  // All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
  interface AriaAttributes {
    /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
    'aria-activedescendant'?: string
    /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
    'aria-atomic'?: boolean | 'false' | 'true'
    /**
     * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
     * presented if they are made.
     */
    'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both'
    /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
    'aria-busy'?: boolean | 'false' | 'true'
    /**
     * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
     * @see aria-pressed @see aria-selected.
     */
    'aria-checked'?: boolean | 'false' | 'mixed' | 'true'
    /**
     * Defines the total number of columns in a table, grid, or treegrid.
     * @see aria-colindex.
     */
    'aria-colcount'?: number | string
    /**
     * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
     * @see aria-colcount @see aria-colspan.
     */
    'aria-colindex'?: number | string
    /**
     * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
     * @see aria-colindex @see aria-rowspan.
     */
    'aria-colspan'?: number | string
    /**
     * Identifies the element (or elements) whose contents or presence are controlled by the current element.
     * @see aria-owns.
     */
    'aria-controls'?: string
    /** Indicates the element that represents the current item within a container or set of related elements. */
    'aria-current'?: boolean | 'false' | 'true' | 'page' | 'step' | 'location' | 'date' | 'time'
    /**
     * Identifies the element (or elements) that describes the object.
     * @see aria-labelledby
     */
    'aria-describedby'?: string
    /**
     * Identifies the element that provides a detailed, extended description for the object.
     * @see aria-describedby.
     */
    'aria-details'?: string
    /**
     * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
     * @see aria-hidden @see aria-readonly.
     */
    'aria-disabled'?: boolean | 'false' | 'true'
    /**
     * Indicates what functions can be performed when a dragged object is released on the drop target.
     * @deprecated in ARIA 1.1
     */
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup'
    /**
     * Identifies the element that provides an error message for the object.
     * @see aria-invalid @see aria-describedby.
     */
    'aria-errormessage'?: string
    /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
    'aria-expanded'?: boolean | 'false' | 'true'
    /**
     * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
     * allows assistive technology to override the general default of reading in document source order.
     */
    'aria-flowto'?: string
    /**
     * Indicates an element's "grabbed" state in a drag-and-drop operation.
     * @deprecated in ARIA 1.1
     */
    'aria-grabbed'?: boolean | 'false' | 'true'
    /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
    'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
    /**
     * Indicates whether the element is exposed to an accessibility API.
     * @see aria-disabled.
     */
    'aria-hidden'?: boolean | 'false' | 'true'
    /**
     * Indicates the entered value does not conform to the format expected by the application.
     * @see aria-errormessage.
     */
    'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling'
    /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
    'aria-keyshortcuts'?: string
    /**
     * Defines a string value that labels the current element.
     * @see aria-labelledby.
     */
    'aria-label'?: string
    /**
     * Identifies the element (or elements) that labels the current element.
     * @see aria-describedby.
     */
    'aria-labelledby'?: string
    /** Defines the hierarchical level of an element within a structure. */
    'aria-level'?: number | string
    /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
    'aria-live'?: 'off' | 'assertive' | 'polite'
    /** Indicates whether an element is modal when displayed. */
    'aria-modal'?: boolean | 'false' | 'true'
    /** Indicates whether a text box accepts multiple lines of input or only a single line. */
    'aria-multiline'?: boolean | 'false' | 'true'
    /** Indicates that the user may select more than one item from the current selectable descendants. */
    'aria-multiselectable'?: boolean | 'false' | 'true'
    /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
    'aria-orientation'?: 'horizontal' | 'vertical'
    /**
     * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
     * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
     * @see aria-controls.
     */
    'aria-owns'?: string
    /**
     * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
     * A hint could be a sample value or a brief description of the expected format.
     */
    'aria-placeholder'?: string
    /**
     * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
     * @see aria-setsize.
     */
    'aria-posinset'?: number | string
    /**
     * Indicates the current "pressed" state of toggle buttons.
     * @see aria-checked @see aria-selected.
     */
    'aria-pressed'?: boolean | 'false' | 'mixed' | 'true'
    /**
     * Indicates that the element is not editable, but is otherwise operable.
     * @see aria-disabled.
     */
    'aria-readonly'?: boolean | 'false' | 'true'
    /**
     * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
     * @see aria-atomic.
     */
    'aria-relevant'?:
      | 'additions'
      | 'additions removals'
      | 'additions text'
      | 'all'
      | 'removals'
      | 'removals additions'
      | 'removals text'
      | 'text'
      | 'text additions'
      | 'text removals'
    /** Indicates that user input is required on the element before a form may be submitted. */
    'aria-required'?: boolean | 'false' | 'true'
    /** Defines a human-readable, author-localized description for the role of an element. */
    'aria-roledescription'?: string
    /**
     * Defines the total number of rows in a table, grid, or treegrid.
     * @see aria-rowindex.
     */
    'aria-rowcount'?: number | string
    /**
     * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
     * @see aria-rowcount @see aria-rowspan.
     */
    'aria-rowindex'?: number | string
    /**
     * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
     * @see aria-rowindex @see aria-colspan.
     */
    'aria-rowspan'?: number | string
    /**
     * Indicates the current "selected" state of various widgets.
     * @see aria-checked @see aria-pressed.
     */
    'aria-selected'?: boolean | 'false' | 'true'
    /**
     * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
     * @see aria-posinset.
     */
    'aria-setsize'?: number | string
    /** Indicates if items in a table or grid are sorted in ascending or descending order. */
    'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other'
    /** Defines the maximum allowed value for a range widget. */
    'aria-valuemax'?: number | string
    /** Defines the minimum allowed value for a range widget. */
    'aria-valuemin'?: number | string
    /**
     * Defines the current value for a range widget.
     * @see aria-valuetext.
     */
    'aria-valuenow'?: number | string
    /** Defines the human readable text alternative of aria-valuenow for a range widget. */
    'aria-valuetext'?: string
    role?:
      | 'alert'
      | 'alertdialog'
      | 'application'
      | 'article'
      | 'banner'
      | 'button'
      | 'cell'
      | 'checkbox'
      | 'columnheader'
      | 'combobox'
      | 'complementary'
      | 'contentinfo'
      | 'definition'
      | 'dialog'
      | 'directory'
      | 'document'
      | 'feed'
      | 'figure'
      | 'form'
      | 'grid'
      | 'gridcell'
      | 'group'
      | 'heading'
      | 'img'
      | 'link'
      | 'list'
      | 'listbox'
      | 'listitem'
      | 'log'
      | 'main'
      | 'marquee'
      | 'math'
      | 'menu'
      | 'menubar'
      | 'menuitem'
      | 'menuitemcheckbox'
      | 'menuitemradio'
      | 'meter'
      | 'navigation'
      | 'none'
      | 'note'
      | 'option'
      | 'presentation'
      | 'progressbar'
      | 'radio'
      | 'radiogroup'
      | 'region'
      | 'row'
      | 'rowgroup'
      | 'rowheader'
      | 'scrollbar'
      | 'search'
      | 'searchbox'
      | 'separator'
      | 'slider'
      | 'spinbutton'
      | 'status'
      | 'switch'
      | 'tab'
      | 'table'
      | 'tablist'
      | 'tabpanel'
      | 'term'
      | 'textbox'
      | 'timer'
      | 'toolbar'
      | 'tooltip'
      | 'tree'
      | 'treegrid'
      | 'treeitem'
  }

  // TODO: Should we allow this?
  // type ClassKeys = `class:${string}`;
  type StylePropertiesKeys = Exclude<keyof csstype.PropertiesHyphen, `-${string}`>
  /** @todo Should we use `csstype.PropertiesHyphenFallback`? */
  type StyleProperties = {
    [key in StylePropertiesKeys]?: csstype.PropertiesHyphen[key] | null
  }
  type StylePropertyAttributes = {
    [key in StylePropertiesKeys as `style:${key}`]?: StyleProperties[key]
  }

  interface CSSProperties extends StyleProperties {
    // Override
    [key: `-${string}`]: string | number | null | undefined
  }

  interface HTMLAttributes<T = HTMLElement>
    extends AriaAttributes,
      DOMAttributes<T>,
      CssAttributes,
      StylePropertyAttributes,
      ElementAttributes<T>,
      ElementProperties<T>,
      $Spread<T> {
    // [key: ClassKeys]: boolean;
    accessKey?: string
    class?: string | undefined
    /** Alias for `class`. */
    className?: string | undefined
    contenteditable?: boolean | 'plaintext-only' | 'inherit'
    contextmenu?: string
    dir?: HTMLDir
    draggable?: 'false' | 'true'
    hidden?: boolean | 'hidden' | 'until-found'
    id?: string
    inert?: boolean
    lang?: string
    spellcheck?: boolean
    style?: CSSProperties | string
    tabindex?: number | string
    title?: string
    translate?: 'yes' | 'no'
    about?: string
    datatype?: string
    inlist?: any
    popover?: boolean | 'manual' | 'auto'
    prefix?: string
    property?: string
    resource?: string
    typeof?: string
    vocab?: string
    autocapitalize?: HTMLAutocapitalize
    slot?: string
    color?: string
    itemprop?: string
    itemscope?: boolean
    itemtype?: string
    itemid?: string
    itemref?: string
    part?: string
    exportparts?: string
    inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  }
  interface AnchorHTMLAttributes<T = HTMLElementTagNameMap['anchor']> extends HTMLAttributes<T> {
    download?: any
    href?: string
    hreflang?: string
    media?: string
    ping?: string
    referrerpolicy?: HTMLReferrerPolicy
    rel?: string
    target?: string
    type?: string
    referrerPolicy?: HTMLReferrerPolicy
  }
  interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> {}
  interface AreaHTMLAttributes<T = HTMLElementTagNameMap['area']> extends HTMLAttributes<T> {
    alt?: string
    coords?: string
    download?: any
    href?: string
    hreflang?: string
    ping?: string
    referrerpolicy?: HTMLReferrerPolicy
    rel?: string
    shape?: 'rect' | 'circle' | 'poly' | 'default'
    target?: string
    referrerPolicy?: HTMLReferrerPolicy
  }
  interface BaseHTMLAttributes<T = HTMLElementTagNameMap['base']> extends HTMLAttributes<T> {
    href?: string
    target?: string
  }
  interface BlockquoteHTMLAttributes<T = HTMLElementTagNameMap['blockquote']> extends HTMLAttributes<T> {
    cite?: string
  }
  interface ButtonHTMLAttributes<T = HTMLElementTagNameMap['button']> extends HTMLAttributes<T> {
    autofocus?: boolean
    disabled?: boolean
    form?: string
    formaction?: string // | SerializableAttributeValue
    formenctype?: HTMLFormEncType
    formmethod?: HTMLFormMethod
    formnovalidate?: boolean
    formtarget?: string
    popovertarget?: string
    popovertargetaction?: 'hide' | 'show' | 'toggle'
    name?: string
    type?: 'submit' | 'reset' | 'button'
    value?: string
  }
  interface CanvasHTMLAttributes<T = HTMLElementTagNameMap['canvas']> extends HTMLAttributes<T> {
    width?: number | string
    height?: number | string
  }
  interface ColHTMLAttributes<T = HTMLElementTagNameMap['col']> extends HTMLAttributes<T> {
    span?: number | string
    width?: number | string
  }
  interface ColgroupHTMLAttributes<T = HTMLElementTagNameMap['colgroup']> extends HTMLAttributes<T> {
    span?: number | string
  }
  interface DataHTMLAttributes<T = HTMLElementTagNameMap['data']> extends HTMLAttributes<T> {
    value?: string | string[] | number
  }
  interface DetailsHtmlAttributes<T = HTMLElementTagNameMap['details']> extends HTMLAttributes<T> {
    open?: boolean
    ontoggle?: EventHandler<T, Event>
  }
  interface DialogHtmlAttributes<T = HTMLElementTagNameMap['dialog']> extends HTMLAttributes<T> {
    open?: boolean
    'on:close'?: EventHandler<T, Event>
    'on:cancel'?: EventHandler<T, Event>
  }
  interface EmbedHTMLAttributes<T = HTMLElementTagNameMap['embed']> extends HTMLAttributes<T> {
    height?: number | string
    src?: string
    type?: string
    width?: number | string
  }
  interface FieldsetHTMLAttributes<T = HTMLElementTagNameMap['fieldset']> extends HTMLAttributes<T> {
    disabled?: boolean
    form?: string
    name?: string
  }
  interface FormHTMLAttributes<T = HTMLElementTagNameMap['form']> extends HTMLAttributes<T> {
    'accept-charset'?: string
    action?: string // | SerializableAttributeValue
    autocomplete?: HTMLAutocomplete
    encoding?: HTMLFormEncType
    enctype?: HTMLFormEncType
    method?: HTMLFormMethod
    name?: string
    novalidate?: boolean
    target?: string
  }
  interface IframeHTMLAttributes<T = HTMLElementTagNameMap['iframe']> extends HTMLAttributes<T> {
    allow?: string
    allowfullscreen?: boolean
    height?: number | string
    loading?: 'eager' | 'lazy'
    name?: string
    referrerpolicy?: HTMLReferrerPolicy
    sandbox?: HTMLIframeSandbox | string
    src?: string
    srcdoc?: string
    width?: number | string
  }
  interface ImgHTMLAttributes<T = HTMLElementTagNameMap['img']> extends HTMLAttributes<T> {
    alt?: string
    crossorigin?: HTMLCrossorigin
    decoding?: 'sync' | 'async' | 'auto'
    height?: number | string
    ismap?: boolean
    loading?: 'eager' | 'lazy'
    referrerpolicy?: HTMLReferrerPolicy
    sizes?: string
    src?: string
    srcset?: string
    usemap?: string
    width?: number | string
    elementtiming?: string
    fetchpriority?: 'high' | 'low' | 'auto'
  }
  interface InputHTMLAttributes<T = HTMLElementTagNameMap['input']> extends HTMLAttributes<T> {
    accept?: string
    alt?: string
    autocomplete?: HTMLAutocomplete
    autocorrect?: 'on' | 'off'
    autofocus?: boolean
    capture?: boolean | string
    checked?: boolean
    crossorigin?: HTMLCrossorigin
    disabled?: boolean
    enterkeyhint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send'
    form?: string
    formaction?: string // | SerializableAttributeValue
    formenctype?: HTMLFormEncType
    formmethod?: HTMLFormMethod
    formnovalidate?: boolean
    formtarget?: string
    height?: number | string
    incremental?: boolean
    list?: string
    max?: number | string
    maxlength?: number | string
    min?: number | string
    minlength?: number | string
    multiple?: boolean
    name?: string
    pattern?: string
    placeholder?: string
    readonly?: boolean
    results?: number
    required?: boolean
    size?: number | string
    src?: string
    step?: number | string
    type?: /** A push button with no default behavior displaying the value of the value attribute, empty by default. */
    | 'button'
      /** A check box allowing single values to be selected/deselected. */
      | 'checkbox'
      /** A control for specifying a color; opening a color picker when active in supporting browsers. */
      | 'color'
      /** A control for entering a date (year, month, and day, with no time). Opens a date picker or numeric wheels for year, month, day when active in supporting browsers. */
      | 'date'
      /** A control for entering a date and time, with no time zone. Opens a date picker or numeric wheels for date- and time-components when active in supporting browsers. */
      | 'datetime-local'
      /** A field for editing an email address. Looks like a text input, but has validation parameters and relevant keyboard in supporting browsers and devices with dynamic keyboards. */
      | 'email'
      /** A control that lets the user select a file. Use the accept attribute to define the types of files that the control can select. */
      | 'file'
      /** A control that is not displayed but whose value is submitted to the server. There is an example in the next column, but it's hidden! */
      | 'hidden'
      /** A graphical submit button. Displays an image defined by the src attribute. The alt attribute displays if the image src is missing. */
      | 'image'
      /** A control for entering a month and year, with no time zone. */
      | 'month'
      /** A control for entering a number. Displays a spinner and adds default validation. Displays a numeric keypad in some devices with dynamic keypads. */
      | 'number'
      /** A single-line text field whose value is obscured. Will alert user if site is not secure. */
      | 'password'
      /** A radio button, allowing a single value to be selected out of multiple choices with the same name value. */
      | 'radio'
      /** A control for entering a number whose exact value is not important. Displays as a range widget defaulting to the middle value. Used in conjunction min and max to define the range of acceptable values. */
      | 'range'
      /** A button that resets the contents of the form to default values. Not recommended. */
      | 'reset'
      /** A single-line text field for entering search strings. Line-breaks are automatically removed from the input value. May include a delete icon in supporting browsers that can be used to clear the field. Displays a search icon instead of enter key on some devices with dynamic keypads. */
      | 'search'
      /** A button that submits the form. */
      | 'submit'
      /** A control for entering a telephone number. Displays a telephone keypad in some devices with dynamic keypads. */
      | 'tel'
      /** The default value. A single-line text field. Line-breaks are automatically removed from the input value. */
      | 'text'
      /** A control for entering a time value with no time zone. */
      | 'time'
      /** A field for entering a URL. Looks like a text input, but has validation parameters and relevant keyboard in supporting browsers and devices with dynamic keyboards. */
      | 'url'
      /** A control for entering a date consisting of a week-year number and a week number with no time zone. */
      | 'week'
    value?: string | string[] | number
    width?: number | string

    'model:value'?: AtomMut<string>
    'model:valueAsNumber'?: AtomMut<number>
    'model:checked'?: AtomMut<boolean>
  }
  interface InsHTMLAttributes<T = HTMLElementTagNameMap['ins']> extends HTMLAttributes<T> {
    cite?: string
    datetime?: string
  }
  interface KeygenHTMLAttributes<T = HTMLElementTagNameMap['keygen']> extends HTMLAttributes<T> {
    autofocus?: boolean
    challenge?: string
    disabled?: boolean
    form?: string
    keytype?: string
    keyparams?: string
    name?: string
  }
  interface LabelHTMLAttributes<T = HTMLElementTagNameMap['label']> extends HTMLAttributes<T> {
    for?: string
    form?: string
  }
  interface LiHTMLAttributes<T = HTMLElementTagNameMap['li']> extends HTMLAttributes<T> {
    value?: number | string
  }
  interface LinkHTMLAttributes<T = HTMLElementTagNameMap['link']> extends HTMLAttributes<T> {
    as?: HTMLLinkAs
    crossorigin?: HTMLCrossorigin
    disabled?: boolean
    fetchpriority?: 'high' | 'low' | 'auto'
    href?: string
    hreflang?: string
    imagesizes?: string
    imagesrcset?: string
    integrity?: string
    media?: string
    referrerpolicy?: HTMLReferrerPolicy
    rel?: string
    sizes?: string
    type?: string
  }
  interface MapHTMLAttributes<T = HTMLElementTagNameMap['map']> extends HTMLAttributes<T> {
    name?: string
  }
  interface MediaHTMLAttributes<T = HTMLElementTagNameMap['media']> extends HTMLAttributes<T> {
    autoplay?: boolean
    controls?: boolean
    crossorigin?: HTMLCrossorigin
    loop?: boolean
    mediagroup?: string
    muted?: boolean
    preload?: 'none' | 'metadata' | 'auto' | ''
    src?: string
  }
  interface MenuHTMLAttributes<T = HTMLElementTagNameMap['menu']> extends HTMLAttributes<T> {
    label?: string
    type?: 'context' | 'toolbar'
  }
  interface MetaHTMLAttributes<T = HTMLElementTagNameMap['meta']> extends HTMLAttributes<T> {
    charset?: string
    content?: string
    'http-equiv'?: string
    name?: string
    media?: string
  }
  interface MeterHTMLAttributes<T = HTMLElementTagNameMap['meter']> extends HTMLAttributes<T> {
    form?: string
    high?: number | string
    low?: number | string
    max?: number | string
    min?: number | string
    optimum?: number | string
    value?: string | string[] | number
  }
  interface QuoteHTMLAttributes<T = HTMLElementTagNameMap['quote']> extends HTMLAttributes<T> {
    cite?: string
  }
  interface ObjectHTMLAttributes<T = HTMLElementTagNameMap['object']> extends HTMLAttributes<T> {
    data?: string
    form?: string
    height?: number | string
    name?: string
    type?: string
    usemap?: string
    width?: number | string
    useMap?: string
  }
  interface OlHTMLAttributes<T = HTMLElementTagNameMap['ol']> extends HTMLAttributes<T> {
    reversed?: boolean
    start?: number | string
    type?: '1' | 'a' | 'A' | 'i' | 'I'
  }
  interface OptgroupHTMLAttributes<T = HTMLElementTagNameMap['optgroup']> extends HTMLAttributes<T> {
    disabled?: boolean
    label?: string
  }
  interface OptionHTMLAttributes<T = HTMLElementTagNameMap['option']> extends HTMLAttributes<T> {
    disabled?: boolean
    label?: string
    selected?: boolean
    value?: string | string[] | number
  }
  interface OutputHTMLAttributes<T = HTMLElementTagNameMap['output']> extends HTMLAttributes<T> {
    form?: string
    for?: string
    name?: string
  }
  interface ParamHTMLAttributes<T = HTMLElementTagNameMap['param']> extends HTMLAttributes<T> {
    name?: string
    value?: string | string[] | number
  }
  interface ProgressHTMLAttributes<T = HTMLElementTagNameMap['progress']> extends HTMLAttributes<T> {
    max?: number | string
    value?: string | string[] | number
  }
  interface ScriptHTMLAttributes<T = HTMLElementTagNameMap['script']> extends HTMLAttributes<T> {
    async?: boolean
    charset?: string
    crossorigin?: HTMLCrossorigin
    defer?: boolean
    integrity?: string
    nomodule?: boolean
    nonce?: string
    referrerpolicy?: HTMLReferrerPolicy
    src?: string
    type?: string
  }
  interface SelectHTMLAttributes<T = HTMLElementTagNameMap['select']> extends HTMLAttributes<T> {
    autocomplete?: HTMLAutocomplete
    autofocus?: boolean
    disabled?: boolean
    form?: string
    multiple?: boolean
    name?: string
    required?: boolean
    size?: number | string
    value?: string | string[] | number
  }
  interface HTMLSlotElementAttributes<T = HTMLSlotElement> extends HTMLAttributes<T> {
    name?: string
  }
  interface SourceHTMLAttributes<T = HTMLElementTagNameMap['source']> extends HTMLAttributes<T> {
    media?: string
    sizes?: string
    src?: string
    srcset?: string
    type?: string
  }
  interface StyleHTMLAttributes<T = HTMLElementTagNameMap['style']> extends HTMLAttributes<T> {
    media?: string
    nonce?: string
    scoped?: boolean
    type?: string
  }
  interface TdHTMLAttributes<T = HTMLElementTagNameMap['td']> extends HTMLAttributes<T> {
    colspan?: number | string
    headers?: string
    rowspan?: number | string
  }
  interface TemplateHTMLAttributes<T extends HTMLTemplateElement> extends HTMLAttributes<T> {
    content?: DocumentFragment
  }
  interface TextareaHTMLAttributes<T = HTMLElementTagNameMap['textarea']> extends HTMLAttributes<T> {
    autocomplete?: HTMLAutocomplete
    autofocus?: boolean
    cols?: number | string
    dirname?: string
    disabled?: boolean
    enterkeyhint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send'
    form?: string
    maxlength?: number | string
    minlength?: number | string
    name?: string
    placeholder?: string
    readonly?: boolean
    required?: boolean
    rows?: number | string
    value?: string | string[] | number
    wrap?: 'hard' | 'soft' | 'off'
  }
  interface ThHTMLAttributes<T = HTMLElementTagNameMap['th']> extends HTMLAttributes<T> {
    colspan?: number | string
    headers?: string
    rowspan?: number | string
    colSpan?: number | string
    rowSpan?: number | string
    scope?: 'col' | 'row' | 'rowgroup' | 'colgroup'
  }
  interface TimeHTMLAttributes<T = HTMLElementTagNameMap['time']> extends HTMLAttributes<T> {
    datetime?: string
  }
  interface TrackHTMLAttributes<T = HTMLElementTagNameMap['track']> extends HTMLAttributes<T> {
    default?: boolean
    kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata'
    label?: string
    src?: string
    srclang?: string
  }
  interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
    height?: number | string
    playsinline?: boolean
    poster?: string
    width?: number | string
  }

  // #region SVG

  type SVGPreserveAspectRatio =
    | 'none'
    | 'xMinYMin'
    | 'xMidYMin'
    | 'xMaxYMin'
    | 'xMinYMid'
    | 'xMidYMid'
    | 'xMaxYMid'
    | 'xMinYMax'
    | 'xMidYMax'
    | 'xMaxYMax'
    | 'xMinYMin meet'
    | 'xMidYMin meet'
    | 'xMaxYMin meet'
    | 'xMinYMid meet'
    | 'xMidYMid meet'
    | 'xMaxYMid meet'
    | 'xMinYMax meet'
    | 'xMidYMax meet'
    | 'xMaxYMax meet'
    | 'xMinYMin slice'
    | 'xMidYMin slice'
    | 'xMaxYMin slice'
    | 'xMinYMid slice'
    | 'xMidYMid slice'
    | 'xMaxYMid slice'
    | 'xMinYMax slice'
    | 'xMidYMax slice'
    | 'xMaxYMax slice'
  type ImagePreserveAspectRatio =
    | SVGPreserveAspectRatio
    | 'defer none'
    | 'defer xMinYMin'
    | 'defer xMidYMin'
    | 'defer xMaxYMin'
    | 'defer xMinYMid'
    | 'defer xMidYMid'
    | 'defer xMaxYMid'
    | 'defer xMinYMax'
    | 'defer xMidYMax'
    | 'defer xMaxYMax'
    | 'defer xMinYMin meet'
    | 'defer xMidYMin meet'
    | 'defer xMaxYMin meet'
    | 'defer xMinYMid meet'
    | 'defer xMidYMid meet'
    | 'defer xMaxYMid meet'
    | 'defer xMinYMax meet'
    | 'defer xMidYMax meet'
    | 'defer xMaxYMax meet'
    | 'defer xMinYMin slice'
    | 'defer xMidYMin slice'
    | 'defer xMaxYMin slice'
    | 'defer xMinYMid slice'
    | 'defer xMidYMid slice'
    | 'defer xMaxYMid slice'
    | 'defer xMinYMax slice'
    | 'defer xMidYMax slice'
    | 'defer xMaxYMax slice'
  type SVGUnits = 'userSpaceOnUse' | 'objectBoundingBox'
  interface CoreSVGAttributes<T> extends AriaAttributes, DOMAttributes<T>, StylePropertyAttributes {
    id?: string
    lang?: string
    tabindex?: number | string
  }
  interface StylableSVGAttributes extends CssAttributes {
    class?: string | undefined
    /** Alias for `class`. */
    className?: string | undefined
    style?: CSSProperties | string
  }
  interface TransformableSVGAttributes {
    transform?: string
  }
  interface ConditionalProcessingSVGAttributes {
    requiredExtensions?: string
    requiredFeatures?: string
    systemLanguage?: string
  }
  interface ExternalResourceSVGAttributes {
    externalResourcesRequired?: 'true' | 'false'
  }
  interface AnimationTimingSVGAttributes {
    begin?: string
    dur?: string
    end?: string
    min?: string
    max?: string
    restart?: 'always' | 'whenNotActive' | 'never'
    repeatCount?: number | 'indefinite'
    repeatDur?: string
    fill?: 'freeze' | 'remove'
  }
  interface AnimationValueSVGAttributes {
    calcMode?: 'discrete' | 'linear' | 'paced' | 'spline'
    values?: string
    keyTimes?: string
    keySplines?: string
    from?: number | string
    to?: number | string
    by?: number | string
  }
  interface AnimationAdditionSVGAttributes {
    attributeName?: string
    additive?: 'replace' | 'sum'
    accumulate?: 'none' | 'sum'
  }
  interface AnimationAttributeTargetSVGAttributes {
    attributeName?: string
    attributeType?: 'CSS' | 'XML' | 'auto'
  }
  interface PresentationSVGAttributes {
    'alignment-baseline'?:
      | 'auto'
      | 'baseline'
      | 'before-edge'
      | 'text-before-edge'
      | 'middle'
      | 'central'
      | 'after-edge'
      | 'text-after-edge'
      | 'ideographic'
      | 'alphabetic'
      | 'hanging'
      | 'mathematical'
      | 'inherit'
    'baseline-shift'?: number | string
    clip?: string
    'clip-path'?: string
    'clip-rule'?: 'nonzero' | 'evenodd' | 'inherit'
    color?: string
    'color-interpolation'?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit'
    'color-interpolation-filters'?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit'
    'color-profile'?: string
    'color-rendering'?: 'auto' | 'optimizeSpeed' | 'optimizeQuality' | 'inherit'
    cursor?: string
    direction?: 'ltr' | 'rtl' | 'inherit'
    display?: string
    'dominant-baseline'?:
      | 'auto'
      | 'text-bottom'
      | 'alphabetic'
      | 'ideographic'
      | 'middle'
      | 'central'
      | 'mathematical'
      | 'hanging'
      | 'text-top'
      | 'inherit'
    'enable-background'?: string
    fill?: string
    'fill-opacity'?: number | string | 'inherit'
    'fill-rule'?: 'nonzero' | 'evenodd' | 'inherit'
    filter?: string
    'flood-color'?: string
    'flood-opacity'?: number | string | 'inherit'
    'font-family'?: string
    'font-size'?: string
    'font-size-adjust'?: number | string
    'font-stretch'?: string
    'font-style'?: 'normal' | 'italic' | 'oblique' | 'inherit'
    'font-variant'?: string
    'font-weight'?: number | string
    'glyph-orientation-horizontal'?: string
    'glyph-orientation-vertical'?: string
    'image-rendering'?: 'auto' | 'optimizeQuality' | 'optimizeSpeed' | 'inherit'
    kerning?: string
    'letter-spacing'?: number | string
    'lighting-color'?: string
    'marker-end'?: string
    'marker-mid'?: string
    'marker-start'?: string
    mask?: string
    opacity?: number | string | 'inherit'
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'inherit'
    pathLength?: string | number
    'pointer-events'?:
      | 'bounding-box'
      | 'visiblePainted'
      | 'visibleFill'
      | 'visibleStroke'
      | 'visible'
      | 'painted'
      | 'color'
      | 'fill'
      | 'stroke'
      | 'all'
      | 'none'
      | 'inherit'
    'shape-rendering'?: 'auto' | 'optimizeSpeed' | 'crispEdges' | 'geometricPrecision' | 'inherit'
    'stop-color'?: string
    'stop-opacity'?: number | string | 'inherit'
    stroke?: string
    'stroke-dasharray'?: string
    'stroke-dashoffset'?: number | string
    'stroke-linecap'?: 'butt' | 'round' | 'square' | 'inherit'
    'stroke-linejoin'?: 'arcs' | 'bevel' | 'miter' | 'miter-clip' | 'round' | 'inherit'
    'stroke-miterlimit'?: number | string | 'inherit'
    'stroke-opacity'?: number | string | 'inherit'
    'stroke-width'?: number | string
    'text-anchor'?: 'start' | 'middle' | 'end' | 'inherit'
    'text-decoration'?: 'none' | 'underline' | 'overline' | 'line-through' | 'blink' | 'inherit'
    'text-rendering'?: 'auto' | 'optimizeSpeed' | 'optimizeLegibility' | 'geometricPrecision' | 'inherit'
    'unicode-bidi'?: string
    visibility?: 'visible' | 'hidden' | 'collapse' | 'inherit'
    'word-spacing'?: number | string
    'writing-mode'?: 'lr-tb' | 'rl-tb' | 'tb-rl' | 'lr' | 'rl' | 'tb' | 'inherit'
  }
  interface AnimationElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      ConditionalProcessingSVGAttributes {}
  interface ContainerElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'clip-path'
        | 'mask'
        | 'cursor'
        | 'opacity'
        | 'filter'
        | 'enable-background'
        | 'color-interpolation'
        | 'color-rendering'
      > {}
  interface FilterPrimitiveElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<PresentationSVGAttributes, 'color-interpolation-filters'> {
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
    result?: string
  }
  interface SingleInputFilterSVGAttributes {
    in?: string
  }
  interface DoubleInputFilterSVGAttributes {
    in?: string
    in2?: string
  }
  interface FitToViewBoxSVGAttributes {
    viewBox?: string
    preserveAspectRatio?: SVGPreserveAspectRatio
  }
  interface GradientElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes {
    gradientUnits?: SVGUnits
    gradientTransform?: string
    spreadMethod?: 'pad' | 'reflect' | 'repeat'
    href?: string
  }
  interface GraphicsElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'clip-rule'
        | 'mask'
        | 'pointer-events'
        | 'cursor'
        | 'opacity'
        | 'filter'
        | 'display'
        | 'visibility'
        | 'color-interpolation'
        | 'color-rendering'
      > {}
  interface LightSourceElementSVGAttributes<T> extends CoreSVGAttributes<T> {}
  interface NewViewportSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<PresentationSVGAttributes, 'overflow' | 'clip'> {
    viewBox?: string
  }
  interface ShapeElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'color'
        | 'fill'
        | 'fill-rule'
        | 'fill-opacity'
        | 'stroke'
        | 'stroke-width'
        | 'stroke-linecap'
        | 'stroke-linejoin'
        | 'stroke-miterlimit'
        | 'stroke-dasharray'
        | 'stroke-dashoffset'
        | 'stroke-opacity'
        | 'shape-rendering'
        | 'pathLength'
      > {}
  interface TextContentElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'font-family'
        | 'font-style'
        | 'font-variant'
        | 'font-weight'
        | 'font-stretch'
        | 'font-size'
        | 'font-size-adjust'
        | 'kerning'
        | 'letter-spacing'
        | 'word-spacing'
        | 'text-decoration'
        | 'glyph-orientation-horizontal'
        | 'glyph-orientation-vertical'
        | 'direction'
        | 'unicode-bidi'
        | 'text-anchor'
        | 'dominant-baseline'
        | 'color'
        | 'fill'
        | 'fill-rule'
        | 'fill-opacity'
        | 'stroke'
        | 'stroke-width'
        | 'stroke-linecap'
        | 'stroke-linejoin'
        | 'stroke-miterlimit'
        | 'stroke-dasharray'
        | 'stroke-dashoffset'
        | 'stroke-opacity'
      > {}
  interface ZoomAndPanSVGAttributes {
    zoomAndPan?: 'disable' | 'magnify'
  }
  interface AnimateSVGAttributes<T>
    extends AnimationElementSVGAttributes<T>,
      AnimationAttributeTargetSVGAttributes,
      AnimationTimingSVGAttributes,
      AnimationValueSVGAttributes,
      AnimationAdditionSVGAttributes,
      Pick<PresentationSVGAttributes, 'color-interpolation' | 'color-rendering'> {}
  interface AnimateMotionSVGAttributes<T>
    extends AnimationElementSVGAttributes<T>,
      AnimationTimingSVGAttributes,
      AnimationValueSVGAttributes,
      AnimationAdditionSVGAttributes {
    path?: string
    keyPoints?: string
    rotate?: number | string | 'auto' | 'auto-reverse'
    origin?: 'default'
  }
  interface AnimateTransformSVGAttributes<T>
    extends AnimationElementSVGAttributes<T>,
      AnimationAttributeTargetSVGAttributes,
      AnimationTimingSVGAttributes,
      AnimationValueSVGAttributes,
      AnimationAdditionSVGAttributes {
    type?: 'translate' | 'scale' | 'rotate' | 'skewX' | 'skewY'
  }
  interface CircleSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes {
    cx?: number | string
    cy?: number | string
    r?: number | string
  }
  interface ClipPathSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'clip-path'> {
    clipPathUnits?: SVGUnits
  }
  interface DefsSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes {}
  interface DescSVGAttributes<T> extends CoreSVGAttributes<T>, StylableSVGAttributes {}
  interface EllipseSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes {
    cx?: number | string
    cy?: number | string
    rx?: number | string
    ry?: number | string
  }
  interface FeBlendSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      DoubleInputFilterSVGAttributes,
      StylableSVGAttributes {
    mode?: 'normal' | 'multiply' | 'screen' | 'darken' | 'lighten'
  }
  interface FeColorMatrixSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {
    type?: 'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha'
    values?: string
  }
  interface FeComponentTransferSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {}
  interface FeCompositeSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      DoubleInputFilterSVGAttributes,
      StylableSVGAttributes {
    operator?: 'over' | 'in' | 'out' | 'atop' | 'xor' | 'arithmetic'
    k1?: number | string
    k2?: number | string
    k3?: number | string
    k4?: number | string
  }
  interface FeConvolveMatrixSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {
    order?: number | string
    kernelMatrix?: string
    divisor?: number | string
    bias?: number | string
    targetX?: number | string
    targetY?: number | string
    edgeMode?: 'duplicate' | 'wrap' | 'none'
    kernelUnitLength?: number | string
    preserveAlpha?: 'true' | 'false'
  }
  interface FeDiffuseLightingSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color' | 'lighting-color'> {
    surfaceScale?: number | string
    diffuseConstant?: number | string
    kernelUnitLength?: number | string
  }
  interface FeDisplacementMapSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      DoubleInputFilterSVGAttributes,
      StylableSVGAttributes {
    scale?: number | string
    xChannelSelector?: 'R' | 'G' | 'B' | 'A'
    yChannelSelector?: 'R' | 'G' | 'B' | 'A'
  }
  interface FeDistantLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
    azimuth?: number | string
    elevation?: number | string
  }
  interface FeDropShadowSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      FilterPrimitiveElementSVGAttributes<T>,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color' | 'flood-color' | 'flood-opacity'> {
    dx?: number | string
    dy?: number | string
    stdDeviation?: number | string
  }
  interface FeFloodSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color' | 'flood-color' | 'flood-opacity'> {}
  interface FeFuncSVGAttributes<T> extends CoreSVGAttributes<T> {
    type?: 'identity' | 'table' | 'discrete' | 'linear' | 'gamma'
    tableValues?: string
    slope?: number | string
    intercept?: number | string
    amplitude?: number | string
    exponent?: number | string
    offset?: number | string
  }
  interface FeGaussianBlurSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {
    stdDeviation?: number | string
  }
  interface FeImageSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes {
    preserveAspectRatio?: SVGPreserveAspectRatio
    href?: string
  }
  interface FeMergeSVGAttributes<T> extends FilterPrimitiveElementSVGAttributes<T>, StylableSVGAttributes {}
  interface FeMergeNodeSVGAttributes<T> extends CoreSVGAttributes<T>, SingleInputFilterSVGAttributes {}
  interface FeMorphologySVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {
    operator?: 'erode' | 'dilate'
    radius?: number | string
  }
  interface FeOffsetSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {
    dx?: number | string
    dy?: number | string
  }
  interface FePointLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
    x?: number | string
    y?: number | string
    z?: number | string
  }
  interface FeSpecularLightingSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color' | 'lighting-color'> {
    surfaceScale?: string
    specularConstant?: string
    specularExponent?: string
    kernelUnitLength?: number | string
  }
  interface FeSpotLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
    x?: number | string
    y?: number | string
    z?: number | string
    pointsAtX?: number | string
    pointsAtY?: number | string
    pointsAtZ?: number | string
    specularExponent?: number | string
    limitingConeAngle?: number | string
  }
  interface FeTileSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {}
  interface FeTurbulanceSVGAttributes<T> extends FilterPrimitiveElementSVGAttributes<T>, StylableSVGAttributes {
    baseFrequency?: number | string
    numOctaves?: number | string
    seed?: number | string
    stitchTiles?: 'stitch' | 'noStitch'
    type?: 'fractalNoise' | 'turbulence'
  }
  interface FilterSVGAttributes<T> extends CoreSVGAttributes<T>, ExternalResourceSVGAttributes, StylableSVGAttributes {
    filterUnits?: SVGUnits
    primitiveUnits?: SVGUnits
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
    filterRes?: number | string
  }
  interface ForeignObjectSVGAttributes<T>
    extends NewViewportSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'display' | 'visibility'> {
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
  }
  interface GSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'display' | 'visibility'> {}
  interface ImageSVGAttributes<T>
    extends NewViewportSVGAttributes<T>,
      GraphicsElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color-profile' | 'image-rendering'> {
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
    preserveAspectRatio?: ImagePreserveAspectRatio
    href?: string
  }
  interface LineSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'marker-start' | 'marker-mid' | 'marker-end'> {
    x1?: number | string
    y1?: number | string
    x2?: number | string
    y2?: number | string
  }
  interface LinearGradientSVGAttributes<T> extends GradientElementSVGAttributes<T> {
    x1?: number | string
    x2?: number | string
    y1?: number | string
    y2?: number | string
  }
  interface MarkerSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      FitToViewBoxSVGAttributes,
      Pick<PresentationSVGAttributes, 'overflow' | 'clip'> {
    markerUnits?: 'strokeWidth' | 'userSpaceOnUse'
    refX?: number | string
    refY?: number | string
    markerWidth?: number | string
    markerHeight?: number | string
    orient?: string
  }
  interface MaskSVGAttributes<T>
    extends Omit<ContainerElementSVGAttributes<T>, 'opacity' | 'filter'>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes {
    maskUnits?: SVGUnits
    maskContentUnits?: SVGUnits
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
  }
  interface MetadataSVGAttributes<T> extends CoreSVGAttributes<T> {}
  interface MPathSVGAttributes<T> extends CoreSVGAttributes<T> {}
  interface PathSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'marker-start' | 'marker-mid' | 'marker-end'> {
    d?: string
    pathLength?: number | string
  }
  interface PatternSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      FitToViewBoxSVGAttributes,
      Pick<PresentationSVGAttributes, 'overflow' | 'clip'> {
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
    patternUnits?: SVGUnits
    patternContentUnits?: SVGUnits
    patternTransform?: string
    href?: string
  }
  interface PolygonSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'marker-start' | 'marker-mid' | 'marker-end'> {
    points?: string
  }
  interface PolylineSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'marker-start' | 'marker-mid' | 'marker-end'> {
    points?: string
  }
  interface RadialGradientSVGAttributes<T> extends GradientElementSVGAttributes<T> {
    cx?: number | string
    cy?: number | string
    r?: number | string
    fx?: number | string
    fy?: number | string
  }
  interface RectSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes {
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
    rx?: number | string
    ry?: number | string
  }
  interface SetSVGAttributes<T> extends CoreSVGAttributes<T>, StylableSVGAttributes, AnimationTimingSVGAttributes {}
  interface StopSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color' | 'stop-color' | 'stop-opacity'> {
    offset?: number | string
  }
  interface SvgSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      NewViewportSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      FitToViewBoxSVGAttributes,
      ZoomAndPanSVGAttributes,
      PresentationSVGAttributes {
    version?: string
    baseProfile?: string
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
    contentScriptType?: string
    contentStyleType?: string
    xmlns?: string
  }
  interface SwitchSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'display' | 'visibility'> {}
  interface SymbolSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      NewViewportSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      FitToViewBoxSVGAttributes {
    width?: number | string
    height?: number | string
    preserveAspectRatio?: SVGPreserveAspectRatio
    refX?: number | string
    refY?: number | string
    viewBox?: string
    x?: number | string
    y?: number | string
  }
  interface TextSVGAttributes<T>
    extends TextContentElementSVGAttributes<T>,
      GraphicsElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'writing-mode' | 'text-rendering'> {
    x?: number | string
    y?: number | string
    dx?: number | string
    dy?: number | string
    rotate?: number | string
    textLength?: number | string
    lengthAdjust?: 'spacing' | 'spacingAndGlyphs'
  }
  interface TextPathSVGAttributes<T>
    extends TextContentElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'alignment-baseline' | 'baseline-shift' | 'display' | 'visibility'> {
    startOffset?: number | string
    method?: 'align' | 'stretch'
    spacing?: 'auto' | 'exact'
    href?: string
  }
  interface TSpanSVGAttributes<T>
    extends TextContentElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'alignment-baseline' | 'baseline-shift' | 'display' | 'visibility'> {
    x?: number | string
    y?: number | string
    dx?: number | string
    dy?: number | string
    rotate?: number | string
    textLength?: number | string
    lengthAdjust?: 'spacing' | 'spacingAndGlyphs'
  }
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
   */
  interface UseSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      StylableSVGAttributes,
      ConditionalProcessingSVGAttributes,
      GraphicsElementSVGAttributes<T>,
      PresentationSVGAttributes,
      ExternalResourceSVGAttributes,
      TransformableSVGAttributes {
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
    href?: string
  }
  interface ViewSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      FitToViewBoxSVGAttributes,
      ZoomAndPanSVGAttributes {
    viewTarget?: string
  }

  /**
   * @type {SVGElementTagNameMap}
   */
  interface SVGElementTags {
    'svg:animate': AnimateSVGAttributes<SVGAnimateElement>
    'svg:animateMotion': AnimateMotionSVGAttributes<SVGAnimateMotionElement>
    'svg:animateTransform': AnimateTransformSVGAttributes<SVGAnimateTransformElement>
    'svg:circle': CircleSVGAttributes<SVGCircleElement>
    'svg:clipPath': ClipPathSVGAttributes<SVGClipPathElement>
    'svg:defs': DefsSVGAttributes<SVGDefsElement>
    'svg:desc': DescSVGAttributes<SVGDescElement>
    'svg:ellipse': EllipseSVGAttributes<SVGEllipseElement>
    'svg:feBlend': FeBlendSVGAttributes<SVGFEBlendElement>
    'svg:feColorMatrix': FeColorMatrixSVGAttributes<SVGFEColorMatrixElement>
    'svg:feComponentTransfer': FeComponentTransferSVGAttributes<SVGFEComponentTransferElement>
    'svg:feComposite': FeCompositeSVGAttributes<SVGFECompositeElement>
    'svg:feConvolveMatrix': FeConvolveMatrixSVGAttributes<SVGFEConvolveMatrixElement>
    'svg:feDiffuseLighting': FeDiffuseLightingSVGAttributes<SVGFEDiffuseLightingElement>
    'svg:feDisplacementMap': FeDisplacementMapSVGAttributes<SVGFEDisplacementMapElement>
    'svg:feDistantLight': FeDistantLightSVGAttributes<SVGFEDistantLightElement>
    'svg:feDropShadow': FeDropShadowSVGAttributes<SVGFEDropShadowElement>
    'svg:feFlood': FeFloodSVGAttributes<SVGFEFloodElement>
    'svg:feFuncA': FeFuncSVGAttributes<SVGFEFuncAElement>
    'svg:feFuncB': FeFuncSVGAttributes<SVGFEFuncBElement>
    'svg:feFuncG': FeFuncSVGAttributes<SVGFEFuncGElement>
    'svg:feFuncR': FeFuncSVGAttributes<SVGFEFuncRElement>
    'svg:feGaussianBlur': FeGaussianBlurSVGAttributes<SVGFEGaussianBlurElement>
    'svg:feImage': FeImageSVGAttributes<SVGFEImageElement>
    'svg:feMerge': FeMergeSVGAttributes<SVGFEMergeElement>
    'svg:feMergeNode': FeMergeNodeSVGAttributes<SVGFEMergeNodeElement>
    'svg:feMorphology': FeMorphologySVGAttributes<SVGFEMorphologyElement>
    'svg:feOffset': FeOffsetSVGAttributes<SVGFEOffsetElement>
    'svg:fePointLight': FePointLightSVGAttributes<SVGFEPointLightElement>
    'svg:feSpecularLighting': FeSpecularLightingSVGAttributes<SVGFESpecularLightingElement>
    'svg:feSpotLight': FeSpotLightSVGAttributes<SVGFESpotLightElement>
    'svg:feTile': FeTileSVGAttributes<SVGFETileElement>
    'svg:feTurbulence': FeTurbulanceSVGAttributes<SVGFETurbulenceElement>
    'svg:filter': FilterSVGAttributes<SVGFilterElement>
    'svg:foreignObject': ForeignObjectSVGAttributes<SVGForeignObjectElement>
    'svg:g': GSVGAttributes<SVGGElement>
    'svg:image': ImageSVGAttributes<SVGImageElement>
    'svg:line': LineSVGAttributes<SVGLineElement>
    'svg:linearGradient': LinearGradientSVGAttributes<SVGLinearGradientElement>
    'svg:marker': MarkerSVGAttributes<SVGMarkerElement>
    'svg:mask': MaskSVGAttributes<SVGMaskElement>
    'svg:metadata': MetadataSVGAttributes<SVGMetadataElement>
    'svg:mpath': MPathSVGAttributes<SVGMPathElement>
    'svg:path': PathSVGAttributes<SVGPathElement>
    'svg:pattern': PatternSVGAttributes<SVGPatternElement>
    'svg:polygon': PolygonSVGAttributes<SVGPolygonElement>
    'svg:polyline': PolylineSVGAttributes<SVGPolylineElement>
    'svg:radialGradient': RadialGradientSVGAttributes<SVGRadialGradientElement>
    'svg:rect': RectSVGAttributes<SVGRectElement>
    'svg:set': SetSVGAttributes<SVGSetElement>
    'svg:stop': StopSVGAttributes<SVGStopElement>
    'svg:svg': SvgSVGAttributes<SVGSVGElement>
    'svg:switch': SwitchSVGAttributes<SVGSwitchElement>
    'svg:symbol': SymbolSVGAttributes<SVGSymbolElement>
    'svg:text': TextSVGAttributes<SVGTextElement>
    'svg:textPath': TextPathSVGAttributes<SVGTextPathElement>
    'svg:tspan': TSpanSVGAttributes<SVGTSpanElement>
    'svg:use': UseSVGAttributes<SVGUseElement>
    'svg:view': ViewSVGAttributes<SVGViewElement>
  }

  // #endregion

  /**
   * @type {HTMLElementTagNameMap}
   */
  interface HTMLElementTags {
    a: AnchorHTMLAttributes<HTMLElementTagNameMap['a']>
    abbr: HTMLAttributes<HTMLElementTagNameMap['abbr']>
    address: HTMLAttributes<HTMLElementTagNameMap['address']>
    area: AreaHTMLAttributes<HTMLElementTagNameMap['area']>
    article: HTMLAttributes<HTMLElementTagNameMap['article']>
    aside: HTMLAttributes<HTMLElementTagNameMap['aside']>
    audio: AudioHTMLAttributes<HTMLElementTagNameMap['audio']>
    b: HTMLAttributes<HTMLElementTagNameMap['b']>
    base: BaseHTMLAttributes<HTMLElementTagNameMap['base']>
    bdi: HTMLAttributes<HTMLElementTagNameMap['bdi']>
    bdo: HTMLAttributes<HTMLElementTagNameMap['bdo']>
    blockquote: BlockquoteHTMLAttributes<HTMLElementTagNameMap['blockquote']>
    body: HTMLAttributes<HTMLElementTagNameMap['body']>
    br: HTMLAttributes<HTMLElementTagNameMap['br']>
    button: ButtonHTMLAttributes<HTMLElementTagNameMap['button']>
    canvas: CanvasHTMLAttributes<HTMLElementTagNameMap['canvas']>
    caption: HTMLAttributes<HTMLElementTagNameMap['caption']>
    cite: HTMLAttributes<HTMLElementTagNameMap['cite']>
    code: HTMLAttributes<HTMLElementTagNameMap['code']>
    col: ColHTMLAttributes<HTMLElementTagNameMap['col']>
    colgroup: ColgroupHTMLAttributes<HTMLElementTagNameMap['colgroup']>
    data: DataHTMLAttributes<HTMLElementTagNameMap['data']>
    datalist: HTMLAttributes<HTMLElementTagNameMap['datalist']>
    dd: HTMLAttributes<HTMLElementTagNameMap['dd']>
    del: HTMLAttributes<HTMLElementTagNameMap['del']>
    details: DetailsHtmlAttributes<HTMLElementTagNameMap['details']>
    dfn: HTMLAttributes<HTMLElementTagNameMap['dfn']>
    dialog: DialogHtmlAttributes<HTMLElementTagNameMap['dialog']>
    div: HTMLAttributes<HTMLElementTagNameMap['div']>
    dl: HTMLAttributes<HTMLElementTagNameMap['dl']>
    dt: HTMLAttributes<HTMLElementTagNameMap['dt']>
    em: HTMLAttributes<HTMLElementTagNameMap['em']>
    embed: EmbedHTMLAttributes<HTMLElementTagNameMap['embed']>
    fieldset: FieldsetHTMLAttributes<HTMLElementTagNameMap['fieldset']>
    figcaption: HTMLAttributes<HTMLElementTagNameMap['figcaption']>
    figure: HTMLAttributes<HTMLElementTagNameMap['figure']>
    footer: HTMLAttributes<HTMLElementTagNameMap['footer']>
    form: FormHTMLAttributes<HTMLElementTagNameMap['form']>
    h1: HTMLAttributes<HTMLElementTagNameMap['h1']>
    h2: HTMLAttributes<HTMLElementTagNameMap['h2']>
    h3: HTMLAttributes<HTMLElementTagNameMap['h3']>
    h4: HTMLAttributes<HTMLElementTagNameMap['h4']>
    h5: HTMLAttributes<HTMLElementTagNameMap['h5']>
    h6: HTMLAttributes<HTMLElementTagNameMap['h6']>
    head: HTMLAttributes<HTMLElementTagNameMap['head']>
    header: HTMLAttributes<HTMLElementTagNameMap['header']>
    hgroup: HTMLAttributes<HTMLElementTagNameMap['hgroup']>
    hr: HTMLAttributes<HTMLElementTagNameMap['hr']>
    html: HTMLAttributes<HTMLElementTagNameMap['html']>
    i: HTMLAttributes<HTMLElementTagNameMap['i']>
    iframe: IframeHTMLAttributes<HTMLElementTagNameMap['iframe']>
    img: ImgHTMLAttributes<HTMLElementTagNameMap['img']>
    input: InputHTMLAttributes<HTMLElementTagNameMap['input']>
    ins: InsHTMLAttributes<HTMLElementTagNameMap['ins']>
    kbd: HTMLAttributes<HTMLElementTagNameMap['kbd']>
    label: LabelHTMLAttributes<HTMLElementTagNameMap['label']>
    legend: HTMLAttributes<HTMLElementTagNameMap['legend']>
    li: LiHTMLAttributes<HTMLElementTagNameMap['li']>
    link: LinkHTMLAttributes<HTMLElementTagNameMap['link']>
    main: HTMLAttributes<HTMLElementTagNameMap['main']>
    map: MapHTMLAttributes<HTMLElementTagNameMap['map']>
    mark: HTMLAttributes<HTMLElementTagNameMap['mark']>
    menu: MenuHTMLAttributes<HTMLElementTagNameMap['menu']>
    meta: MetaHTMLAttributes<HTMLElementTagNameMap['meta']>
    meter: MeterHTMLAttributes<HTMLElementTagNameMap['meter']>
    nav: HTMLAttributes<HTMLElementTagNameMap['nav']>
    noscript: HTMLAttributes<HTMLElementTagNameMap['noscript']>
    object: ObjectHTMLAttributes<HTMLElementTagNameMap['object']>
    ol: OlHTMLAttributes<HTMLElementTagNameMap['ol']>
    optgroup: OptgroupHTMLAttributes<HTMLElementTagNameMap['optgroup']>
    option: OptionHTMLAttributes<HTMLElementTagNameMap['option']>
    output: OutputHTMLAttributes<HTMLElementTagNameMap['output']>
    p: HTMLAttributes<HTMLElementTagNameMap['p']>
    picture: HTMLAttributes<HTMLElementTagNameMap['picture']>
    pre: HTMLAttributes<HTMLElementTagNameMap['pre']>
    progress: ProgressHTMLAttributes<HTMLElementTagNameMap['progress']>
    q: QuoteHTMLAttributes<HTMLElementTagNameMap['q']>
    rp: HTMLAttributes<HTMLElementTagNameMap['rp']>
    rt: HTMLAttributes<HTMLElementTagNameMap['rt']>
    ruby: HTMLAttributes<HTMLElementTagNameMap['ruby']>
    s: HTMLAttributes<HTMLElementTagNameMap['s']>
    samp: HTMLAttributes<HTMLElementTagNameMap['samp']>
    script: ScriptHTMLAttributes<HTMLElementTagNameMap['script']>
    search: HTMLAttributes<HTMLElementTagNameMap['search']>
    section: HTMLAttributes<HTMLElementTagNameMap['section']>
    select: SelectHTMLAttributes<HTMLElementTagNameMap['select']>
    slot: HTMLSlotElementAttributes
    HTMLElementTagNameMap: HTMLAttributes<HTMLElementTagNameMap['HTMLElementTagNameMap']>
    source: SourceHTMLAttributes<HTMLElementTagNameMap['source']>
    span: HTMLAttributes<HTMLElementTagNameMap['span']>
    strong: HTMLAttributes<HTMLElementTagNameMap['strong']>
    style: StyleHTMLAttributes<HTMLElementTagNameMap['style']>
    sub: HTMLAttributes<HTMLElementTagNameMap['sub']>
    summary: HTMLAttributes<HTMLElementTagNameMap['summary']>
    sup: HTMLAttributes<HTMLElementTagNameMap['sup']>
    table: HTMLAttributes<HTMLElementTagNameMap['table']>
    tbody: HTMLAttributes<HTMLElementTagNameMap['tbody']>
    td: TdHTMLAttributes<HTMLElementTagNameMap['td']>
    template: TemplateHTMLAttributes<HTMLElementTagNameMap['template']>
    textarea: TextareaHTMLAttributes<HTMLElementTagNameMap['textarea']>
    tfoot: HTMLAttributes<HTMLElementTagNameMap['tfoot']>
    th: ThHTMLAttributes<HTMLElementTagNameMap['th']>
    thead: HTMLAttributes<HTMLElementTagNameMap['thead']>
    time: TimeHTMLAttributes<HTMLElementTagNameMap['time']>
    title: HTMLAttributes<HTMLElementTagNameMap['title']>
    tr: HTMLAttributes<HTMLElementTagNameMap['tr']>
    track: TrackHTMLAttributes<HTMLElementTagNameMap['track']>
    u: HTMLAttributes<HTMLElementTagNameMap['u']>
    ul: HTMLAttributes<HTMLElementTagNameMap['ul']>
    var: HTMLAttributes<HTMLElementTagNameMap['var']>
    video: VideoHTMLAttributes<HTMLElementTagNameMap['video']>
    wbr: HTMLAttributes<HTMLElementTagNameMap['wbr']>
  }
  /**
   * @type {HTMLElementDeprecatedTagNameMap}
   */
  interface HTMLElementDeprecatedTags {
    big: HTMLAttributes<HTMLElement>
    keygen: KeygenHTMLAttributes<HTMLElement>
    menuitem: HTMLAttributes<HTMLElement>
    noindex: HTMLAttributes<HTMLElement>
    param: ParamHTMLAttributes<HTMLParamElement>
  }

  interface IntrinsicElements
    extends ElementsAttributesAtomMaybe<HTMLElementTags>,
      ElementsAttributesAtomMaybe<HTMLElementDeprecatedTags>,
      ElementsAttributesAtomMaybe<SVGElementTags> {}
}
