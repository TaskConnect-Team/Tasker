function Button({ children, type = 'button', variant = 'primary', className = '', ...props }) {
  const variantStyles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-700',
    secondary: 'bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100',
  }

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${variantStyles[variant] ?? variantStyles.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button