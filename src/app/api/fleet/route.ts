import { NextResponse } from "next/server";
import { generateSyntheticVehicles } from "@/lib/synthetic-data";

export async function GET() {
  const vehicles = generateSyntheticVehicles(50);
  return NextResponse.json({
    vehicles,
    total: vehicles.length,
    activeCount: vehicles.filter((v) => v.status === "active").length,
  });
}
