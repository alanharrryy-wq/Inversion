# SLIDE_VISUAL_INDEX

## Capture Approach
- Script: `scripts/capture-slides.mjs`
- Method:
  1. Start short-lived Vite dev server on `127.0.0.1:4173`
  2. Open deck with Playwright (`1920x1080` viewport)
  3. Navigate slides using ArrowRight
  4. Capture one PNG per slide
  5. Stop server process in `finally` cleanup block

## Command
- `node scripts/capture-slides.mjs`

## Output Files
- `screenshots/slide-00.png`
- `screenshots/slide-01.png`
- `screenshots/slide-02.png`
- `screenshots/slide-03.png`
- `screenshots/slide-04.png`
- `screenshots/slide-05.png`
- `screenshots/slide-06.png`
- `screenshots/slide-07.png`
- `screenshots/slide-08.png`
- `screenshots/slide-09.png`
- `screenshots/slide-10.png`
- `screenshots/slide-11.png`
- `screenshots/slide-12.png`
- `screenshots/slide-13.png`
- `screenshots/slide-14.png`
- `screenshots/slide-15.png`
- `screenshots/slide-16.png`
- `screenshots/slide-17.png`
- `screenshots/slide-18.png`
- `screenshots/slide-19.png`

## Coverage Check
- Registry count: **20 slides**
- Screenshot count: **20 images**
- Status: **match**

## Notes
- Base-mode capture should run with WOW flags off for stable baseline visual audit.
- Existing raw filenames `00.png`..`19.png` are preserved; `slide-XX.png` copies were added for report readability.
