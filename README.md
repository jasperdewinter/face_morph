# Face Morphing Playground

A simple static webpage that lets you morph between faces in sequence (1→2, 2→3, etc.) with Kiespijn-style crossfades. Add your own photos or use the bundled samples.

## Running locally

```bash
python -m http.server 8000
# then open http://localhost:8000
```

Any static server works—no build step required.

## Adding faces

1. Drop your images (png, jpg, svg, etc.) into the `faces/` directory.
2. Append the filename and label to `faces/manifest.json` to make them available as reusable samples.
3. You can also click **Add faces** in the UI to load images directly from your computer for a one-off morph.

## Using the app

- Load at least two faces (three or more recommended to watch the chain).
- Adjust the morph duration and pause between pairs.
- Click **Start morph** to crossfade each pair in order: 1→2, 2→3, and so on.
- Use **Stop** at any time to reset.

The preview uses a canvas-based crossfade so everything runs entirely in the browser—no backend required.
