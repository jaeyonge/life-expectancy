from __future__ import annotations

import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from typing import Dict, List

from life_expectancy import LifeExpectancyEntry, LifeExpectancyTable


NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


class ExcelLifeExpectancyLoader:
    def __init__(self, workbook_path: Path, reference_year: int = 2023):
        self.workbook_path = Path(workbook_path)
        self.reference_year = reference_year

    def load(self) -> LifeExpectancyTable:
        if not self.workbook_path.exists():
            raise FileNotFoundError(f"Workbook not found: {self.workbook_path}")

        with zipfile.ZipFile(self.workbook_path) as zf:
            shared_strings = self._read_shared_strings(zf)
            entries = self._read_sheet_rows(zf, shared_strings)

        return LifeExpectancyTable(entries, reference_year=self.reference_year)

    def _read_shared_strings(self, zf: zipfile.ZipFile) -> List[str]:
        try:
            xml_bytes = zf.read("xl/sharedStrings.xml")
        except KeyError:
            return []

        root = ET.fromstring(xml_bytes)
        strings: List[str] = []
        for si in root.findall("main:si", NS):
            texts = [t.text or "" for t in si.findall(".//main:t", NS)]
            strings.append("".join(texts))
        return strings

    def _read_sheet_rows(self, zf: zipfile.ZipFile, shared_strings: List[str]) -> Dict[int, LifeExpectancyEntry]:
        sheet_xml = zf.read("xl/worksheets/sheet1.xml")
        root = ET.fromstring(sheet_xml)
        rows = root.findall(".//main:sheetData/main:row", NS)
        entries: Dict[int, LifeExpectancyEntry] = {}

        for row in rows[1:]:  # skip header
            values: Dict[str, str | float] = {}
            for cell in row.findall("main:c", NS):
                column = self._extract_column(cell.get("r", ""))
                value = self._parse_cell_value(cell, shared_strings)
                if value is not None:
                    values[column] = value

            age_label = values.get("A")
            if not isinstance(age_label, str):
                continue
            age = self._parse_age_label(age_label)
            try:
                total = float(values.get("B", 0.0))
                male = float(values.get("C", 0.0))
                female = float(values.get("D", 0.0))
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Unexpected numeric value in row {row.get('r')}") from exc

            entries[age] = LifeExpectancyEntry(age=age, total=total, male=male, female=female)

        return entries

    def _parse_cell_value(self, cell: ET.Element, shared_strings: List[str]) -> str | float | None:
        value_element = cell.find("main:v", NS)
        if value_element is None:
            return None

        raw_value = value_element.text or ""
        if cell.get("t") == "s":
            index = int(raw_value)
            try:
                return shared_strings[index]
            except IndexError as exc:
                raise ValueError(f"Shared string index {index} is out of bounds") from exc
        try:
            return float(raw_value)
        except ValueError as exc:
            raise ValueError(f"Cell {cell.get('r')} contains a non-numeric value: {raw_value}") from exc

    def _parse_age_label(self, label: str) -> int:
        match = re.search(r"(\d+)", label)
        if not match:
            raise ValueError(f"Unable to parse age label: {label}")
        return int(match.group(1))

    def _extract_column(self, cell_reference: str) -> str:
        return re.match(r"([A-Z]+)", cell_reference).group(1) if cell_reference else ""
