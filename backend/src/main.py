import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
from pydantic import BaseModel
from fastapi.responses import FileResponse
from utils.pdf_generator import generate_echallan_pdf

from src.core.omni_gaze import OmniGazePipeline

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("traffic_violations_backend")

# Initialize FastAPI app
app = FastAPI(
    title="Automated Traffic Violations API",
    description="Backend service for automated traffic violation detection and classification (Route 1 / Real-time Frame Analysis).",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the computer vision pipeline
weights_path = os.getenv("WEIGHTS_PATH", "weights/indian_traffic.pt")
default_model = os.getenv("DEFAULT_MODEL", "weights/yolo12s.pt")
fallback_model = os.getenv("FALLBACK_MODEL", "weights/yolov8n.pt")

try:
    pipeline = OmniGazePipeline(
        weights_path=weights_path,
        default_model=default_model,
        fallback_model=fallback_model
    )
    logger.info("OmniGaze computer vision pipeline initialized successfully.")
except Exception as e:
    logger.critical(f"Failed to initialize OmniGaze computer vision pipeline: {e}")
    try:
        pipeline = OmniGazePipeline(weights_path="yolov8n.pt", default_model="yolov8n.pt", fallback_model="yolov8n.pt")
    except Exception as fallback_err:
        logger.critical(f"Failed to load fallback pipeline: {fallback_err}")
        pipeline = None

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "pipeline_loaded": pipeline is not None,
        "weights_path": weights_path,
        "default_model": default_model,
        "fallback_model": fallback_model,
        "classes": pipeline.model.names if pipeline and hasattr(pipeline.model, "names") else "None"
    }

@app.post("/api/v1/analyze-frame")
async def analyze_frame(file: UploadFile = File(...)):
    """
    Endpoint to process a single video frame asynchronously.
    
    Accepts:
        - Image frame upload (multipart/form-data)
        
    Returns:
        - JSON payload containing annotated image (base64 URI) and violations metadata.
    """
    if pipeline is None:
        raise HTTPException(
            status_code=500,
            detail="Computer vision pipeline is not loaded. Check server logs."
        )

    # Validate file type if content-type is provided
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file must be an image, received '{file.content_type}'."
        )

    try:
        # Read file contents
        content = await file.read()
        
        # Process the frame using the OmniGaze pipeline
        result = pipeline.process_frame(content)
        
        return result
        
    except ValueError as val_err:
        logger.error(f"Image decoding error: {val_err}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.error(f"Error during image analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Inference pipeline failed: {str(e)}")
    finally:
        await file.close()

class ChallanRequest(BaseModel):
    license_plate: str
    violation_type: str
    camera_node: str
    timestamp: str
    fine_amount: int
    evidence_image_path: str = None

@app.post("/api/generate-challan")
async def generate_challan(request: ChallanRequest):
    """
    Endpoint to generate and download a Bangalore Traffic Police (BTP) E-Challan PDF document.
    """
    try:
        # Create a temp directory
        temp_dir = "/tmp/btp_challans"
        os.makedirs(temp_dir, exist_ok=True)
        pdf_path = os.path.join(temp_dir, f"btp_challan_{request.license_plate}.pdf")
        
        # Generate PDF
        generate_echallan_pdf(
            license_plate=request.license_plate,
            violation_type=request.violation_type,
            camera_node=request.camera_node,
            timestamp=request.timestamp,
            fine_amount=request.fine_amount,
            evidence_image_path=request.evidence_image_path,
            output_path=pdf_path
        )
        
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=f"BTP_Challan_{request.license_plate}.pdf"
        )
    except Exception as e:
        logger.error(f"Error generating e-challan PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Challan generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Allow running main.py directly for development testing
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
