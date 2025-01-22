import React from 'react'
import { cx } from './utils'
import styles from './basic.module.css'

interface BoxProps extends React.ComponentPropsWithRef<'div'> {
  vspace?: string
  hspace?: string
}

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, vspace, hspace, ...rest }, ref) => {
    const style = {
      '--vspace': vspace,
      '--hspace': hspace,
    } as React.CSSProperties
    return <div ref={ref} className={className} style={style} {...rest} />
  },
)

Box.displayName = 'Box'

interface FlexProps extends React.ComponentPropsWithRef<'div'> {
  vspace?: string
  hspace?: string
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ className, vspace, hspace, ...rest }, ref) => {
    const style = {
      '--vspace': vspace,
      '--hspace': hspace,
    } as React.CSSProperties
    return (
      <div
        ref={ref}
        className={cx(styles.flex, className)}
        style={style}
        {...rest}
      />
    )
  },
)

Flex.displayName = 'Flex'

interface VFlexProps extends React.ComponentPropsWithRef<'div'> {
  vspace?: string
  hspace?: string
}

export const VFlex = React.forwardRef<HTMLDivElement, VFlexProps>(
  ({ className, vspace, hspace, ...rest }, ref) => {
    const style = {
      '--vspace': vspace,
      '--hspace': hspace,
    } as React.CSSProperties
    return (
      <Flex
        ref={ref}
        className={cx(styles.VFlex, className)}
        style={style}
        {...rest}
      />
    )
  },
)

VFlex.displayName = 'VFlex'

export const BoxClickable = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithRef<'div'>
>(({ className, ...rest }, ref) => {
  return <div ref={ref} className={cx('inline-block', className)} {...rest} />
})

BoxClickable.displayName = 'BoxClickable'

export const Span = ({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<'span'>) => {
  return <span className={cx('inline-block', className)} {...rest} />
}

export const Stack = (props: React.PropsWithChildren) => {
  const [first, ...rest] = React.Children.toArray(props.children)

  if (first == null) return null

  return (
    <div className={styles.stack}>
      {first}
      {rest && <Stack>{rest}</Stack>}
    </div>
  )
}

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithRef<'input'>
>(({ className, ...rest }, ref) => {
  return (
    <input
      ref={ref}
      type="text"
      className={cx(styles.input, className)}
      {...rest}
    />
  )
})

TextInput.displayName = 'TextInput'

export const Label = ({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<'span'>) => {
  return <Span className={cx(styles.label, className)} {...rest} />
}

export const Button = ({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<'button'>) => {
  return (
    <button
      type="button"
      className={cx(styles.button, styles.clickable, className)}
      {...rest}
    />
  )
}
