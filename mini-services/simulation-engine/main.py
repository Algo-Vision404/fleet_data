from fastapi import FastAPI
import random
import asyncio
from typing import List, Dict

app = FastAPI(title="FleetMind AI - Simulation Engine")

# In-memory storage for vehicle states
vehicles: Dict[str, dict] = {}

def update_vehicle_state(vid: str):
    if vid not in vehicles:
        vehicles[vid] = {
            "vehicleId": vid,
            "speed": random.uniform(20, 60),
            "lat": 37.7749,
            "lng": -122.4194,
            "battery": 90.0,
            "status": "active"
        }
    
    v = vehicles[vid]
    v["speed"] = max(0, min(80, v["speed"] + random.uniform(-5, 5)))
    v["lat"] += random.uniform(-0.0005, 0.0005)
    v["lng"] += random.uniform(-0.0005, 0.0005)
    v["battery"] = max(0, v["battery"] - 0.01)
    return v

@app.on_event("startup")
async def startup_event():
    # Initialize some vehicles
    for i in range(1, 11):
        vid = f"AV-{i:03d}"
        update_vehicle_state(vid)

@app.get("/")
async def root():
    return {"status": "running", "service": "simulation-engine", "active_vehicles": len(vehicles)}

@app.get("/telemetry/{vehicle_id}")
async def get_telemetry(vehicle_id: str):
    return update_vehicle_state(vehicle_id)

@app.get("/fleet")
async def get_fleet():
    return [update_vehicle_state(vid) for vid in vehicles.keys()]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

