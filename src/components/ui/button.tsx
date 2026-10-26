import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './spinner'

type Variant = 'primary' | 'ink' | 'outline' | 'ghost' | 'danger' | 'link'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,color,border-color,transform,box-shadow] duration-150 active:translate-y-px disabled:opacity-55 disabled:active:translate-y-0'

const variants: Record<Variant, string> = {
  primary: 'bg-turmeric text-ink shadow-press hover:bg-turmeric-deep',
  ink: 'bg-ink text-white shadow-press hover:bg-ink-soft',
  outline: 'border border-line-strong bg-surface text-ink hover:border-ink hover:bg-sunken',
  ghost: 'text-ink hover:bg-sunken',
  danger: 'bg-pomegranate text-white shadow-press hover:bg-[#a52a3e]',
  link: 'text-tchelet underline-offset-4 hover:underline px-0! h-auto!',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 rounded-md px-3 text-sm',
  md: 'h-11 rounded-md px-5 text-base',
  lg: 'h-14 rounded-lg px-7 text-lg',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
  pending?: boolean
  icon?: ReactNode
}

export function Button({ variant, size, pending, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={buttonClass(variant, size, className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...rest}
    >
      {pending ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  )
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode }

export function LinkButton({ variant, size, icon, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}
