# ASSET_PIPELINE_DESIGN

## Current state snapshot
- Local media assets (images/video/audio/fonts): none detected.
- Local asset-like files are JSON/config only.
- `components/Modal.tsx` expects `assets/<name>` and falls back to remote placeholder URLs when not found.
- No dedicated `assets/` or `public/` directory conventions exist yet.
- No manifest, no content hash inventory, no dedupe pipeline.

## Target asset pipeline goals
1. Deterministic and reproducible across Windows workstations.
2. Manifest-first loading (`assets.json`) with stable IDs.
3. Build-time validation for missing references and duplicate content.
4. Runtime asset loading fully local for demo-critical paths.
5. Expandable to per-slide preload bundles.

## Folder conventions (proposed)

```text
assets/
  images/
    slides/
      00/
      01/
      ...
    shared/
  video/
    slides/
  audio/
    slides/
    shared/
  fonts/
    primary/
    mono/
  data/
    manifests/
      assets.json
      assets.by-slide.json
```

### Naming convention
- Use lowercase kebab-case only.
- Pattern:
  - `sXX-<domain>-<intent>-vNN.<ext>` for slide-specific assets
  - `shared-<domain>-<intent>-vNN.<ext>` for reusable assets
- Examples:
  - `s04-evidence-seal-v01.webp`
  - `shared-ui-noise-grid-v02.svg`

## Image optimization strategy

### Build-time (Python-preferred)
- Recommended toolchain:
  - `Pillow` for raster compression/resizing.
  - optional `cairosvg` for SVG to PNG renditions when needed.
- Rules:
  - source originals in `assets_src/` (optional staging area)
  - output optimized files to `assets/images/...`
  - deterministic encoding settings (fixed quality and metadata stripping)

### Suggested defaults
- PNG: optimize + metadata stripped.
- JPEG/WebP: fixed quality presets by usage class:
  - hero: 82
  - standard: 76
  - thumbnail: 64
- Max dimensions by context:
  - fullscreen hero: 1920x1080
  - panel image: 1280x720
  - thumbnail: 480x270

## SVG handling strategy
- Keep source SVGs versioned under `assets/images/shared` or `assets/images/slides/XX`.
- Validate SVG safety:
  - reject embedded scripts and external hrefs.
- For runtime:
  - inline only small icon SVGs via components.
  - file-backed SVG for larger decorative/diagram assets.
- Optional preflight: normalize formatting and attribute order to reduce diffs.

## Font management
- Store local font files under `assets/fonts/*`.
- Prefer `woff2` primary, `woff` fallback if required.
- Register in one CSS entry (`index.css` or dedicated `assets/fonts/fonts.css`).
- Manifest must include:
  - family name
  - weight/style
  - path
  - hash

## Hashing and dedupe strategy

### Hashing
- Compute SHA-256 for every asset at build-scan time.
- Manifest stores hash and byte size.
- Duplicate-by-content is detected by identical hash.

### Dedupe policy
- Duplicate filenames in different directories are allowed only with different hashes and explicit reason.
- Duplicate content with different names should be flagged and consolidated by tooling task.

## Deterministic manifest proposal (`assets.json`)

### File location
- `assets/data/manifests/assets.json`

### JSON schema (proposed)

```json
{
  "schema_version": "assets-manifest.v1",
  "generated_by": "tools/assets/generate_manifest.py",
  "assets": [
    {
      "id": "s04-evidence-seal-v01",
      "type": "image",
      "format": "webp",
      "path": "assets/images/slides/04/s04-evidence-seal-v01.webp",
      "bytes": 123456,
      "sha256": "...",
      "width": 1280,
      "height": 720,
      "slide_ids": [4],
      "tags": ["evidence", "seal"]
    }
  ]
}
```

### Determinism requirements
- No wall-clock timestamp in canonical manifest output.
- Stable key ordering and stable list sorting by `id`.
- Stable line endings and UTF-8 encoding.

## Runtime vs build-time loading

### Build-time responsibilities
- Validate references and file existence.
- Optimize assets and generate deterministic manifest.
- Fail build on missing critical assets.

### Runtime responsibilities
- Resolve by `asset id` or validated path from manifest.
- Optional preloading by slide group.
- Never silently fallback to external URLs for required demo assets.

## Integration plan with existing repo
1. Create `assets/` structure and move any future media there.
2. Add Python manifest generator and validator under `tools/assets/`.
3. Replace ad-hoc modal path assumptions with manifest-backed resolver.
4. Add CI/build check to block missing asset refs.
5. Add `assets.by-slide.json` for preload groups by slide slot.

## Risks if unchanged
- Hidden missing media until runtime interactions occur.
- Non-deterministic demo behavior from remote fallback placeholders.
- No scalable way to preload and budget slide media.
- No dedupe control as asset count grows.
