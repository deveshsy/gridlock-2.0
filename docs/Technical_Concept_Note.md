# TECHNICAL CONCEPT NOTE & PROTOTYPE PROPOSAL
## Theme 3: Automated Photo Identification and Classification for Traffic Violations Using Computer Vision
**Team ID:** dsy230106  
**Competition:** Flipkart Gridlock Hackathon 2.0 — Round 2 (Prototype Phase)  
**Target Agency:** Bengaluru Traffic Police (BTP) — Traffic Management Centre (TMC)  

---

## 1. Executive Summary & Problem Definition

Bengaluru, India's tech capital, supports over 1.25 crore registered vehicles on a constrained road network of approximately 14,000 kilometers. To enforce traffic compliance, the Bengaluru Traffic Police (BTP) utilizes an Intelligent Traffic Management System (ITMS) that ingests millions of camera frames daily. However, the current system faces a major operational bottleneck: **manual review fatigue**.

Operators at the TMC must manually inspect thousands of low-resolution, warped, or dark photos to verify license plates, helmet violations, and red-light jumping before issuing e-challans. Misclassifications lead to public disputes, while manual processing introduces latency and high operational costs.

### The Solution: ASTraM / OMNI-GAZE
OMNI-GAZE is a comprehensive computer vision and AI-powered operations dashboard that achieves **straight-through processing (STP)** of traffic violations. The solution leverages:
1. **Lumina-FDA:** A zero-reference preprocessing engine that normalizes degraded lighting and weather conditions in real-time.
2. **Omni-Gaze CV Pipeline:** An attention-centric YOLOv12 model combined with hierarchical spatial-relation algorithms and OpenCV affine perspective transformations for high-accuracy license plate extraction using a Sequence-to-Sequence Vision Transformer (TrOCR).
3. **Chronos-RAG Copilot:** A temporal Retrieval-Augmented Generation agent querying a TimescaleDB hypertable database, enabling BTP operators to query active threats and generate legal dispatch notices using natural language.

---

## 2. End-to-End System Architecture

The OMNI-GAZE system maps camera frame ingestion to real-time telemetry, spatial search, and chat-based operator commands:

```
[ CCTV Stream Ingestion (RTSP) ]
              │
              ▼
    [ Lumina-FDA Preprocessing ] ────► (Night-to-Day Restoration Slider)
              │
              ▼
   [ PyTorch YOLOv12 Inference ] ────► (Multi-Class Object Bounding Boxes)
              │
              ▼
 [ Relational Violation Heuristics ] ──► (Triple Riding / No Helmet Checks)
              │
              ▼
  [ OpenCV Perspective Unwarping ] ──► (License Plate Flattening)
              │
              ▼
       [ TrOCR Engine ] ─────────────► (Text-String Extraction)
              │
              ▼
  [ TimescaleDB Vector Hypertables ] ──► (Metadata & Coordinate Storing)
              │
              ▼
   [ Chronos-RAG Copilot Agent ] ────► (LangChain SQL Query Interface)
```

---

## 3. Preprocessing Engine: Lumina-FDA

To handle low light, monsoons, shadows, and motion blur, raw video frames are preprocessed by the **Lumina-FDA** engine before downstream inference.

### Zero-Reference Deep Curve Estimation (Zero-DCE)
Zero-DCE formulates low-light enhancement as an image-specific curve estimation task. It learns a mapping function $F(x, A)$ that outputs a set of pixel-wise curve parameter maps $A$ to iteratively adjust the dynamic range:
$$I_{n}(x) = I_{n-1}(x) + A_n(x) I_{n-1}(x)(1 - I_{n-1}(x))$$
where $I_n(x)$ is the enhanced image at step $n$, and $A_n(x)$ represents the curve parameters at step $n$. This process illumination-corrects frames without paired clear-dark training sets, keeping latency under **3ms** per frame.

### Fourier Domain Adaptation (FDA)
To mitigate rain and fog, the amplitude spectrum of the adverse weather target image $I_{target}$ is adapted using a clear weather source domain $I_{clear}$.
Given the Fast Fourier Transform (FFT) $\mathcal{F}$ of an image:
$$\mathcal{F}(I) = \mathcal{A}(I) \cdot e^{i \mathcal{P}(I)}$$
where $\mathcal{A}(I)$ is the amplitude spectrum and $\mathcal{P}(I)$ is the phase spectrum. FDA swaps the low-frequency amplitude of the weather-affected frame with the clear-sky amplitude:
$$\mathcal{A}_{adapted} = (1 - M) \mathcal{A}(I_{target}) + M \mathcal{A}(I_{clear})$$
where $M$ is a binary mask controlling the boundaries of amplitude replacement. Reconstructing the image via Inverse FFT (IFFT) preserves sharp spatial edges (like license plate borders) while stripping fog and rain noise.

---

## 4. Multi-Stage Violation Detection & OCR Pipeline

The core detection engine runs PyTorch-based YOLOv12s models optimized with Attention-Centric (A2) frameworks and R-ELAN aggregators to maximize multi-scale class recall.

### Relational Violation Heuristics

1. **Triple Riding:**
   The model detects the bounding boxes of motorcycles ($B_M$) and riders ($B_P$). Intersection over Union (IoU) is computed:
   $$IoU(B_P, B_M) = \frac{\text{Area}(B_P \cap B_M)}{\text{Area}(B_P \cup B_M)}$$
   If $IoU(B_P, B_M) > 0.15$ for three or more unique person IDs associated with one motorcycle ID, a **Triple Riding** violation is flagged.
   
2. **Helmet Non-Compliance:**
   For each linked rider bounding box $B_{Rider}$, the system crops the head region of interest ($ROI_{Head}$), defined as the top 20% of the Y-axis height. The model evaluates whether a helmet class box ($B_{Helmet}$) overlaps the head region:
   $$IoU(B_{Helmet}, ROI_{Head}) \ge 0.15$$
   If no overlap is detected, a **No Helmet** violation is logged.

### Perspective-Corrected OCR
Number plates on turning or accelerating vehicles are highly skewed. Omni-Gaze performs **Perspective-Correction Warping** before text extraction:
1. **Contour Analysis:** Detects the four corners $P_i = (x_i, y_i)$ ($i \in \{1, 2, 3, 4\}$) of the license plate polygon using edge-gradient thresholds.
2. **Transformation Matrix:** Estimates a $3 \times 3$ transformation matrix $M$ satisfying:
   $$P'_i = M \cdot P_i$$
   where $P'_i$ represents the rectangular normalized targets $(0,0), (W,0), (W,H), (0,H)$.
3. **Warp Perspective:** Executes `cv2.warpPerspective` to obtain a perfectly flat license plate crop.
4. **Sequence-to-Sequence OCR:** Feeds the cropped image into **TrOCR** (Transformer OCR). The vision encoder extracts visual features into sequence patches, and the language decoder predicts characters sequentially, eliminating character recognition errors on non-standard fonts.

---

## 5. Temporal Storage & Chronos-RAG Copilot

### TimescaleDB Hypertables
Structured violation metadata (timestamp, plate, violation class, coordinate, confidence) is stored in TimescaleDB. The database partitions the data into chunks based on time (hypertables). This prevents time-series query degradation, ensuring indexing remains flat regardless of scale.

### LangChain SQL Agent & Time-Series Vector Search
The RAG Copilot translates natural language instructions into PostgreSQL queries:
- **Spatial Queries:** *"How many helmet violations occurred at Central Silk Board Junction today?"*
- **Database Agent:** The LangChain agent maps the query to the hypertable schema:
  ```sql
  SELECT COUNT(*), camera FROM violations 
  WHERE timestamp >= NOW() - INTERVAL '1 day' 
  AND violation_type = 'NO_HELMET' 
  GROUP BY camera;
  ```
- **Time-Bounded KNN Similarity Search:** For queries such as *"Find vehicles matching the description of a red motorcycle fleeing Central Silk Board"* pgvector executes a similarity query constrained by the Timescale partition window.

---

## 6. Infrastructure & Deployment Model

To handle large-scale deployment across Bengaluru's camera network, the system uses edge computing:

* **AWS Wavelength (5G Edge MEC):** YOLOv12 models are deployed on edge nodes within telecom 5G networks. Raw video streams are processed near the camera with single-digit millisecond latency.
* **Celery & Redis Asynchronous Worker Queues:** Heavy processing jobs (such as running TrOCR or LangChain analytical aggregations) are pushed to a Redis broker. Celery worker pods execute tasks asynchronously, maintaining a highly responsive operator dashboard.
* **Incident Data Archival:** Only low-bandwidth JSON metadata and license crops are sent to the central AWS region, optimizing city-wide bandwidth consumption.

---

## 7. Performance Evaluation Strategy

To validate the model, BTP evaluations measure both accuracy and speed:

| Metric | Target Performance | Validation Method |
| :--- | :--- | :--- |
| **Object Detection mAP50-95** | $\ge 82.5\%$ | Evaluated against custom Indian Traffic Datasets. |
| **OCR Character Error Rate (CER)** | $\le 1.8\%$ | Measured on warped/night-time license plate test sets. |
| **End-to-End Latency** | $\le 33\text{ms}$ (30 FPS) | Profiles frame ingestion to metadata output. |
| **Reduction in Manual Review** | $\ge 85\%$ | Measures challans processed with confidence score $> 0.92$ (STP). |
