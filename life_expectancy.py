from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date
from typing import Dict


@dataclass(frozen=True)
class LifeExpectancyEntry:
    age: int
    total: float
    male: float
    female: float


@dataclass(frozen=True)
class LifeExpectancyResult:
    gender: str
    reference_year: int
    age_in_reference_year: int
    remaining_years: float
    remaining_years_ceiling: int


class LifeExpectancyTable:
    def __init__(self, entries: Dict[int, LifeExpectancyEntry], reference_year: int = 2023):
        if not entries:
            raise ValueError("At least one entry is required to build the life expectancy table.")
        self._entries = dict(entries)
        self.reference_year = reference_year
        self._min_age = min(self._entries)
        self._max_age = max(self._entries)

    def age_as_of(self, birthdate: date, reference_date: date | None = None) -> int:
        reference_date = reference_date or date.today()
        ref_date = date(self.reference_year, reference_date.month, reference_date.day)
        years = ref_date.year - birthdate.year
        if (birthdate.month, birthdate.day) > (ref_date.month, ref_date.day):
            years -= 1
        return max(years, 0)

    def get_expectancy(self, age: int, gender: str) -> float:
        normalized_gender = gender.lower()
        if normalized_gender not in {"male", "female", "total"}:
            raise ValueError("Gender must be one of 'male', 'female', or 'total'.")

        target_age = min(max(age, self._min_age), self._max_age)
        entry = self._entries.get(target_age)
        if entry is None:
            raise KeyError(f"No life expectancy data available for age {target_age}.")

        if normalized_gender == "male":
            return entry.male
        if normalized_gender == "female":
            return entry.female
        return entry.total


def compute_residual_life_expectancy(
    table: LifeExpectancyTable,
    birthdate: date,
    gender: str,
    reference_date: date | None = None,
) -> LifeExpectancyResult:
    age_in_reference_year = table.age_as_of(birthdate, reference_date)
    remaining_years = table.get_expectancy(age_in_reference_year, gender)
    rounded_remaining = math.ceil(remaining_years)

    return LifeExpectancyResult(
        gender=gender.lower(),
        reference_year=table.reference_year,
        age_in_reference_year=age_in_reference_year,
        remaining_years=remaining_years,
        remaining_years_ceiling=rounded_remaining,
    )
