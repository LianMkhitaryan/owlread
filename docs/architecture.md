# Owlread architecture

Status: living document; section 14 is the single list of what is approved, proposed and open. Any change needs the maintainer's OK in a PR.

Scope: vision only (as of Nov 20, 2026).

## 1. What v1 is
Browser extension for Chrome, Edge, Firefox (desktop): text (font, size, thickness, letter/word/line spacing, line width, no justify); colour and light (low-glare themes, brightness, contrast, underlined links); clean-up (no text shadows, stop animations); reading ruler; Simple and Advanced controls, presets, per-site settings, on/off shortcut; calibration wizard; reading-speed and comfort check.
Not in v1: reader mode, read-aloud (v1.1), focus mode, PDF (v1.2), Safari and mobile (v2).
Out of scope: colour vision deficiency, dyslexia and migraine; don't block adding them later.

### 1.1 Milestones
Start small, polish, then grow. Each milestone is usable on its own; later steps never block an earlier release.
- Beta 0.1, first release (steps 1 to 12): text size and per-site zoom, font, weight, spacing, line height and line width; glare themes with brightness and contrast; per-site settings and off switch; personal profiles and presets; shortcut; diagnostics; top-20 site tests pass. Published to all three stores.
- Beta 0.x updates (steps 13 to 14): clean-up (shadows, animations), reading ruler, image dimming, "use the site's own dark mode".
- 1.0 (steps 15 to 19): calibration wizard, reading check and export, top-100 site tests, accessibility audit of our UI.
- Early testing: from step 7 the maintainer uses Owlread daily, and 5 to 10 testers with keratoconus or low vision join as soon as possible. Their feedback can reorder or cut later steps.

## 2. Hard rules
1. Never break the page; one-click off switch per site.
2. No server in v1; no requests to our own or third-party servers. One exception: the colour engine may re-download stylesheets the page itself already loads, to read their colours (6.3).
3. Private by default; anything leaving the device is opt-in.
4. No visible flash: page changes apply before or at first paint (mechanism in 7), checked by tests (11). Possible exception: a zoom jump on the first visit to a site with its own zoom size (6.1).
5. Honest evidence labels (6.6).

## 3. Big picture
Core engine (pure TS, no browser APIs) turns settings into CSS and colour values. Content script applies it on each page and frame. Settings store (storage.local, sync opt-in) is the single source of truth; parts listen to it. Background worker: shortcuts, zoom, first run, badge. Popup, wizard, test pages: small Svelte apps.

## 4. Repo layout
pnpm workspace: packages/engine (src/settings, resolve, css, colour, simple; test/ with Vitest) and extension/ (WXT: entrypoints background.ts, content, popup, calibrate, reading-test; lib/ storage, messaging, colour adapter; public/fonts; e2e/ Playwright). Plus docs/ and .github/workflows/. A lint rule bans browser APIs in the engine.

## 5. Settings
Settings = { enabled; text {font: site|atkinson|verdana|system, sizePercent (global: CSS text size), siteZoomPercent? (per-site only: browser zoom), weight, spacing, spacingLinked=true, letterSpacingEm?, wordSpacingEm?, lineHeight, maxLineWidthCh|null, noJustify}; colour {theme: site|light-soft|dark-soft|warm|custom, custom?, brightness, contrast, underlineLinks}; cleanup {removeTextShadow, stopAnimations}; aids {readingRuler} }. Safe defaults; clamp out-of-range values.
Layers, last wins: defaults, preset, personal profile, per-site override (by hostname, optional whole domain). The popup shows each value's layer.
Presets are named by what they do, never by a condition: Comfort, Sharper text, Extra clear, Large print, Night. Each description may add one neutral line, such as "Some people with keratoconus start here", and never promises a benefit.
Personal profiles: everyone's eyes differ (strong or mild short- or long-sightedness, astigmatism, mixes), so users create as many named profiles as they need (for example "With glasses", "Without glasses", "Evening"), each from a preset, from calibration or from scratch. Switch in the popup or with a shortcut; one active profile at a time.
Ranges are wide enough for strong needs: global text size 50 to 400%, per-site zoom up to the browser maximum, letter spacing 0 to 0.5 em, word spacing 0 to 1 em, line height 1 to 3, extra weight and contrast up to the engine limits. Clamping only stops technically broken values, never "unusual" ones.
No prescription input: Owlread never asks for diopters or a diagnosis, because screen settings can't correct optics (non-goal); calibration finds what looks clearest instead.
Storage: local by default; opt-in sync (chunked for limits); schemaVersion + migrations; export and import as a file.
Sync-ready: every profile and per-site override has a stable random id, an updatedAt time and the id of the device that changed it; sync merges item by item, newest updatedAt wins, device id breaks ties (small clock differences are accepted).
Sync storage: one key per item, never one item split across keys; deleting leaves a tombstone kept 90 days so deleted items don't come back; per-site entries are capped (least recently used dropped first) to stay inside browser sync limits. The sync consent says plainly that the list of sites with custom settings is synced through the browser account.
Private windows: per-site changes made there are kept in storage.session only and are gone when the window closes.
consents { } section, every entry off by default; anything that would leave the device checks it first (rule 3).
One versioned JSON format (schemaVersion) for storage, export files and reading-check results.
Migrations are pure engine functions, tested from every released schemaVersion to the current one.
Simple slider blends a preset's light and maximum ends; Advanced edits any field.

## 6. Page changes
Stages in order: text, theme, clean-up and aids. Each has apply/update/remove; one failing doesn't stop the others.

### 6.1 Size
Global text size: CSS, applied by the text stage (6.2) to text containers only; layout boxes are not resized. No browser zoom, so nothing about visited sites is stored in the browser.
Per-site size: browser zoom (tabs.setZoom, per-origin) only on sites where the user sets a size themselves. Owlread records those origins; turning Owlread off for a site, or entirely, restores the zoom it had before. The browser's own zoom list then holds only sites the user chose. Uninstall can't run cleanup, so the privacy page says this.
If the user changes zoom themselves (Ctrl +/-) on such a site, Owlread adopts it as that site's size; onZoomChange events caused by Owlread's own setZoom calls are ignored.
Private windows: per-site zoom is per-tab only (5).
Check Firefox per-site zoom control in the spike.

### 6.2 Text
One stylesheet at document_start; text containers only; global text size (6.1); em units; skip icon fonts.
Letter and word spacing linked: widening letters without widening words slowed reading (Galliussi et al. 2020, children with and without dyslexia); no low-vision study shows a speed gain from extra spacing, so it is a comfort option (6.6).
Font: bundled Atkinson Hyperlegible as the default, with alternatives; described as "designed for distinct letters", not as proven.
Weight: the default avoids thin text rather than adding bold; extra weight with outline fallback is a comfort option.
Line width: off by default; at large sizes it never goes below 13 characters per line, since low-vision readers need about 8 to 13 for near-full speed (Atilgan, Xiong and Legge 2020).
Keep the reader's place: when settings change (live preview, profile switch), the text under the reader stays in view (scroll anchoring).

### 6.3 Theme
Dark Reader engine (MIT) behind a ColourEngine adapter; brightness and contrast in the engine, not an <html> filter; clamp away from pure black and white; skip if the Dark Reader extension is active; keep its licence notice.
Frames: the theme runs in the top frame and same-site frames by default; other frames get the text stage only.
Forced colours: when the system uses forced colours (Windows High Contrast, forced-colors: active), the theme stage stays off; text and clean-up stages still apply.
Image dimming: images and videos can be dimmed separately (0 to 50%), never inverted.
Site's own dark mode: when a site offers one (prefers-color-scheme or a known toggle), the user can choose to use it instead of the Owlread theme.
Stylesheet fetch (rule 2 exception): only the background worker fetches, and only URLs that appear as <link rel=stylesheet> in the sender's own tab and frame (checked with sender.tab and sender.frameId); http and https only; no cookies (credentials: omit); text/css responses only; at most 2 MB; 10-second timeout.
Spike first, with exit criteria: added size under 300 KB; theme stage under 50 ms on the reference page; styles added by scripts (CSSOM insertRule, CSS-in-JS) covered; memory on a page with 30 iframes under 15 MB extra; plus Firefox checks (site access at install, main-world scripts, zoom control, extension e2e tooling).
Fallback if the spike fails: an engine-native theme with a simple palette (background, text, links) and no stylesheet analysis.

### 6.4 Clean-up and aids
Remove text-shadow; pause animations, autoplay and GIFs; respect prefers-reduced-motion; underline links; ruler overlay in its own shadow root, never blocking clicks.

### 6.5 Keep pages working
Per-site off switch, per-site safe mode, versioned site-fixes file (bundled in the extension, updated only with releases), "can't change this page" notice, auto kill switch: a stage that fails 3 times on one site within a minute turns off for that site until the browser restarts, and the badge shows it.
Site fixes are data, never code, and load through one SiteFixesSource module.

### 6.6 Evidence labels
Supported: text size above the reader's critical print size (the smallest size that still allows full reading speed); enough characters per line at large sizes.
Comfort option, evidence pending: linked letter and word spacing, thicker letters, Atkinson Hyperlegible, no pure black or white, low-glare themes and dark or light polarity, image dimming.
Preference: theme colours, warm tint.
Never claim that a comfort option makes reading faster. Defaults stay light; calibration decides. Evidence sources are listed on the project site.

### 6.7 Diagnostics
Each stage records errors in a small local log: last 50 entries, error code, stage, time; never page content or URLs (10.1).
"Copy diagnostic info" in the popup puts a plain-text report on the clipboard: Owlread, browser and site-fixes versions, active settings, recent error codes. The hostname is added only if the user ticks it. Nothing is sent; the user pastes it into a GitHub issue (bug report template) if they choose.

## 7. Content script
document_start, all_frames, about:blank; live updates via storage.onChanged; one batched MutationObserver; styles tagged for full removal.
No flash: the background registers a static pre-style for the active theme (one small CSS file per built-in theme, via scripting.registerContentScripts) so the first paint already has the base colours; the content script reads settings from storage at document_start and replaces it with the full styles. Measured in the spike and in tests (11).
Shadow roots: a tiny main-world script at document_start wraps attachShadow without changing what it returns or how it behaves, and also finds declarative shadow roots (<template shadowrootmode>) and existing ones. It only fires a DOM event on the host element, with no data; the content script then reads host.shadowRoot itself, applies styles with adoptedStyleSheets and observes inside. Closed roots are skipped.

## 8. Background worker
MV3, stateless: shortcut toggle per site, zoom, badge, first-run welcome (checks site access and asks for it if missing; offers presets in the beta, calibration from 1.0), optional context menu.

## 9. UI
Low-vision-first Svelte UI. Target: WCAG 2.2 AA for all our pages, AAA for text contrast and target size where practical; full keyboard use; tested with VoiceOver and NVDA; works at 200% text size and 400% browser zoom; respects prefers-reduced-motion and the dark/light system setting. Automated axe checks in Playwright from the first UI step. The popup fits the browser's popup size limit at 200% zoom; if it doesn't fit, it opens in a full tab. Popup: "Owlread can't reach this site" notice with an Allow button when site access is missing; per-site on/off, Simple slider, presets, Advanced, Calibrate, Reading test. Wizard: measures, not only asks. A short reading test at decreasing sizes (adaptive staircase, our own MNREAD-style sentences) finds the smallest size that stays fast, then adds a margin; it runs twice because single measurements are noisy. "Which is clearer, A or B?" questions then tune weight, spacing and theme, with reading speed as the main signal and the answer as a tiebreaker (what people prefer does not always predict what they read fastest). 3 to 5 minutes, skippable, saved per profile, re-run any time (for example after new glasses or lenses); gives a profile, never a diagnosis. Reading check: our own MNREAD-style sentences, off vs on in random order, 1 to 5 comfort rating, local chart, JSON and CSV export for study participants.

## 10. Permissions, privacy and security
All-sites host access, storage, scripting (pre-style, 7), commands, optional contextMenus. The tabs permission is added only if the spike shows it is needed, because it triggers a browsing-history warning. Site access may be partial (users can remove it or limit it to chosen sites, in all browsers); Owlread detects missing access and asks for it, never failing silently. No analytics, remote code or own network calls; CI blocks fetch outside the colour-engine path; plain privacy page that explains the stylesheet exception (rule 2).

### 10.1 Code
No eval, new Function or remote code; keep the default strict CSP for extension pages. Page content is untrusted: never insert it as HTML; build DOM nodes safely. Messages are untrusted: check the sender and validate every message's shape. The main-world script (7) can be spoofed by the page, so it only reports that a shadow root exists and never controls settings. Imported settings files are untrusted: validate and clamp. Never log page content or URLs.

### 10.2 Dependencies
Few dependencies; review each new one in its PR. Commit the lockfile; pin Dark Reader to a reviewed version. Dependabot for security updates; dependency audit in CI.

### 10.3 CI and repo
CI runs with read-only permissions; GitHub Actions pinned to exact versions. Lint includes security rules (no eval, no unsafe HTML). main and develop are protected: changes only through PRs, CI must pass. GitHub secret scanning on. SECURITY.md explains how to report a vulnerability privately.

### 10.4 Releases
Store publishing by hand only, from a tagged commit. Two-factor login on all store and GitHub accounts.

## 11. Quality
Vitest for the engine (coverage at least 90%); GitHub Actions on every PR.
End-to-end: Playwright for Chromium (Chrome, Edge). Playwright can't load extensions in Firefox, so Firefox uses WebDriver BiDi (webExtension.install) through Selenium or web-ext; the tool is picked in the spike.
Site tests, growing in two steps:
- Top-20 sites (before beta): saved copies, run on every PR that touches page changes. Copies are never committed to this public repo; they are stored as release assets in a separate private repo (CI cache alone is deleted after 7 days unused).
- Top-100 sites (before 1.0): live, once a week on a schedule.
Checks, each compared with the same page with Owlread off: new horizontal scrollbar, overlapping text, icon fonts replaced, page script errors. A site counts as broken if any check fails. Goal: under 2% of sites broken.
Performance, on a reference article page and an iframe-heavy page: text stage under 5 ms; theme stage under 50 ms; under 15 MB extra memory per tab; no visible flash (first-paint screenshot). CI benchmarks use the median of 5 runs and fail the PR on a 20% slowdown.

## 12. Room to grow
Reader mode, read-aloud, focus mode, PDF, optional colour vision and dyslexia modules, and engine reuse in desktop or mobile apps.
Reader mode, read-aloud and magnification are already well served by browsers and operating systems; Owlread adds them only if testers ask.

### 12.2 Desktop app (v2 or later)
A browser extension can't change other apps. A later desktop app (for example Tauri) would reuse the engine, profiles and calibration, and could offer:
- screen-wide glare control: dimming, warm tint, softer contrast;
- a reading ruler over any app;
- calibration without a browser;
- switching OS settings per profile where the system allows (text scale, contrast, cursor size);
- a reader window for pasted text, files and PDFs.
It can't restyle font, spacing or line width inside other apps, because each app draws its own text.

### 12.1 Ready for a backend later
v1 has no server, but nothing blocks adding one:
- All settings reads and writes go through one storage module (lib/storage); a server sync would be a second implementation.
- Ids, updatedAt and one versioned JSON format (5): the export format becomes the API format.
- Reading-check results use a random id and no personal data, so they could be uploaded later, opt-in.
- Site fixes load through SiteFixesSource (6.5); a server could serve them as data.
- Any future network call goes through one module (lib/net) and checks consents (5).
- The engine is pure TypeScript, so a server or app can reuse it.
Not built now: no API client, login or database.

## 13. Languages
i18n files from day one; Noto fallbacks via unicode-range for Armenian and Cyrillic if shipped.

## 14. Decisions
Approved (Nov 21, 2026): 1 local + opt-in sync; 2 file export, no server; 3 Dark Reader via adapter after a spike; 4 linked spacing; 5 size: CSS globally, browser zoom only on sites the user chooses (changed Nov 21, 2026, for privacy; 6.1); 6 brightness and contrast in the engine; 7 two packages; 8 Svelte; 9 line width off; 10 labels as 6.6; MIT license; English only in v1.
Approved (Nov 22, 2026), from the independent review: milestones (1.1); sync-ready settings, sync limits and private windows (5); theme frames, forced colours, stylesheet-fetch limits, spike exit criteria and fallback (6.3); kill-switch thresholds (6.5); diagnostics (6.7); no-flash pre-style and shadow-root details (7); UI accessibility target (9); permissions without tabs (10); test tooling, site tests and budgets (11); backend readiness (12.1); release process (16).
Approved (Nov 22, 2026), from the tools comparison research: smaller first release and early testing (1.1); spacing, font, weight, minimum line width and keeping the reader's place (6.2); image dimming and the site's own dark mode (6.3); evidence labels (6.6); a wizard that measures reading (9); desktop app plan (12.2).
Approved (Nov 22, 2026): preset names by effect, with one neutral line (5); multiple personal profiles and wide ranges (5); no prescription input (5).
Open: browser-only v1 (no desktop or mobile app in v1); Firefox add-on id (16).

## 15. Order of work (small PRs)
One PR per step, on a branch, into develop. About 300 changed lines per PR at most (generated files excluded).
Beta 0.1:
1. Skeleton: pnpm workspace, WXT, TypeScript, empty engine and extension; SECURITY.md and Dependabot (10.2, 10.3). Done.
2. Lint and CI: GitHub Actions runs lint (including the engine browser-API ban, the network rule and security rules) and a dependency audit on every PR into develop and main; tests join CI as they are added.
3. Spike: Dark Reader, plus Firefox checks (zoom, site access, main-world script). Findings note; spike code not merged.
4. Engine settings and tests: profiles, ids, updatedAt, consents, migrations (5).
5. Text stage, part 1: size, font, spacing, line height, line width, plus the off switch.
6. Text stage, part 2: shadow roots and page watcher, keeping the reader's place, plus the first end-to-end tests (Chromium and Firefox).
7. Popup: per-site on/off, profile switch, basic controls, the "can't reach this site" notice; first axe checks. Early testing starts.
8. Shortcut and per-site zoom.
9. Theme, part 1: glare themes through the adapter, pre-style, forced colours.
10. Theme, part 2: brightness and contrast.
11. Advanced mode, presets, profile editing and diagnostics (6.7).
12. Top-20 site tests, release workflow (16), Beta 0.1 release.
Beta 0.x:
13. Clean-up and reading ruler.
14. Image dimming and the site's own dark mode.
1.0:
15. Calibration, part 1: the reading-size test.
16. Calibration, part 2: "which is clearer?" tuning that produces a profile.
17. Reading check and export.
18. Top-100 weekly site tests.
19. Accessibility audit of our UI, fixes, 1.0 release.

## 16. Versions and releases
- Semantic versions: 0.x during beta, 1.0 at launch. The version lives in one place (extension/package.json); WXT writes it into the manifest.
- PR titles follow Conventional Commits (feat:, fix:, docs:, chore:); CHANGELOG.md is updated in each release PR.
- Release: a release PR from develop to main; CI passes; manual checklist on Chrome, Edge and Firefox (install, upgrade from the previous version with real settings, off switch, top sites); merge; tag vX.Y.Z on main.
- A workflow builds the store zips from the tag, with checksums, and attaches them to a GitHub Release. Upload to the stores is manual (10.4); use staged rollout where a store offers it.
- Builds are reproducible from the repo with one script. Firefox Add-ons (AMO) also gets the matching source zip, since the code is bundled.
- Firefox manifest: a permanent gecko id (decided before the first AMO upload) and strict_min_version 140, the first desktop version that supports data_collection_permissions. Store listings must match the "no data collected" declaration.
- Hotfix: branch from main, PR into main, tag, then merge main back into develop.
- No remote kill switch (no server): a bad release is fixed by a new release; per-site off and the auto kill switch (6.5) protect users meanwhile.
