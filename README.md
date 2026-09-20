# PolyNews

Feed the news, backed by relevant information, into dashboard(s), and pull the signals out of the noise.

## Initial interactive website

This repository now includes a minimal live dashboard prototype:

- Pulls live stories from the Hacker News API
- Calculates a lightweight "signal" score from points + comments
- Supports interactive filtering by search text and minimum signal
- Auto-refreshes every minute so the dashboard stays live

## Run locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open: <http://localhost:8000>

## Next iterations

- Add source diversity (multiple feeds/APIs)
- Add richer relevance signals and topic clustering
- Add persistence and user-tunable dashboard presets
