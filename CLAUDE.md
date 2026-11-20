# Owlread: context for Claude Code

## What this is
Owlread is an open-source browser extension (Chrome, Edge, Firefox) that makes every web page comfortable to read, whatever your eyes. Full design: docs/architecture.md (the source of truth; read it before any work).

## Working style
- Keep replies SHORT: plain words, short lines, lists, bold key points.
- One question at a time, with a recommendation.
- All code is reviewed in an editor: small, focused PRs, one topic each.

## Scope (vision only)
Users: no vision problems, mild issues, astigmatism, keratoconus and low vision, light sensitivity.
Out of scope: colour blindness, dyslexia and migraine (don't block adding them later).
Non-goals: prescription correction, diagnosis, medical claims.

## Principles
Comfort first, not illness. Personal calibration ("which is clearer?"). Never break pages (light touch, per-site off switch, top-site tests). Evidence-based claims only (architecture 6.6). Private by default: settings on the device, sync opt-in, no server in v1.

## v1 features
Text size (browser zoom), thickness, letter and word spacing (linked), line height, max line width; low-glare themes (no pure black or white), brightness, contrast; remove shadows and animations; reading ruler; calibration wizard and presets; Simple and Advanced modes; per-site settings and a shortcut; a reading-speed and comfort check with file export.
Later: reader mode and read-aloud (v1.1), focus mode and PDF (v1.2), Safari (v2).

## Stack
TypeScript, WXT (MV3), Svelte, pnpm workspace (engine package with no browser APIs, plus extension), Vitest, Playwright, GitHub Actions. Colour: Dark Reader's engine (MIT) behind a ColourEngine adapter, after a spike.

## Rules
1. Agree on architecture and scope before code; never change the architecture without asking.
2. Follow the order in architecture section 15: one small PR per step, on a branch, into develop (develop merges to main only for releases).
3. Test the engine. Explain each PR in 3 to 5 short lines.
4. Follow the security rules in architecture section 10.

## Status
Architecture PR under review; section 14 decisions await the maintainer's OK.
Decided: MIT license; English only in v1 (other languages later).
