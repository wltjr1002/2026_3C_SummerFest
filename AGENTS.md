# Agent Instructions

## Project Purpose

This project prepares recreation games for a summer festival. It contains a GitHub Pages-ready single-player web game page, a placeholder outline for a future PPTX game deck, and tools/resources for producing game materials.

## Current Structure

- `index.html`: GitHub Pages entry page. Keep the body empty until game UI work starts.
- `styles.css`: Shared page styles.
- `main.js`: Shared page script.
- `pptx-outline.md`: Placeholder for the future PPTX production outline. Keep it empty until the outline is requested.
- `tools/file_processor.py`: Small file handling helper for game resources.
- `resources/`: Root folder for game-specific resource folders.

## Resource Rules

Create one folder per game under `resources/`.

Use this layout for each game:

```text
resources/<game-name>/input/
resources/<game-name>/output/
```

Put raw/source material in `input/`. Put generated or processed material in `output/`. Do not mix resources for different games in the same folder.

To initialize a game resource folder:

```powershell
python tools/file_processor.py <game-name> --init
```

To run the current placeholder processing step:

```powershell
python tools/file_processor.py <game-name> --copy
```

## Work Continuity

When continuing project work:

1. Inspect the existing files before editing.
2. Keep GitHub Pages files static unless a build system is explicitly added.
3. Add game-specific files in clearly named folders.
4. Keep generated output separate from source input.
5. Update this instruction file when the workflow changes.
