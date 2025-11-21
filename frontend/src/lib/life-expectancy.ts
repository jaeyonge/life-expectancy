import data from "@/data/life_expectancy_2023.json";

export type GenderInput = "m" | "f" | "all" | "male" | "female" | "total";
export type NormalizedGender = "male" | "female" | "total";

export type LifeExpectancyResponse = {
  gender: NormalizedGender;
  referenceYear: number;
  ageInReferenceYear: number;
  remainingYears: number;
  remainingYearsRounded: number;
};

type LifeExpectancyEntry = {
  age: number;
  total: number;
  male: number;
  female: number;
};

type BirthdateParts = {
  year: number;
  month: number;
  day: number;
};

const entriesByAge = new Map<number, LifeExpectancyEntry>(
  data.entries.map((entry) => [entry.age, entry]),
);

const ages = Array.from(entriesByAge.keys());
const MIN_AGE = Math.min(...ages);
const MAX_AGE = Math.max(...ages);

const GENDER_MAP: Record<GenderInput, NormalizedGender> = {
  m: "male",
  male: "male",
  f: "female",
  female: "female",
  all: "total",
  total: "total",
};

function normalizeGender(gender: string): NormalizedGender | null {
  const normalized = GENDER_MAP[gender.toLowerCase() as GenderInput];
  return normalized ?? null;
}

function makeUTCDate(parts: BirthdateParts | { year: number; month: number; day: number }): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function parseBirthdate(birthdate: string): BirthdateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate.trim());
  if (!match) return null;

  const [year, month, day] = match.slice(1).map(Number);
  const parsed = makeUTCDate({ year, month, day });
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function getExpectancy(age: number, gender: NormalizedGender): number {
  const targetAge = Math.min(Math.max(age, MIN_AGE), MAX_AGE);
  const entry = entriesByAge.get(targetAge);
  if (!entry) {
    throw new Error(`No life expectancy data available for age ${targetAge}.`);
  }

  if (gender === "male") return entry.male;
  if (gender === "female") return entry.female;
  return entry.total;
}

function ageAsOfReferenceYear(birthdate: BirthdateParts, referenceYear: number, today: Date): number {
  const refMonth = today.getUTCMonth() + 1;
  const refDay = today.getUTCDate();
  const years = referenceYear - birthdate.year - (birthdate.month > refMonth || (birthdate.month === refMonth && birthdate.day > refDay) ? 1 : 0);
  return Math.max(years, 0);
}

function ensureNotFutureDate(birthdate: BirthdateParts, today: Date): void {
  const todayParts = {
    year: today.getUTCFullYear(),
    month: today.getUTCMonth() + 1,
    day: today.getUTCDate(),
  };

  const birthDateObj = makeUTCDate(birthdate);
  const todayDateObj = makeUTCDate(todayParts);

  if (birthDateObj > todayDateObj) {
    throw new Error("Birthdate cannot be in the future.");
  }
}

export function computeLifeExpectancy(
  birthdate: string,
  genderInput: string,
  referenceDate: Date = new Date(),
): LifeExpectancyResponse {
  const parsedBirthdate = parseBirthdate(birthdate);
  if (!parsedBirthdate) {
    throw new Error("Birthdate must be in YYYY-MM-DD format.");
  }

  ensureNotFutureDate(parsedBirthdate, referenceDate);

  const gender = normalizeGender(genderInput);
  if (!gender) {
    throw new Error("Gender must be one of 'm', 'f', or 'all'.");
  }

  const ageInReferenceYear = ageAsOfReferenceYear(parsedBirthdate, data.referenceYear, referenceDate);
  const remainingYears = getExpectancy(ageInReferenceYear, gender);
  const remainingYearsRounded = Math.ceil(remainingYears);

  return {
    gender,
    referenceYear: data.referenceYear,
    ageInReferenceYear,
    remainingYears,
    remainingYearsRounded,
  };
}

export function getAgeBounds() {
  return { minAge: MIN_AGE, maxAge: MAX_AGE };
}
