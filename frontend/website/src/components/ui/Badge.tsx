import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'gray' | 'dark'
  size?: 'sm' | 'md'
  className?: string
}

export default function Badge({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '' 
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary-50 text-primary-600 border-primary-100',
    success: 'bg-green-50 text-green-700 border-green-100',
    warning: 'bg-orange-50 text-orange-700 border-orange-100',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    dark: 'bg-gray-800 text-white border-gray-700',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}
