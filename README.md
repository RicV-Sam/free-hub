# free-hub

free-hub is a static Proof of Concept for a content-driven competitions and offers site. It runs with plain HTML, CSS, and JavaScript, loads all content from JSON, and can be deployed for free with GitHub Pages.

## Structure

```text
free-hub/
|-- index.html
|-- styles.css
|-- app.js
|-- README.md
|-- data/
|   `-- competitions.json
`-- .github/
    `-- workflows/
        `-- deploy.yml
```

## Local preview

Because the app fetches JSON, preview it through a simple static server instead of opening `index.html` directly from the filesystem.

### Python

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Data source

All competition content comes from `data/competitions.json`.

Each competition item uses this shape:

```json
{
  "id": "cash-drop-april",
  "title": "Cash Drop Weekend Giveaway",
  "image": "https://images.unsplash.com/...",
  "closingDate": "2026-04-12",
  "category": "Cash",
  "entryType": "Free Entry",
  "url": "https://example.com/cash-drop-weekend"
}
```

## GitHub Pages deployment

### Option 1: GitHub Actions

1. Push the repository to GitHub.
2. In GitHub, open `Settings > Pages`.
3. Set `Source` to `GitHub Actions`.
4. The workflow in `.github/workflows/deploy.yml` will publish the static site on push to `main`.

### Option 2: No Actions

1. Push the repository to GitHub.
2. In GitHub, open `Settings > Pages`.
3. Set `Source` to `Deploy from a branch`.
4. Select the `main` branch and `/ (root)` folder.
5. Save the settings and GitHub Pages will serve the static files directly.

## Notes

- No backend is required.
- No framework or build step is required.
- Click tracking is currently console-based only.
- The layout includes placeholder ad slots for future monetisation work.
