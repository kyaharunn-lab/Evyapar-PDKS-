"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function isoToDisplayDate(value: unknown) {
  const text = String(value || "")
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  return text
}

function normalizeDisplayDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function displayDateToIso(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ""
  const [, day, month, year] = match
  const date = new Date(`${year}-${month}-${day}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ""
  if (date.getFullYear() !== Number(year) || date.getMonth() + 1 !== Number(month) || date.getDate() !== Number(day)) return ""
  return `${year}-${month}-${day}`
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, defaultValue, onChange, onBlur, ...props }, ref) => {
    const isDate = type === "date"
    const [dateDraft, setDateDraft] = React.useState(() => isoToDisplayDate(value ?? defaultValue ?? ""))

    React.useEffect(() => {
      if (isDate) setDateDraft(isoToDisplayDate(value ?? defaultValue ?? ""))
    }, [defaultValue, isDate, value])

    if (isDate) {
      return (
        <input
          type="text"
          inputMode="numeric"
          lang="tr-TR"
          placeholder="dd/mm/yyyy"
          autoComplete="off"
          data-date-format="dd/mm/yyyy"
          value={dateDraft}
          onChange={(event) => {
            const displayValue = normalizeDisplayDate(event.target.value)
            const isoValue = displayDateToIso(displayValue)
            const nextValue = isoValue || displayValue
            setDateDraft(displayValue)

            if (onChange) {
              event.target.value = nextValue
              event.currentTarget.value = nextValue
              onChange(event)
            }
          }}
          onBlur={(event) => {
            if (dateDraft && !displayDateToIso(dateDraft)) {
              setDateDraft("")
              if (onChange) {
                event.target.value = ""
                event.currentTarget.value = ""
                onChange(event as unknown as React.ChangeEvent<HTMLInputElement>)
              }
            }
            onBlur?.(event)
          }}
          className={cn(
            "flex h-11 w-full rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2 text-base shadow-sm shadow-slate-200/50 backdrop-blur-xl transition-all duration-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-indigo-300 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }

    return (
      <input
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        className={cn(
          "flex h-11 w-full rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2 text-base shadow-sm shadow-slate-200/50 backdrop-blur-xl transition-all duration-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-indigo-300 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
