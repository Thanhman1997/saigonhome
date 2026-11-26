"use client"

import type React from "react"
import { useActionState, useMemo, useState, useTransition } from "react"
import { updateDesignSettings, resetDesignSettingsToPreset, type DesignSettingsActionState } from "@/app/actions/design-settings"
import {
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  SHADOW_OPTIONS,
  BODY_SIZE_OPTIONS,
  HEADING_SIZE_OPTIONS,
  WEIGHT_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  DESIGN_PRESETS,
  COLOR_PALETTES,
  buildDesignTokenVars,
  type DesignSettingsValues,
} from "@/lib/design-tokens"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const initialState: DesignSettingsActionState = { success: false }

function ColorField({
  label,
  value,
  onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const inputId = `design-color-${label.toLowerCase().replaceAll(" ", "-")}`
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
        />
        <input
          type="text"
          aria-label={`${label} hex value`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
        />
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: { label: string; value: string; onChange: (v: string) => void; options: { key: string; label: string }[] }) {
  const inputId = `design-select-${label.toLowerCase().replaceAll(" ", "-")}`
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={inputId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.key} value={o.key}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function DesignSettingsForm({ initial }: { initial: DesignSettingsValues }) {
  const [values, setValues] = useState<DesignSettingsValues>(initial)
  const [state, formAction, pending] = useActionState(updateDesignSettings, initialState)
  const [isResetting, startReset] = useTransition()

  const previewVars = useMemo(() => buildDesignTokenVars(values), [values])

  function set<K extends keyof DesignSettingsValues>(key: K, value: DesignSettingsValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value, presetKey: "custom" }))
  }

  function applyPreset(presetKey: string) {
    const preset = DESIGN_PRESETS.find((p) => p.key === presetKey)
    if (!preset) return
    setValues(preset.values)
    startReset(async () => {
      await resetDesignSettingsToPreset(presetKey)
    })
  }

  function applyPalette(paletteKey: string) {
    const palette = COLOR_PALETTES.find((option) => option.key === paletteKey)
    if (!palette) return
    setValues((previous) => ({ ...previous, ...palette.colors, presetKey: "custom" }))
  }

  return (
    <div className="grid grid-cols-1 gap-6 @min-[60rem]:grid-cols-[minmax(0,1fr)_minmax(0,22.5rem)]">
      <form action={formAction} className="flex flex-col gap-6">
        {Object.entries(values).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Presets</CardTitle>
            <CardDescription>Start from a curated look, then fine-tune anything below.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {DESIGN_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset.key)}
                disabled={isResetting}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  values.presetKey === preset.key ? "border-accent bg-accent/10" : "border-border hover:bg-muted"
                }`}
              >
                <p className="text-sm font-medium">{preset.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="typography">
          <TabsList className="h-auto max-w-full flex-wrap justify-start">
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
          </TabsList>

          <TabsContent value="typography" className="mt-4">
            <Card>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <SelectField
                  label="Heading font"
                  value={values.fontHeading}
                  onChange={(v) => set("fontHeading", v)}
                  options={FONT_OPTIONS.map((f) => ({ key: f.key, label: f.label }))}
                />
                <SelectField
                  label="Body font"
                  value={values.fontBody}
                  onChange={(v) => set("fontBody", v)}
                  options={FONT_OPTIONS.map((f) => ({ key: f.key, label: f.label }))}
                />
                <SelectField
                  label="Heading size"
                  value={values.headingSize}
                  onChange={(v) => set("headingSize", v)}
                  options={HEADING_SIZE_OPTIONS}
                />
                <SelectField
                  label="Body size"
                  value={values.bodySize}
                  onChange={(v) => set("bodySize", v)}
                  options={BODY_SIZE_OPTIONS}
                />
                <SelectField
                  label="Body font weight"
                  value={values.fontWeightBody}
                  onChange={(v) => set("fontWeightBody", v)}
                  options={WEIGHT_OPTIONS}
                />
                <SelectField
                  label="Line height"
                  value={values.lineHeight}
                  onChange={(v) => set("lineHeight", v)}
                  options={LINE_HEIGHT_OPTIONS}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Site color palettes</CardTitle>
                <CardDescription>Choose a complete color direction, then fine-tune individual colors below.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {COLOR_PALETTES.map((palette) => {
                    const selected = Object.entries(palette.colors).every(([key, value]) => values[key as keyof typeof palette.colors] === value)
                    const swatches = [palette.colors.colorPrimary, palette.colors.colorAccent, palette.colors.colorSecondary, palette.colors.colorBackground]
                    return (
                      <button
                        key={palette.key}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => applyPalette(palette.key)}
                        className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                        }`}
                      >
                        <span className="block text-sm font-medium">{palette.label}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{palette.description}</span>
                        <span className="mt-3 flex gap-2" aria-hidden="true">
                          {swatches.map((color, index) => (
                            <span key={`${palette.key}-${index}`} className="size-5 rounded-full border border-border" style={{ backgroundColor: color }} />
                          ))}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorField label="Primary" value={values.colorPrimary} onChange={(v) => set("colorPrimary", v)} />
                  <ColorField label="Secondary" value={values.colorSecondary} onChange={(v) => set("colorSecondary", v)} />
                  <ColorField label="Accent" value={values.colorAccent} onChange={(v) => set("colorAccent", v)} />
                  <ColorField label="Lotus pink" value={values.colorLotusPink} onChange={(v) => set("colorLotusPink", v)} />
                  <ColorField label="Background" value={values.colorBackground} onChange={(v) => set("colorBackground", v)} />
                  <ColorField label="Foreground" value={values.colorForeground} onChange={(v) => set("colorForeground", v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="mt-4">
            <Card>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <SelectField label="Button shape" value={values.buttonRadius} onChange={(v) => set("buttonRadius", v)} options={RADIUS_OPTIONS} />
                <SelectField
                  label="Button size"
                  value={values.buttonSize}
                  onChange={(v) => set("buttonSize", v)}
                  options={[
                    { key: "sm", label: "Compact" },
                    { key: "md", label: "Standard" },
                    { key: "lg", label: "Large" },
                  ]}
                />
                <SelectField label="Card shape" value={values.cardRadius} onChange={(v) => set("cardRadius", v)} options={RADIUS_OPTIONS} />
                <SelectField label="Card shadow" value={values.cardShadow} onChange={(v) => set("cardShadow", v)} options={SHADOW_OPTIONS} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setValues(initial)}>
            Cancel
          </Button>
          {state.success && <span className="text-sm text-muted-foreground">Saved.</span>}
          {state.error && <span className="text-sm text-destructive">{state.error}</span>}
        </div>
      </form>

      <div
        id="design-preview-scope"
        className="sticky top-6 self-start rounded-[var(--radius-card)] border border-border bg-[var(--background)] p-6 shadow-[var(--shadow-card)]"
        style={previewVars as React.CSSProperties}
      >
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Live preview</p>
        <h3
          className="mb-2 text-2xl"
          style={{
            fontFamily: `var(${FONT_OPTIONS.find((f) => f.key === values.fontHeading)?.cssVar}), serif`,
            color: "var(--foreground)",
            fontSize: "calc(1.5rem * var(--heading-scale))",
          }}
        >
          Lotus Wellness
        </h3>
        <p
          className="mb-4 text-sm"
          style={{
            fontFamily: `var(${FONT_OPTIONS.find((f) => f.key === values.fontBody)?.cssVar}), sans-serif`,
            color: "var(--foreground)",
            fontWeight: "var(--body-font-weight)",
            lineHeight: "var(--body-line-height)",
          }}
        >
          Professional mobile massage, delivered to your door.
        </p>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium"
            style={{
              borderRadius: "var(--radius-button)",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            Book Now
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium"
            style={{
              borderRadius: "var(--radius-button)",
              background: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            View Menu
          </button>
        </div>
        <div
          className="p-4 text-sm"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
            background: "var(--card)",
            color: "var(--card-foreground)",
            border: "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
          }}
        >
          Swedish Massage — 60 min
        </div>
      </div>
    </div>
  )
}
