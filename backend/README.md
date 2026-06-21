# Omni-Gaze Backend: Edge Analytics Traffic Enforcement Engine

Omni-Gaze is an edge-optimized analytics platform designed for automated photo identification and traffic violation classification. Built for the Bengaluru Traffic Police (BTP) as part of the Flipkart Gridlock Hackathon 2.0, the backend processes video frames and telemetry logs to achieve straight-through processing (STP) of violations.

---

## 🏛️ The Three-Tier Architecture

To prevent memory crashes from running multiple models in parallel, the Omni-Gaze pipeline routes detections through a three-tier design:

```
                  [ Raw Camera Stream Ingestion ]
                                │
                                ▼
         ┌─────────────────────────────────────────────┐
         │  Tier 1: Foundation (Single YOLO Detector)  │  ◄── Extracts bounding boxes for base classes
         └──────────────────────┬──────────────────────┘
                                │
                                ▼
         ┌─────────────────────────────────────────────┐
         │  Tier 2: Routing Logic (Python heuristics)  │  ──► Crops & routes boxes to compartments
         └──────────────────────┬──────────────────────┘
                                │
                                ▼
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────┐                               ┌───────────────┐
│ Two-Wheeler   │                               │ Four-Wheeler  │
└───────┬───────┘                               └───────┬───────┘
        │                                               │
        ├─► Triple Riding (Heuristic)                   ├─► Cabin Analysis (Windshield Crop)
        ├─► Helmet compliance (Mini-Classifier)         │    └─► Seatbelt (Mini-Classifier)
        └─► License Plate Crop ──► TrOCR/EasyOCR        └─► License Plate Crop ──► TrOCR/EasyOCR
```

| Tier | Component Type | Responsibility | Performance Profile |
| :--- | :--- | :--- | :--- |
| **Tier 1: Foundation** | Unified Deep Learning Model | Runs a single, high-performance YOLOv12s detector to isolate base objects (`vehicle`, `person`, `license_plate`, `traffic_light`). | GPU-bound, batch-optimized inference. |
| **Tier 2: Router** | Pure Code Logic | Standard zero-compute Python `if/else` statements that compartmentalize detected objects based on class name. | Near-zero compute overhead. |
| **Tier 3: Specialized Heads** | Hybrid Heuristics & Micro-Classifiers | Combines geometric code for spatial/temporal violations with targeted mini-classifiers running on crops. | Mixed (mostly CPU-bound math, ultra-lightweight GPU heads). |

### Specialized Processing Heads:
1. **Triple Riding (Heuristic):** Zero deep learning overhead. Programmatic check counting if 3 or more `person` centroids overlap a single `motorcycle` bounding box.
2. **Wrong-Side Driving (Heuristic):** Trajectory vector tracking. Evaluates movement direction of object IDs across successive frames against lane direction coordinates.
3. **Red-Light Violation (Heuristic):** Digital tripwire check. Flags vehicles crossing the intersection coordinates boundary polygon while traffic light state is `red`.
4. **Helmet Non-Compliance (Micro-Classifier):** Runs a local binary classifier on the cropped head region of interest (top 20% of rider bounding box).
5. **Seatbelt Non-Compliance (Micro-Classifier):** Crop cabin windshield region and run a localized model to check for diagonal strap line.
6. **License Plate OCR (Shared Model):** Crops license plates, applies an OpenCV perspective warp to flatten skew, and passes to a single shared OCR instance (TrOCR or EasyOCR) for text extraction.

---

## 📁 Directory Structure

```
backend/
├── config/             # System thresholds and geofencing parameters
│   └── .gitkeep
├── src/                # Core processing and API modules
│   ├── __init__.py
│   ├── main.py         # FastAPI routes and server initialization
│   └── core/
│       ├── __init__.py
│       └── omni_gaze.py# Relational CV heuristic engine
├── utils/              # Helper utilities and geofencing math
│   └── .gitkeep
├── weights/            # Local model weights directory (ignored from Git)
│   ├── yolo12s.pt      # Pre-trained base weights
│   └── yolov8n.pt      # Fallback models
├── .gitignore          # Repository git exclusions file
├── requirements.txt    # Standardized python dependencies list
└── README.md           # Backend documentation
```

---

## ⚙️ Setup and Deployment

### 📋 Prerequisites
- Python 3.10 or 3.11 (Python 3.11 recommended)
- `pip` package manager

### 1. Initialize Virtual Environment
Initialize an isolated virtual environment and activate it:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
Install the required packages isolated in `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 3. Run the Server
Launch the FastAPI uvicorn runtime on port `8001`:
```bash
PYTHONPATH=. python src/main.py
```
*Note: Port `8001` is used to prevent port conflicts with default system services on port `8000`.*
