"""FastAPI server for stop sign detection."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import aiohttp
from ultralytics import YOLO

from prisma import Prisma

app = FastAPI(title="Stop Sign Detector API")
prisma = Prisma()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await prisma.connect()

@app.on_event("shutdown")
async def shutdown():
    if prisma.is_connected():
        await prisma.disconnect()

# Load model once at startup
model = YOLO("model/vision-model-detect-001.pt")


class DetectionRequest(BaseModel):
    lat: float
    lon: float
    heading: float
    conf: float = 0.25


class DetectionResponse(BaseModel):
    lat: float
    lon: float
    heading: float
    stop_sign_detected: bool


@app.post("/detect", response_model=DetectionResponse)
async def detect_stop_sign(request: DetectionRequest):
    """Detect if there's a stop sign at the given location and heading."""
    
        
    # Rounding to 5 decimal places for cache key consistency
    lat_key = round(request.lat, 5)
    lon_key = round(request.lon, 5)

    cached = await prisma.detection.find_first(
        where={
            "lat": lat_key,
            "lon": lon_key,
            "heading": request.heading 
        }
    )

    if cached:
        return DetectionResponse(
            lat=request.lat,
            lon=request.lon,
            heading=request.heading,
            stop_sign_detected=cached.detected
        )
    
    # Cache Miss - Call Street View Service
    async with aiohttp.ClientSession() as session:
        payload = {
            "lat": request.lat,
            "lon": request.lon,
            "heading": request.heading,
            "zoom": 4,
            "coverage": 0.2
        }
        # Get service URL from environment variable
        service_url = os.getenv("STREETVIEW_SERVICE_URL")
        
        try:
            async with session.post(f"{service_url}/pano", json=payload) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=404, detail="No panorama found at this location")
                data = await resp.read()
        except aiohttp.ClientError:
             raise HTTPException(status_code=503, detail="Street View service unavailable")

    # Save temp image for model
    temp_path = "/tmp/pano.jpg"
    with open(temp_path, "wb") as f:
        f.write(data)
    
    # Run detection
    results = model.predict(temp_path, conf=request.conf, verbose=False)
    
    # Check for stop sign (class 0)
    has_stop_sign = False
    for result in results:
        for box in result.boxes:
            if int(box.cls) == 0:
                has_stop_sign = True
                break
    
    # Save to Cache (Database)
    await prisma.detection.create(
        data={
            "lat": lat_key,
            "lon": lon_key,
            "heading": request.heading,
            "detected": has_stop_sign
        }
    )
    
    return DetectionResponse(
        lat=request.lat,
        lon=request.lon,
        heading=request.heading,
        stop_sign_detected=has_stop_sign
    )


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
