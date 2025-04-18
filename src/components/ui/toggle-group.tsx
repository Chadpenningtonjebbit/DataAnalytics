"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cn } from "@/lib/utils"
import { VariantProps, cva } from "class-variance-authority"

const toggleGroupVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted/60",
  {
    variants: {
      variant: {
        default: "bg-background",
        outline: "border border-input bg-transparent hover:bg-muted hover:text-muted-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-8 px-2",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleGroupVariants>
>(({ className, variant, size, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-wrap gap-0.5", className)}
    {...props}
  />
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleGroupVariants>
>(({ className, variant, size, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      toggleGroupVariants({ variant, size }),
      "border border-border shadow-sm",
      "data-[state=on]:bg-slate-800 data-[state=on]:text-white",
      "data-[state=on]:shadow-md data-[state=on]:border-slate-900 data-[state=on]:font-semibold",
      "data-[state=on]:scale-105 data-[state=on]:z-10",
      className
    )}
    {...props}
  />
))

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem } 