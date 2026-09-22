import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  fullWidth?: boolean
  loading?: boolean
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  fullWidth = false,
  loading = false,
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium font-jakarta rounded-xl transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]'
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-600 focus-visible:outline-primary shadow-subtle hover:shadow-card',
    secondary: 'bg-[#171717] text-white hover:bg-[#262626] focus-visible:outline-charcoal shadow-subtle hover:shadow-card',
    outline: 'border border-border-warm bg-white text-[#171717] hover:border-gray-400 hover:bg-warm-50 focus-visible:outline-primary shadow-subtle',
    ghost: 'text-[#404040] hover:bg-warm-50 hover:text-[#171717] focus-visible:outline-primary',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold',
    md: 'px-5 py-2.5 text-sm font-semibold',
    lg: 'px-6 py-3.5 text-base font-semibold'
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
}
