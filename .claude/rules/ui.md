---
paths:
  - "app/**"
  - "components/**"
---

# UI and design rules

## Direction (agreed with the owner)

- Should feel like EuroLeague: **white and orange**, light surfaces, modern
  but not heavy. Dark, gloomy themes were rejected as "boring".
- Player cards are never empty: club color background, crest, corner lines,
  jersey outline, photo with `object-cover object-top` (never crop the head).
- Results: a loss is a clear red **L**, a win a clear **W**.
- Interactions should feel fluid: subtle hover lift/shine, page fade via
  `app/template.tsx`. One deliberate motion beats effects everywhere; respect
  `prefers-reduced-motion`.
- Filters are dropdowns/segmented controls, and they **wrap** on mobile
  (a dropdown inside `overflow-x` gets clipped).
- Back buttons return to where the user came from (`?from=` read on the
  client in `ContextBackLink`, so pages stay static).

## Tokens (app/globals.css)

Use tokens, never raw hex in components: `canvas`, `paper`, `panel`, `line`,
`ink`, `ink-muted`, `ink-faint`, `accent` (#f56e0f, for surfaces and lines),
`accent-ink` (#c2560a, for orange **text** on white — AA contrast),
`accent-soft`. Fonts: `font-display` = Barlow Condensed (headings, names,
numbers), `font-sans` = Barlow (body), loaded from `@fontsource`, no Google
Fonts requests. Club colors come from `lib/euroleague/clubColors.ts`
(ASVEL is graphite `#3d434c`, not green).

## Components

- Pages are Server Components; add `"use client"` only for state, effects or
  animation, and keep those components small.
- Reuse `components/ui/` (Dropdown, Segmented, StatTile, PageHeader,
  BackLink) before creating a new primitive.
- Images: `next/image` with the remote patterns in `next.config.ts`.
- Tables on mobile: horizontal scroll with a sticky first column; short club
  names under `sm`.
- Check every UI change at desktop and ~390px width, keyboard focus visible.
