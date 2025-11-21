from __future__ import annotations

from typing import Dict, List

from life_expectancy import LifeExpectancyResult


class GridRenderer:
    def build_payload(self, result: LifeExpectancyResult) -> Dict[str, int | float | str]:
        return {
            "gender": result.gender,
            "referenceYear": result.reference_year,
            "ageInReferenceYear": result.age_in_reference_year,
            "remainingYears": result.remaining_years,
            "remainingYearsRounded": result.remaining_years_ceiling,
        }

    def render(self, result: LifeExpectancyResult) -> str:
        payload = self.build_payload(result)
        rows: List[tuple[str, str]] = [
            ("Gender", str(payload["gender"])),
            ("Reference year", str(payload["referenceYear"])),
            ("Age in reference year", str(payload["ageInReferenceYear"])),
            (
                "Residual life expectancy (years)",
                f"{payload['remainingYears']:.1f}",
            ),
            (
                "Residual life expectancy (rounded)",
                str(payload["remainingYearsRounded"]),
            ),
        ]

        label_width = max(len(label) for label, _ in rows)
        value_width = max(len(value) for _, value in rows)
        border = "+" + "-" * (label_width + 2) + "+" + "-" * (value_width + 2) + "+"

        lines = [border]
        for label, value in rows:
            lines.append(f"| {label.ljust(label_width)} | {value.rjust(value_width)} |")
            lines.append(border)
        return "\n".join(lines)
