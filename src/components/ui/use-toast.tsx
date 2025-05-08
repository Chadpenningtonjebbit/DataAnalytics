"use client"

import * as React from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastContextType = {
  toast: (props: ToastProps) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback((props: ToastProps) => {
    const id = Date.now()
    setToasts((prev) => [...prev, props])
    
    // Auto remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((_, i) => i !== 0))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t, i) => (
            <div 
              key={i}
              className={`rounded-md p-4 shadow-md ${
                t.variant === 'destructive' 
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-background text-foreground border'
              }`}
            >
              {t.title && <p className="font-medium">{t.title}</p>}
              {t.description && <p className="text-sm">{t.description}</p>}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Export a simple function for use outside of components
export const toast = {
  // Define the toast function stub that will be implemented in the provider
  toast: (props: ToastProps) => {
    // This implementation will be replaced when used within the ToastProvider
    console.warn("Toast used outside of provider")
  },
  
  // Helper methods
  default: (props: Omit<ToastProps, "variant">) => {
    toast.toast({ ...props, variant: "default" })
  },
  destructive: (props: Omit<ToastProps, "variant">) => {
    toast.toast({ ...props, variant: "destructive" })
  }
} 