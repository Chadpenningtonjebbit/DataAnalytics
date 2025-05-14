"use client"

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface FormSelectProps {
  label: string
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  options: { value: string; label: string }[]
  disabled?: boolean
}

export function FormSelect({
  label,
  id,
  value,
  onChange,
  placeholder = "Select an option",
  options,
  disabled = false
}: FormSelectProps) {
  // Generate a unique ID if none is provided
  const uniqueId = id || `form-select-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="space-y-2">
      <Label
        htmlFor={uniqueId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2"
      >
        {label}
      </Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id={uniqueId} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 