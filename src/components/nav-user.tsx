"use client"

import * as React from "react"
import { User } from "lucide-react"

type NavUserProps = {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function NavUser({ user }: NavUserProps) {
  return (
    <div className="flex items-center gap-2 p-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            width={32}
            height={32}
            className="aspect-square h-full w-full"
          />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">Builder</span>
        <span className="truncate text-xs text-muted-foreground">v1.0</span>
      </div>
    </div>
  )
}
