# Owlread architecture

Status: draft for review. Nothing here is built yet.

Scope: vision only (as of Nov 20, 2026).

## 1. What v1 is
Browser extension for Chrome, Edge, Firefox (desktop): text (font, size, thickness, letter/word/line spacing, line width, no justify); colour and light (low-glare themes, brightness, contrast, underlined links); clean-up (no text shadows, stop animations); reading ruler; Simple and Advanced controls, presets, per-site settings, on/off shortcut; calibration wizard; reading-speed and comfort check.
Not in v1: reader mode, read-aloud (v1.1), focus mode, PDF (v1.2), Safari and mobile (v2).
Out of scope: colour vision deficiency, dyslexia and migraine; don't block adding them later.

## 2. Hard rules
1. Never break the page; one-click off switch per site.
2. No server in v1; no requests to our own or third-party servers. One exception: the colour engine may re-download stylesheets the page itself already loads, to read their colours (6.3).
3. Private by default; anything leaving the device is opt-in.
4. No flash; apply before first paint (except a possible zoom jump on the first visit to a site, see 6.1).
5. Honest evidence labels (6.6).

## 3. Big picture
Core engine (pure TS, no browser APIs) turns settings into CSS and colour values. Content script applies it on each page and frame. Settings store (storage.local, sync opt-in) is the single source of truth; parts listen to it. Background worker: shortcuts, zoom, first run, badge. Popup, wizard, test pages: small Svelte apps.

## 4. Repo layout
pnpm workspace: packages/engine (src/settings, resolve, css, colour, simple; test/ with Vitest) and extension/ (WXT: entrypoints background.ts, content, popup, calibrate, reading-test; lib/ storage, messaging, colour adapter; public/fonts; e2e/ Playwright). Plus docs/ and .github/workflows/. A lint rule bans browser APIs in the engine.

## 5. Settings
Settings = { enabled; text {font: site|atkinson|verdana|system, sizePercent (zoom), weight, spacing, spacingLinked=true, letterSpacingEm?, wordSpacingEm?, lineHeight, maxLineWidthCh|null, noJustify}; colour {theme: site|light-soft|dark-soft|warm|custom, custom?, brightness, contrast, underlineLinks}; cleanup {removeTextShadow, stopAnimations}; aids {readingRuler} }. Safe defaults; clamp out-of-range values.
Layers, last wins: defaults, preset (Comfort, Astigmatism, Keratoconus, Low vision, Night), personal profile, per-site override (by hostname, optional whole domain). The popup shows each value's layer.
Storage: local by default; opt-in sync (chunked for limits); schemaVersion + migrations; export and import as a file.
Simple slider blends a preset's light and maximum ends; Advanced edits any field.

## 6. Page changes
Stages in order: text, theme, clean-up and aids. Each has apply/update/remove; one failing doesn't stop the others.

### 6.1 Size
Size via tabs.setZoom, not CSS. Per-site zoom remembered by the browser, so pages open at the right size after the first visit. Save the user's previous zoom and restore it when Owlread is turned off for the site. If the user changes zoom themselves (Ctrl +/-), adopt it as their size for the site. Check Firefox support for per-site zoom control in the spike.

### 6.2 Text
One stylesheet at document_start; text containers only; em units; letter and word spacing linked (Galliussi 2020); bundled Atkinson Hyperlegible; skip icon fonts; weight with outline fallback; line width off by default.

### 6.3 Theme
Dark Reader engine (MIT) behind a ColourEngine adapter; brightness and contrast in the engine, not an <html> filter; clamp away from pure black and white; skip if the Dark Reader extension is active; keep its licence notice. Spike first (size, speed, cross-origin CSS, API coverage, Firefox site access at install, Firefox main-world script support).

### 6.4 Clean-up and aids
Remove text-shadow; pause animations, autoplay and GIFs; respect prefers-reduced-motion; underline links; ruler overlay in its own shadow root, never blocking clicks.

### 6.5 Keep pages working
Per-site off switch, per-site safe mode, versioned site-fixes file (bundled in the extension, updated only with releases), "can't change this page" notice, auto kill switch on repeated errors.

### 6.6 Evidence labels
Supported (larger text, linked spacing); Comfort option, evidence pending (thicker letters, no pure black or white, short lines, low-glare themes); Preference (theme colours, warm tint). Defaults stay light; calibration decides.

## 7. Content script
document_start, all_frames, about:blank; live updates via storage.onChanged; one batched MutationObserver; adoptedStyleSheets for open shadow roots: a tiny main-world script at document_start reports each new open shadow root (initial scan for existing ones), and Owlread styles and observes inside it; closed roots are skipped; styles tagged for full removal.

## 8. Background worker
MV3, stateless: shortcut toggle per site, zoom, badge, first-run welcome with calibration (checks site access and asks for it if missing), optional context menu.

## 9. UI
Low-vision-first Svelte UI. Popup: "Owlread can't reach this site" notice with an Allow button when site access is missing; per-site on/off, Simple slider, presets, Advanced, Calibrate, Reading test. Wizard: "which is clearer, A or B?", one setting at a time, adaptive staircase, 2 to 3 minutes, skippable, gives a profile, never a diagnosis. Reading check: our own MNREAD-style sentences, off vs on in random order, 1 to 5 comfort rating, local chart, JSON and CSV export for the beta.

## 10. Permissions, privacy and security
All-sites host access, storage, tabs, commands, optional contextMenus. Site access may be partial (users can remove it or limit it to chosen sites, in all browsers); Owlread detects missing access and asks for it, never failing silently. No analytics, remote code or own network calls; CI blocks fetch outside the colour-engine path; plain privacy page that explains the stylesheet exception (rule 2).

### 10.1 Code
No eval, new Function or remote code; keep the default strict CSP for extension pages. Page content is untrusted: never insert it as HTML; build DOM nodes safely. Messages are untrusted: check the sender and validate every message's shape. The main-world script (7) can be spoofed by the page, so it only reports that a shadow root exists and never controls settings. Imported settings files are untrusted: validate and clamp. Never log page content or URLs.

### 10.2 Dependencies
Few dependencies; review each new one in its PR. Commit the lockfile; pin Dark Reader to a reviewed version. Dependabot for security updates; dependency audit in CI.

### 10.3 CI and repo
CI runs with read-only permissions; GitHub Actions pinned to exact versions. Lint includes security rules (no eval, no unsafe HTML). main and develop are protected: changes only through PRs, CI must pass. GitHub secret scanning on. SECURITY.md explains how to report a vulnerability privately.

### 10.4 Releases
Store publishing by hand only, from a tagged commit. Two-factor login on all store and GitHub accounts.

## 11. Quality
Vitest for the engine; Playwright in Chromium and Firefox; top 100 sites (saved daily, live weekly; checks for scrollbars, overlap, icon breakage, screenshots; under 2% broken). Text stage under 5 ms, no flash, CI benchmarks. GitHub Actions on every PR; manual store publishing.

## 12. Room to grow
Reader mode, read-aloud, focus mode, PDF, optional colour vision and dyslexia modules, and engine reuse in desktop or mobile apps.

## 13. Languages
i18n files from day one; Noto fallbacks via unicode-range for Armenian and Cyrillic if shipped.

## 14. Decisions (approved Nov 21, 2026)
1 local + opt-in sync; 2 file export, no server; 3 Dark Reader via adapter after a spike; 4 linked spacing; 5 zoom for size; 6 brightness and contrast in the engine; 7 two packages; 8 Svelte; 9 line width off; 10 labels as 6.6. Decided: MIT license; English only in v1. Open: browser-only v1.

## 15. Order of work (small PRs)
One PR per step, on a branch, into develop. About 300 changed lines per PR at most (generated files excluded).
1. Skeleton: pnpm workspace, WXT, TypeScript, empty engine and extension; SECURITY.md and Dependabot (10.2, 10.3).
2. Lint and CI: GitHub Actions runs lint (including the engine browser-API ban, the network rule and security rules) and a dependency audit on every PR into develop and main; tests join CI as they are added.
3. Spike: Dark Reader, plus Firefox checks (zoom, site access, main-world script). Findings note; spike code not merged.
4. Engine settings and tests.
5. Text stage, part 1: font, spacing, line height, plus the off switch.
6. Text stage, part 2: shadow roots and page watcher, plus the first Playwright test.
7. Popup: basic controls and the "can't reach this site" notice.
8. Shortcut and zoom.
9. Theme, part 1: basic themes through the adapter.
10. Theme, part 2: brightness and contrast.
11. Clean-up and reading ruler.
12. Advanced mode and presets.
13. Calibration, part 1: the "A or B?" screen.
14. Calibration, part 2: adaptive staircase that produces a profile.
15. Reading check and export.
16. Top-100 site tests.
