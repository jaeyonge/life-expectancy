import { NextResponse } from "next/server";

import { computeLifeExpectancy, type LifeExpectancyResponse } from "@/lib/life-expectancy";

export async function POST(request: Request) {
  try {
    const { birthdate, gender } = (await request.json()) as {
      birthdate?: unknown;
      gender?: unknown;
    };

    if (typeof birthdate !== "string" || typeof gender !== "string") {
      return NextResponse.json({ error: "Birthdate and gender are required." }, { status: 400 });
    }

    const result: LifeExpectancyResponse = computeLifeExpectancy(birthdate, gender);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error computing life expectancy.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
