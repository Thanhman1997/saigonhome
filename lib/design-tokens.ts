// Shared constants + helpers for the admin Design Settings module.
// Keeps the set of choices the admin can pick from intentionally small and
// vetted (fonts, radii, shadows) so arbitrary/unsafe values never reach CSS.

export type FontKey = "cormorant" | "dm-sans" | "playfair" | "dm-serif-display" | "lora" | "manrope" | "inter"

export const FONT_OPTIONS: { key: FontKey; label: string; cssVar: string; category: "serif" | "sans" }[] = [
  { key: "cormorant", label: "Cormorant Garamond", cssVar: "--font-cormorant", category: "serif" },
  { key: "playfair", label: "Playfair Display", cssVar: "--font-playfair", category: "serif" },
  { key: "dm-serif-display", label: "DM Serif Display", cssVar: "--font-dm-serif-display", category: "serif" },
  { key: "lora", label: "Lora", cssVar: "--font-lora", category: "serif" },
  { key: "dm-sans", label: "DM Sans", cssVar: "--font-dm-sans", category: "sans" },
  { key: "manrope", label: "Manrope", cssVar: "--font-manrope", category: "sans" },
  { key: "inter", label: "Inter", cssVar: "--font-inter", category: "sans" },
]

export function fontCssVar(key: string): string {
  return FONT_OPTIONS.find((f) => f.key === key)?.cssVar ?? "--font-cormorant"
}

export type RadiusKey = "none" | "sm" | "md" | "lg" | "full"
export const RADIUS_OPTIONS: { key: RadiusKey; label: string; value: string }[] = [
  { key: "none", label: "Square", value: "0px" },
  { key: "sm", label: "Slightly rounded", value: "0.375rem" },
  { key: "md", label: "Rounded", value: "0.625rem" },
  { key: "lg", label: "Very rounded", value: "1rem" },
  { key: "full", label: "Pill", value: "9999px" },
]
export function radiusValue(key: string): string {
  return RADIUS_OPTIONS.find((r) => r.key === key)?.value ?? "0.625rem"
}

export type ShadowKey = "none" | "sm" | "md" | "lg"
export const SHADOW_OPTIONS: { key: ShadowKey; label: string; value: string }[] = [
  { key: "none", label: "Flat", value: "none" },
  { key: "sm", label: "Soft", value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
  { key: "md", label: "Medium", value: "0 4px 12px -2px rgb(0 0 0 / 0.12)" },
  { key: "lg", label: "Pronounced", value: "0 12px 32px -4px rgb(0 0 0 / 0.18)" },
]
export function shadowValue(key: string): string {
  return SHADOW_OPTIONS.find((s) => s.key === key)?.value ?? "0 1px 2px 0 rgb(0 0 0 / 0.05)"
}

export type SizeKey = "sm" | "md" | "lg" | "xl"
// Body/heading "size" scales the html root font-size within a tight, safe
// range so rem-based Tailwind utilities scale proportionally without
// breaking layout.
export const BODY_SIZE_OPTIONS: { key: SizeKey; label: string; rootPx: number }[] = [
  { key: "sm", label: "Compact", rootPx: 15 },
  { key: "md", label: "Standard", rootPx: 16 },
  { key: "lg", label: "Comfortable", rootPx: 17 },
  { key: "xl", label: "Spacious", rootPx: 18 },
]
export function bodySizeRootPx(key: string): number {
  return BODY_SIZE_OPTIONS.find((s) => s.key === key)?.rootPx ?? 16
}

export const HEADING_SIZE_OPTIONS: { key: SizeKey; label: string; scale: number }[] = [
  { key: "sm", label: "Compact", scale: 0.92 },
  { key: "md", label: "Standard", scale: 1 },
  { key: "lg", label: "Bold", scale: 1.06 },
  { key: "xl", label: "Dramatic", scale: 1.14 },
]
export function headingScale(key: string): number {
  return HEADING_SIZE_OPTIONS.find((s) => s.key === key)?.scale ?? 1
}

export type WeightKey = "normal" | "medium"
export const WEIGHT_OPTIONS: { key: WeightKey; label: string; value: string }[] = [
  { key: "normal", label: "Regular", value: "400" },
  { key: "medium", label: "Medium", value: "500" },
]
export function weightValue(key: string): string {
  return WEIGHT_OPTIONS.find((w) => w.key === key)?.value ?? "400"
}

export type LineHeightKey = "tight" | "normal" | "relaxed"
export const LINE_HEIGHT_OPTIONS: { key: LineHeightKey; label: string; value: string }[] = [
  { key: "tight", label: "Tight", value: "1.4" },
  { key: "normal", label: "Standard", value: "1.5" },
  { key: "relaxed", label: "Airy", value: "1.7" },
]
export function lineHeightValue(key: string): string {
  return LINE_HEIGHT_OPTIONS.find((l) => l.key === key)?.value ?? "1.5"
}

/** Picks a legible foreground (near-black or near-white) for a given hex background. */
export function contrastForeground(hex: string): string {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return "#ffffff"
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#211a12" : "#fdfaf3"
}

export type DesignSettingsValues = {
  fontHeading: string
  fontBody: string
  headingSize: string
  bodySize: string
  fontWeightBody: string
  lineHeight: string
  colorPrimary: string
  colorSecondary: string
  colorAccent: string
  colorLotusPink: string
  colorBackground: string
  colorForeground: string
  buttonRadius: string
  buttonSize: string
  cardRadius: string
  cardShadow: string
  presetKey: string
}

export const DESIGN_PRESETS: { key: string; label: string; description: string; values: DesignSettingsValues }[] = [
  {
    key: "lotus-premium",
    label: "Lotus Premium",
    description: "Warm, spa-like tones with soft serif headings — the current default look.",
    values: {
      fontHeading: "cormorant",
      fontBody: "dm-sans",
      headingSize: "lg",
      bodySize: "md",
      fontWeightBody: "normal",
      lineHeight: "normal",
      colorPrimary: "#3B2418",
      colorSecondary: "#E8D3B5",
      colorAccent: "#C96A12",
      colorLotusPink: "#C96A12",
      colorBackground: "#F8F0E5",
      colorForeground: "#3B2418",
      buttonRadius: "full",
      buttonSize: "md",
      cardRadius: "lg",
      cardShadow: "sm",
      presetKey: "lotus-premium",
    },
  },
  {
    key: "modern-minimal",
    label: "Modern Minimal",
    description: "Clean sans-serif system with crisp corners and a single confident accent.",
    values: {
      fontHeading: "manrope",
      fontBody: "inter",
      headingSize: "md",
      bodySize: "md",
      fontWeightBody: "normal",
      lineHeight: "normal",
      colorPrimary: "#171512",
      colorSecondary: "#e7e2d8",
      colorAccent: "#6b6255",
      colorLotusPink: "#c17b56",
      colorBackground: "#faf8f4",
      colorForeground: "#171512",
      buttonRadius: "sm",
      buttonSize: "md",
      cardRadius: "sm",
      cardShadow: "none",
      presetKey: "modern-minimal",
    },
  },
  {
    key: "editorial-serif",
    label: "Editorial Serif",
    description: "Bold display serif headings, generous spacing, dramatic contrast.",
    values: {
      fontHeading: "playfair",
      fontBody: "lora",
      headingSize: "xl",
      bodySize: "lg",
      fontWeightBody: "normal",
      lineHeight: "relaxed",
      colorPrimary: "#1c1a24",
      colorSecondary: "#d8cfe0",
      colorAccent: "#5b4b8a",
      colorLotusPink: "#a24d63",
      colorBackground: "#f6f3f8",
      colorForeground: "#1c1a24",
      buttonRadius: "none",
      buttonSize: "lg",
      cardRadius: "none",
      cardShadow: "md",
      presetKey: "editorial-serif",
    },
  },
]

/** Builds a plain object of CSS custom properties for scoped, inline-style previews (no global side effects). */
export function buildDesignTokenVars(s: DesignSettingsValues): Record<string, string> {
  const primaryFg = contrastForeground(s.colorPrimary)
  const accentFg = contrastForeground(s.colorAccent)
  const secondaryFg = contrastForeground(s.colorSecondary)
  const lotusFg = contrastForeground(s.colorLotusPink)

  return {
    "--background": s.colorBackground,
    "--foreground": s.colorForeground,
    "--card": s.colorBackground,
    "--card-foreground": s.colorForeground,
    "--primary": s.colorPrimary,
    "--primary-foreground": primaryFg,
    "--secondary": s.colorSecondary,
    "--secondary-foreground": secondaryFg,
    "--accent": s.colorAccent,
    "--accent-foreground": accentFg,
    "--lotus-pink": s.colorLotusPink,
    "--lotus-pink-foreground": lotusFg,
    "--font-serif": `var(${fontCssVar(s.fontHeading)}), 'Cormorant Garamond', serif`,
    "--font-sans": `var(${fontCssVar(s.fontBody)}), 'DM Sans', system-ui, sans-serif`,
    "--radius-button": radiusValue(s.buttonRadius),
    "--radius-card": radiusValue(s.cardRadius),
    "--shadow-card": shadowValue(s.cardShadow),
    "--heading-scale": String(headingScale(s.headingSize)),
    "--body-font-weight": weightValue(s.fontWeightBody),
    "--body-line-height": lineHeightValue(s.lineHeight),
  }
}

export function buildDesignTokenCss(s: DesignSettingsValues): string {
  const primaryFg = contrastForeground(s.colorPrimary)
  const accentFg = contrastForeground(s.colorAccent)
  const secondaryFg = contrastForeground(s.colorSecondary)
  const lotusFg = contrastForeground(s.colorLotusPink)

  return `:root{
  --background:${s.colorBackground};
  --foreground:${s.colorForeground};
  --card:${s.colorBackground};
  --card-foreground:${s.colorForeground};
  --primary:${s.colorPrimary};
  --primary-foreground:${primaryFg};
  --secondary:${s.colorSecondary};
  --secondary-foreground:${secondaryFg};
  --accent:${s.colorAccent};
  --accent-foreground:${accentFg};
  --lotus-pink:${s.colorLotusPink};
  --lotus-pink-foreground:${lotusFg};
  --ring:${s.colorAccent};
  --font-serif:var(${fontCssVar(s.fontHeading)}), 'Cormorant Garamond', serif;
  --font-sans:var(${fontCssVar(s.fontBody)}), 'DM Sans', system-ui, sans-serif;
  --radius-button:${radiusValue(s.buttonRadius)};
  --radius-card:${radiusValue(s.cardRadius)};
  --shadow-card:${shadowValue(s.cardShadow)};
  --heading-scale:${headingScale(s.headingSize)};
  --body-font-weight:${weightValue(s.fontWeightBody)};
  --body-line-height:${lineHeightValue(s.lineHeight)};
}
html{font-size:${bodySizeRootPx(s.bodySize)}px;}
body{font-weight:var(--body-font-weight);line-height:var(--body-line-height);}
h1,h2,h3{font-size:calc(1em * var(--heading-scale));}`
}
