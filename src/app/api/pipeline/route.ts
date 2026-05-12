import { NextResponse } from "next/server";
import { generateSyntheticPipeline } from "@/lib/synthetic-data";

export async function GET() {
  const stages = generateSyntheticPipeline();
  const overallHealth = Math.round(
    stages.reduce((sum, s) => sum + (100 - s.errorCount * 2 - s.backpressure), 0) / stages.length
  );

  return NextResponse.json({ stages, overallHealth });
}
