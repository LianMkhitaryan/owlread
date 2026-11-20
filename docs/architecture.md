# Owlread Architecture (Draft)

> Status: draft for review. Nothing here is implemented yet.

## Goal

Owlread makes any web page comfortable to read by adjusting typography, color, spacing and layout to the reader's needs: low vision, color vision deficiency, dyslexia, light sensitivity, or simple preference.

## Principles

- **Local-first and private.** All processing happens in the browser. No page content leaves the device; no accounts or tracking.
- **Non-destructive.** Owlread layers styles over a page and can be switched off instantly, restoring the original.
- **Cross-browser.** One codebase targeting Manifest V3 in Chromium browsers and Firefox.
- **Accessible by default.** The extension's own UI meets WCAG 2.2 AA and works with keyboard and screen readers.

## Components

### 1. Content script
Injected into each page. Responsibilities:
- Apply the active reading profile by injecting a stylesheet (fonts, size, line height, letter/word spacing, colors, max line width).
- Optional **reader view**: extract the main article content and render it in a clean, isolated layout.
- Observe DOM changes (`MutationObserver`) so dynamically loaded content is styled too.
- Respect per-site overrides and the page's own dark mode where present.

### 2. Background service worker
- Stores and syncs settings (`storage.sync`, with `storage.local` fallback).
- Resolves which profile applies to a given site.
- Handles keyboard shortcuts and toolbar/context-menu actions.

### 3. Popup
Quick controls for the current tab: on/off, profile switcher, font size, theme, and "always use on this site".

### 4. Options page
Full profile editor with live preview, per-site rules, import/export of settings.

## Data model

```
Profile {
  id, name
  font: { family, size, weight }
  spacing: { lineHeight, letter, word, paragraph }
  colors: { text, background, link, theme: "light" | "dark" | "sepia" | "custom" }
  layout: { maxLineWidth, readerView: boolean }
  filters: { contrast, colorBlindMode?, reduceMotion }
}

Settings {
  defaultProfileId
  profiles: Profile[]
  siteRules: { [origin]: { profileId | "off" } }
}
```

## Data flow

1. Page loads → content script asks the service worker for the profile for this origin.
2. Content script injects the generated CSS before first paint where possible to avoid flicker.
3. User changes a setting in the popup → saved to storage → `storage.onChanged` notifies all open tabs → styles update live.

## Open questions

- Which content-extraction approach to use for reader view (e.g. a Readability-style algorithm vs. a custom heuristic)?
- Bundle a dyslexia-friendly font, or rely on system fonts only?
- How to handle sites with strict CSP or shadow DOM–heavy layouts?
- Minimum supported browser versions?
