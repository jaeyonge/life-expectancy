"use client";

import { type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { type LifeExpectancyResponse } from "@/lib/life-expectancy";
import { cn } from "@/lib/utils";

type Gender = "m" | "f" | "all";

export default function Home() {
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender>("all");
  const [result, setResult] = useState<LifeExpectancyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { years, elapsedSquares, totalYears } = useMemo(() => {
    if (!result) return { years: [], elapsedSquares: 0, totalYears: 0 };

    const lifespanYears = result.ageInReferenceYear + result.remainingYearsRounded;
    const yearSquares = Array.from({ length: lifespanYears }, (_, index) => {
      const yearNumber = index + 1;
      const elapsed = index < result.ageInReferenceYear;
      return { yearNumber, elapsed };
    });

    return { years: yearSquares, elapsedSquares: result.ageInReferenceYear, totalYears: lifespanYears };
  }, [result]);

  const formattedAge = result ? result.ageInReferenceYear.toFixed(0) : "0";
  const remainingYears = result ? result.remainingYears.toFixed(1) : "0.0";
  const roundedRemaining = result ? result.remainingYearsRounded : 0;
  const referenceYear = result?.referenceYear;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/life-expectancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthdate, gender }),
      });

      const payload = (await response.json()) as LifeExpectancyResponse | { error?: string };
      if (!response.ok || "error" in payload) {
        const message = "error" in payload && payload.error ? payload.error : "Unable to compute life expectancy.";
        throw new Error(message);
      }

      setResult(payload as LifeExpectancyResponse);
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Unable to compute life expectancy.";
      setError(message);
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <form className="grid gap-4 sm:grid-cols-3 sm:items-end" onSubmit={handleSubmit}>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="birthdate">Birthdate (yyyy-mm-dd)</Label>
            <Input
              id="birthdate"
              type="date"
              value={birthdate}
              onChange={(event) => setBirthdate(event.target.value)}
              placeholder="yyyy-mm-dd"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select id="gender" value={gender} onChange={(event) => setGender(event.target.value as Gender)} required>
              <option value="all">All</option>
              <option value="m">Male</option>
              <option value="f">Female</option>
            </Select>
          </div>

          <div className="sm:col-span-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Calculations use the 2023 life expectancy table (ceiling-rounded).
              {referenceYear ? ` Reference year: ${referenceYear}.` : ""}
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Life Grid"}
            </Button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Age in 2023" value={`${formattedAge} years`} />
          <SummaryCard label="Remaining (ceiling)" value={`${roundedRemaining} years`} />
          <SummaryCard label="Residual life expectancy" value={`${remainingYears} years`} />
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

          {!years.length ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Enter your birthdate and gender to see your life grid.
            </div>
          ) : null}
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
