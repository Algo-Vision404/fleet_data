import { NextResponse } from "next/server";
import { generateSyntheticMetrics } from "@/lib/synthetic-data";

export async function GET() {
  return NextResponse.json(generateSyntheticMetrics());
}
