# Life expectancy tools and demo

This repository contains two small applications that use the 2023 life expectancy table (`life_expectancy.xlsx`):

- **Python utilities** that load the workbook, compute residual life expectancy for a given birthdate and gender, and render the result as an ASCII grid.
- **A Next.js frontend** that exposes a `/api/life-expectancy` route and a "life calendar" UI that visualizes elapsed and remaining years square-by-square.

## How the calculation works

1. `life_expectancy_loader.ExcelLifeExpectancyLoader` opens the workbook as a zip archive and parses `sheet1.xml` to produce a `LifeExpectancyTable` keyed by age.
2. `life_expectancy.compute_residual_life_expectancy` calculates age as of the reference year (2023 by default) and looks up the gender-specific residual life expectancy, returning both the raw value and a ceiling-rounded integer.
3. `grid_renderer.GridRenderer` can format the result as either a JSON-ready payload or a human-readable table for the console example.
4. `export_life_expectancy_json.py` regenerates `frontend/src/data/life_expectancy_2023.json` so the frontend uses the same source data as the Python utilities.
5. The Next.js API route (`frontend/src/app/api/life-expectancy/route.ts`) reuses the JSON data to validate input, compute ages, and return a structured response that the React UI renders as a grid.

## Repository layout

- `life_expectancy.xlsx`: Source workbook containing the 2023 table.
- `life_expectancy_loader.py`: Minimal XLSX reader that extracts shared strings and numeric cells for the table.
- `life_expectancy.py`: Data structures plus the residual life expectancy calculation.
- `grid_renderer.py`: Formats `LifeExpectancyResult` instances for display.
- `main.py`: Console example wired to the modules above.
- `export_life_expectancy_json.py`: Helper to export the workbook data for the frontend.
- `frontend/`: Next.js 14 + Tailwind app with an API route and interactive life-calendar page.

## Prerequisites

- Python **3.11+** (no third-party packages required).
- Node.js **18+** and **npm** for the frontend.

## Run the console example (Python)

From the repository root:

```bash
python main.py
```

The script loads the workbook, computes the residual life expectancy for a sample birthdate (`1990-05-15`, female), and prints an ASCII table similar to:

```
+------------------------------------+--------+
| Gender                             | female |
+------------------------------------+--------+
| Reference year                     |   2023 |
+------------------------------------+--------+
| Age in reference year              |     33 |
+------------------------------------+--------+
| Residual life expectancy (years)   |   54.0 |
+------------------------------------+--------+
| Residual life expectancy (rounded) |     54 |
+------------------------------------+--------+
```

## Export the workbook data to JSON

If you update `life_expectancy.xlsx`, regenerate the JSON consumed by the frontend:

```bash
python export_life_expectancy_json.py
```

This writes `frontend/src/data/life_expectancy_2023.json` using the workbook values.

## Run the Next.js frontend

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   The app serves the API route and UI on `http://localhost:3000`. Enter a birthdate (`YYYY-MM-DD`) and gender (all/male/female) to fetch the life expectancy result and render the life calendar.

3. Build for production (optional):

   ```bash
   npm run build
   npm start
   ```

## Reusing the calculation logic

- Backend scripts can import `LifeExpectancyTable` and `compute_residual_life_expectancy` directly for programmatic use.
- Frontend utilities are in `frontend/src/lib/life-expectancy.ts`, which validates input, normalizes genders (`all`, `m`, `f` → `total`, `male`, `female`), clamps ages to the available table, and returns both precise and ceiling-rounded values.

## Troubleshooting

- **Workbook missing?** Ensure `life_expectancy.xlsx` is present in the repository root before running the Python scripts.
- **Future birthdate errors (frontend API):** The API rejects birthdates later than the current date. Use a past date in `YYYY-MM-DD` format.
- **JSON out of sync?** Re-run `python export_life_expectancy_json.py` after changing the workbook so the frontend and backend stay aligned.
