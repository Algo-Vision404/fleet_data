import { NextResponse } from "next/server";
import { generateSyntheticEvents } from "@/lib/synthetic-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity");
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  let events = generateSyntheticEvents();

  if (severity && severity !== "all") {
    events = events.filter((e) => e.severity === severity);
  }
  if (type && type !== "all") {
    events = events.filter((e) => e.type === type);
  }

  return NextResponse.json({
    events: events.slice(0, limit),
    total: events.length,
    criticalUnacknowledged: events.filter(
      (e) => e.severity === "critical" && !e.acknowledged
    ).length,
  });
}
