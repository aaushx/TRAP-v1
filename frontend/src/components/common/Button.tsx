import React, { forwardRef } from 'react'
import { Loader } from 'lucide-react'

/**
 * Supported visual variants for the TRAP Button component.
 * Each variant maps to precise theme tokens that guarantee contrast in both Light and Dark modes.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'surface' | 'outline' | 'ghost' | 'destructive'

/**
 * Standard size options for the TRAP Button.
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant
  /** Button sizing scale */
  size?: ButtonSize
  /** Loading state indicator showing an animated spinner */
  isLoading?: boolean
  /** Optional icon to render before the text label */
  leftIcon?: React.ReactNode
  /** Optional icon to render after the text label */
  rightIcon?: React.ReactNode
  /** Child content or label */
  children?: React.ReactNode
}

/**
 * TRAP Design System Unified Button Component.
 * 
 * Solves theme contrast bugs centrally by binding each variant directly
 * to custom properties (`--button-*-bg`, `--button-*-text`) in `tokens.css`.
 * In Dark Mode, primary buttons use crisp near-white backgrounds paired with
 * dark/near-black text, eliminating blank or unreadable text.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  type = 'button',
  ...props
}, ref) => {
  // Base structural classes
  const baseClasses = 'inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider rounded transition-all duration-150 select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed'

  // Variant color mappings adhering to TRAP tokens
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-btn-primary-bg text-btn-primary-text hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:bg-btn-disabled-bg disabled:text-btn-disabled-text',
    secondary: 'bg-btn-secondary-bg text-btn-secondary-text hover:bg-red-700 disabled:bg-btn-disabled-bg disabled:text-btn-disabled-text',
    surface: 'bg-btn-surface-bg text-btn-surface-text border border-border-default hover:bg-bg-container-high disabled:bg-btn-disabled-bg disabled:text-btn-disabled-text',
    outline: 'bg-transparent border border-btn-outline-border text-btn-outline-text hover:bg-bg-container-low hover:border-primary disabled:border-btn-disabled-bg disabled:text-btn-disabled-text',
    ghost: 'bg-transparent text-btn-ghost-text hover:bg-bg-container-low hover:text-text-primary disabled:text-btn-disabled-text',
    destructive: 'bg-btn-destructive-bg text-btn-destructive-text hover:bg-red-700 disabled:bg-btn-disabled-bg disabled:text-btn-disabled-text'
  }

  // Size scale mappings
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-[11px] gap-1.5',
    md: 'px-5 py-2.5 text-xs gap-2',
    lg: 'px-8 py-3.5 text-xs gap-2.5',
    icon: 'p-2 text-xs'
  }

  const isDisabledOrLoading = disabled || isLoading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabledOrLoading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabledOrLoading ? 'opacity-80' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader className="w-3.5 h-3.5 animate-spin shrink-0" />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
})

Button.displayName = 'Button'
