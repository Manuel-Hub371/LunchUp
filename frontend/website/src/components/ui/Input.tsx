import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export default function Input({ 
  label, 
  error, 
  helperText,
  className = '',
  id,
  ...props 
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-[#171717]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-4 py-2.5 text-[15px] transition-all placeholder:text-muted focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          error 
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-border-warm bg-white focus:border-primary focus:ring-primary/20'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-[#737373]">{helperText}</p>
      )}
    </div>
  )
}
