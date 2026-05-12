from fastapi import FastAPI
import random

app = FastAPI(title="FleetMind AI - Analytics Engine")

@app.get("/")
async def root():
    return {"status": "running", "service": "analytics-engine"}

@app.get("/stats")
async def get_stats():
    return {
        "total_miles": random.randint(100000, 500000),
        "avg_disengagement_rate": random.uniform(0.1, 2.5),
        "active_vehicles": random.randint(30, 50)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
