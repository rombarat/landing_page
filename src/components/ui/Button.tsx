import { type ButtonHTMLAttributes, type AnchorHTMLAttributes, forwardRef } from 'react'

type BaseProps = {
  variant?: 'primary' | 'secondary' | 'whatsapp' | 'gold' | 'ghost'
  size?: 'md' | 'lg'
  className?: string
}

const base =
  'inline-flex items-center justify-center gap-2.5 font-display font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none whitespace-nowrap select-none'

const sizes = {
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-7 text-[16px]',
}

const variants = {
  primary:
    'rounded-full bg-ink text-page hover:bg-ink2 active:translate-y-[1px]',
  secondary:
    'rounded-full bg-transparent text-ink border border-line2 hover:border-ink hover:bg-ink/5 active:translate-y-[1px]',
  whatsapp:
    'rounded-full bg-wa text-page hover:bg-waDark active:translate-y-[1px]',
  gold:
    'rounded-full bg-gold text-page hover:bg-goldHover active:translate-y-[1px]',
  ghost:
    'rounded-full bg-transparent text-ink hover:bg-ink/5',
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>
type LinkProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...rest }, ref) => (
    <button
      ref={ref}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    />
  ),
)
Button.displayName = 'Button'

export const LinkButton = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ variant = 'primary', size = 'md', className = '', ...rest }, ref) => (
    <a
      ref={ref}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    />
  ),
)
LinkButton.displayName = 'LinkButton'
