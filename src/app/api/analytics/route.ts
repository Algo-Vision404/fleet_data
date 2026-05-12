import { NextResponse } from "next/server";
import {
  generateSyntheticThroughput,
  generateSyntheticLatency,
  generateSyntheticDisengagement,
  generateSyntheticDrift,
  generateSyntheticRegionAnomalies,
} from "@/lib/synthetic-data";

export async function GET() {
  return NextResponse.json({
    throughput: generateSyntheticThroughput(30),
    latency: generateSyntheticLatency(30),
    disengagement: generateSyntheticDisengagement(30),
    drift: generateSyntheticDrift(30),
    regionAnomalies: generateSyntheticRegionAnomalies(),
  });
}
