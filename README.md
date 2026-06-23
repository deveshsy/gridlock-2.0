# OMNI-GAZE Traffic Management Centre (TMC) Dashboard

OMNI-GAZE is an AI-powered next-generation traffic violation detection and enforcement dashboard built for the Bengaluru Traffic Police (BTP) as part of the Flipkart Gridlock 2.0 Hackathon. The platform accelerates straight-through processing (STP) of traffic challans, addressing manual review fatigue and operational bottlenecks at the Infantry Road Traffic Management Centre (TMC).

---

## 🚀 Key Architectural Features

### 1. **Lumina-FDA: Zero-Reference Environmental Adaptation Engine**
Standard object detection models degrade under low-light or adverse weather conditions (monsoons, night, fog). Lumina-FDA automatically restores degraded frames in real-time before downstream YOLO processing.
- **Zero-DCE (Deep Curve Estimation):** An lightweight curve estimation CNN that brightens images without paired reference datasets.
- **Fourier Domain Adaptation (FDA):** Swaps low-frequency style amplitudes with a clear-weather target domain while preserving high-frequency geometric/edge phases.

### 2. **Omni-Gaze: Contextual Multi-Stage Violation & Perspective-Corrected OCR**
An attention-centric hierarchical pipeline utilizing state-of-the-art YOLOv12 architectures.
- **Heuristic Relational Logic:** Prevents false alarms by dynamically linking entities. It calculates Intersection over Union (IoU) between motorcyclists and pillion riders to trigger **Triple Riding** and checks head zones for **Helmet Non-Compliance** (replacing legacy mobile usage detection).
- **Affine Perspective Correction:** Isolates and flattens skewed license plates using OpenCV transforms before executing text prediction via a Sequence-to-Sequence Vision Transformer (TrOCR).

### 3. **Chronos-RAG: Conversational Analytics & Auto-Ticketing Agent**
Empowers operators to interface with raw logs using natural language (SQL agent).
- **TimescaleDB Partitioning:** Organizes event vectors in a hypertable, enabling time-bounded KNN vector searches across millions of events.
- **Notice Generation:** Automatically translates detected telemetry into legally compliant e-challans.

---

## 🛠️ Technology Stack

### **Frontend**
- **Core:** React.js, Vite
- **Styling:** Tailwind CSS (v4)
- **Visuals & Charts:** Recharts (Analytics), Lucide React (Icons), Framer Motion (Transitions and slide-outs)

### **Backend**
- **API Framework:** FastAPI (Asynchronous stream processor)
- **Computer Vision:** PyTorch, YOLOv12s, OpenCV, ByteTrack / Deep SORT
- **Language Models & Vector Store:** LangChain, TimescaleDB, pgvector, TrOCR

---

## 📁 Repository Structure

```
/Users/dsy/fh/
├── backend/                  # FastAPI Application Core
│   ├── config/               # System parameters and pipeline thresholds
│   │   └── .gitkeep
│   ├── src/                  # Core processing and API modules
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI routes and server initialization
│   │   └── core/
│   │       ├── __init__.py
│   │       └── omni_gaze.py  # Relational CV heuristic engine
│   ├── utils/                # Geofencing math, frame processing utilities
│   │   └── .gitkeep
│   └── weights/              # Model weights folder (ignored from Git)
│       └── .gitkeep
├── frontend/                 # React client application
│   ├── public/               # Static assets (bangalore_map_bg.png, cctv 1.mp4)
│   ├── src/
│   │   ├── App.jsx           # Bento-grid UI root controller
│   │   ├── components/
│   │   │   ├── MapWidget.jsx             # MapmyIndia absolute-positioned radar
│   │   │   ├── VideoInferencePlayer.jsx  # CCTV video player (22s loop)
│   │   │   ├── LiveViolationLog.jsx      # Slide-in live telemetry feeds
│   │   │   ├── TrafficAnalyticsModule.jsx# Recharts analytics widget
│   │   │   └── ChronosRagAssistant.jsx   # AI Copilot chat drawer
│   │   ├── hooks/
│   │   │   └── useSimulatedInference.js  # WebSocket simulation feed hook
│   │   └── mock_violations.json          # Core telemetry violation database
│   └── tailwind.config.js
└── README.md                 # Project Setup & Startup Documentation
```

---

## ⚙️ Getting Started

### 📋 Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Pip package manager

### 1. **Run the Backend**
```bash
cd backend
# Create a virtual environment and install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the development server on port 8001
PYTHONPATH=. python src/main.py
```
*Note: The backend binds to port `8001` to prevent conflicts with other system-level services on port `8000`.*

### 2. **Run the Frontend**
```bash
cd frontend
# Install npm dependencies
npm install

# Run the client in development mode
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the B2B SaaS TMC Dashboard.

---

## 💡 Usage Highlights

1. **MapmyIndia Integration:** Click the **Begur Amin Road Cam** node on the Central Silk Board Junction to activate the live CCTV feed and start processing telemetry logs.
2. **22-Second Loop Constraint:** The CCTV feed (`cctv 1.mp4`) enforces a strict looping boundary at the 22-second mark.
3. **Reactive Alerts:** When a violation is simulated on the active camera stream, the map marker transitions to deep red, and a pulsing badge count notifies BTP operators instantly.

---

## 🏗️ Production Scaling & Enterprise Architecture
While the current Vercel/FastAPI prototype demonstrates the end-to-end Straight-Through Processing (STP) pipeline, the production deployment architecture incorporates the following enterprise optimizations:

* **Trajectory-Consistent Gating (Kalman Filtering):** To eliminate transient ghost artifacts (e.g., shadows triggering YOLO), the production ByteTrack pipeline pipes per-track centroid history into a lightweight Kalman Filter, mathematically verifying trajectories before triggering violation logic.
* **Federated Edge Inference (gRPC):** Edge nodes run quantized INT8 models (TensorRT-exported) locally. Instead of streaming heavy video to the cloud, nodes communicate lightweight violation telemetry payloads to the TMC via gRPC streams, drastically cutting bandwidth costs.
* **Asynchronous OCR Pipeline:** To prevent the Sequence-to-Sequence Vision Transformer (TrOCR) from bottlenecking the 30ms real-time vision loop, license plate text extraction and E-Challan PDF generation are uncoupled into an asynchronous background task queue (Celery), ensuring zero frame drops.
* **Citation-Anchored RAG (Auditability):** To ensure legal defensibility for the BTP, the Chronos AI assistant employs a strict retrieve-then-generate pattern. Every generated response or action is anchored to a specific TimescaleDB row ID and timestamp, preventing LLM hallucination and guaranteeing 100% auditability.
