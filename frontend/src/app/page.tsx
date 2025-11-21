"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Gender = "m" | "f" | "all";

const LIFE_EXPECTANCY: Record<Gender, number> = {
  m: 76,
  f: 81,
  all: 79,
};

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

function calculateAgeYears(birthdate: string): number {
  const parsed = new Date(birthdate);
  if (Number.isNaN(parsed.getTime())) return 0;
  const diff = Date.now() - parsed.getTime();
  return diff > 0 ? diff / MS_PER_YEAR : 0;
}

export default function Home() {
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender>("all");

  const { ageYears, remainingSquares, elapsedSquares, totalYears } = useMemo(() => {
    const age = calculateAgeYears(birthdate);
    const total = LIFE_EXPECTANCY[gender];
    const remainingYears = Math.max(total - age, 0);
    const remaining = Math.ceil(remainingYears);
    const elapsed = Math.min(total, Math.max(total - remaining, 0));

    return {
      ageYears: age,
      remainingSquares: remaining,
      elapsedSquares: elapsed,
      totalYears: total,
    };
  }, [birthdate, gender]);

  const years = useMemo(
    () =>
      Array.from({ length: totalYears }, (_, index) => {
        const yearNumber = index + 1;
        const elapsed = index < elapsedSquares;
        return { yearNumber, elapsed };
      }),
    [elapsedSquares, totalYears],
  );

  const formattedAge = ageYears ? ageYears.toFixed(1) : "0.0";
  const remainingYears = Math.max(totalYears - ageYears, 0).toFixed(1);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Life Calendar</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">See every year of your life</h1>
        <p className="text-base text-muted-foreground">
          Enter your birthdate and gender to estimate elapsed and remaining years, visualized square by square.
        </p>
      </header>

      <section className="mb-8 rounded-xl border bg-card p-6 shadow-sm">
        <form className="grid gap-4 sm:grid-cols-3 sm:items-end">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="birthdate">Birthdate (yyyy-mm-dd)</Label>
            <Input
              id="birthdate"
              type="date"
              value={birthdate}
              onChange={(event) => setBirthdate(event.target.value)}
              placeholder="yyyy-mm-dd"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              id="gender"
              value={gender}
              onChange={(event) => setGender(event.target.value as Gender)}
            >
              <option value="all">All</option>
              <option value="m">Male</option>
              <option value="f">Female</option>
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Button type="button" className="w-full sm:w-auto" onClick={() => setBirthdate(birthdate)}>
              Update Life Grid
            </Button>
          </div>
        </form>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Age" value={`${formattedAge} years`} />
          <SummaryCard label="Remaining (ceiling)" value={`${remainingSquares} years`} />
          <SummaryCard label="Total lifespan" value={`${totalYears} years`} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <LegendSwatch color="bg-emerald-500/90" label="Elapsed years" />
          <LegendSwatch color="bg-slate-200" label="Remaining years (ceiling-rounded)" />
          <span className="ml-auto text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Hover a square to see the year number
          </span>
        </div>

        <div className="year-grid grid gap-2">
          {years.map(({ yearNumber, elapsed }) => (
            <div
              key={yearNumber}
              className={cn(
                "year-square group relative aspect-square rounded-lg border",
                elapsed ? "bg-emerald-500/90 border-emerald-600" : "bg-slate-100 border-slate-200",
              )}
              title={`Year ${yearNumber}`}
            >
              <div className="absolute inset-0 rounded-lg group-hover:ring-2 group-hover:ring-ring group-hover:ring-offset-2" />
              <span className="absolute inset-0 grid place-items-center text-xs font-semibold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {yearNumber}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-4 w-4 rounded-sm border", color)} />
      <span>{label}</span>
    </div>
  );
}
