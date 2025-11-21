from __future__ import annotations

import json
from pathlib import Path

from life_expectancy_loader import ExcelLifeExpectancyLoader


def export_json(workbook_path: Path, output_path: Path) -> None:
    loader = ExcelLifeExpectancyLoader(workbook_path)
    table = loader.load()

    data = {
        "referenceYear": table.reference_year,
        "entries": [
            {
                "age": age,
                "total": entry.total,
                "male": entry.male,
                "female": entry.female,
            }
            for age, entry in sorted(table._entries.items())
        ],
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(data, indent=2))


def main() -> None:
    repo_root = Path(__file__).parent
    workbook = repo_root / "life_expectancy.xlsx"
    output = repo_root / "frontend" / "src" / "data" / "life_expectancy_2023.json"
    export_json(workbook, output)
    print(f"Exported life expectancy data to {output}")


if __name__ == "__main__":
    main()
