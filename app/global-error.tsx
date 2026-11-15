"use client"

import { useEffect } from "react"

// This boundary only fires when the root layout itself throws (e.g. a
// database call in app/layout.tsx fails). It must render its own <html> and
// <body> because the root layout that would normally provide them is the
// thing that crashed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Unhandled root layout error:", error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100svh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
            backgroundColor: "#FCE2C1",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1a1a1a" }}>Something went wrong</h1>
          <p style={{ maxWidth: "28rem", fontSize: "0.875rem", lineHeight: 1.6, color: "#4a4a4a" }}>
            The page failed to load. Please try again in a moment.
          </p>
          <button
            onClick={() => reset()}
            style={{
              borderRadius: "0.5rem",
              backgroundColor: "#1a1a1a",
              color: "#fff",
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
