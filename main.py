from __future__ import annotations

from datetime import date
from pathlib import Path

from grid_renderer import GridRenderer
from life_expectancy import compute_residual_life_expectancy
from life_expectancy_loader import ExcelLifeExpectancyLoader


def run_example() -> None:
    loader = ExcelLifeExpectancyLoader(Path(__file__).with_name("life_expectancy.xlsx"))
    table = loader.load()

    example_birthdate = date(1990, 5, 15)
    result = compute_residual_life_expectancy(table, example_birthdate, gender="female")

    renderer = GridRenderer()
    print(renderer.render(result))


if __name__ == "__main__":
    run_example()
