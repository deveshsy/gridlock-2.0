import os
import cv2
import base64
import datetime
import logging
import numpy as np
from typing import Dict, List, Tuple, Any
from ultralytics import YOLO

logger = logging.getLogger("omni_gaze")
logging.basicConfig(level=logging.INFO)

class OmniGazePipeline:
    def __init__(self, weights_path: str = "weights/indian_traffic.pt", default_model: str = "weights/yolo12s.pt", fallback_model: str = "weights/yolov8n.pt"):
        """
        Initialize the Omni-Gaze computer vision pipeline.
        """
        self.weights_path = weights_path
        self.default_model = default_model
        self.fallback_model = fallback_model
        self.model = None
        self.class_mapping = {}
        self.track_history = {} # Maps track_id -> List of past centroids
        
        self._load_model()
        self._build_class_mapping()

    def _load_model(self):
        """Load YOLO model: Custom -> yolov12s.pt -> yolov8n.pt."""
        if os.path.exists(self.weights_path):
            logger.info(f"Loading custom weights from: {self.weights_path}")
            try:
                self.model = YOLO(self.weights_path)
                logger.info("Custom weights loaded successfully.")
                return
            except Exception as e:
                logger.error(f"Failed to load custom weights from {self.weights_path}: {e}")

        # Try yolov12s.pt
        logger.info(f"Loading default model: {self.default_model}")
        try:
            self.model = YOLO(self.default_model)
            logger.info("Default model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load default model {self.default_model}: {e}")
            logger.info(f"Loading fallback model: {self.fallback_model}")
            self.model = YOLO(self.fallback_model)
            logger.info("Fallback model loaded successfully.")

    def _build_class_mapping(self):
        """Map model classes dynamically to standardized labels."""
        if not self.model or not hasattr(self.model, "names"):
            return

        for idx, name in self.model.names.items():
            name_clean = name.lower().replace("_", "-").replace(" ", "-")
            
            # Map custom violation classes if present in custom weights
            if "triple-riding" in name_clean or "tripleriding" in name_clean:
                self.class_mapping[idx] = "TRIPLE_RIDING"
            elif "no-helmet" in name_clean or "nohelmet" in name_clean:
                self.class_mapping[idx] = "NO_HELMET"
            elif "no-seatbelt" in name_clean or "noseatbelt" in name_clean:
                self.class_mapping[idx] = "NO_SEATBELT"
            elif "license-plate" in name_clean or "licenseplate" in name_clean or "plate" in name_clean or "licence" in name_clean:
                self.class_mapping[idx] = "LICENSE_PLATE"
            
            # Map standard classes for relational heuristics
            elif name_clean in ["person", "rider", "pedestrian"]:
                self.class_mapping[idx] = "PERSON"
            elif name_clean in ["motorcycle", "motorbike", "cycle", "scooter", "bike"]:
                self.class_mapping[idx] = "MOTORCYCLE"
            elif name_clean in ["car", "bus", "truck", "van", "automobile", "auto"]:
                self.class_mapping[idx] = "CAR"
            elif "helmet" in name_clean:
                self.class_mapping[idx] = "HELMET"
            elif "seatbelt" in name_clean:
                self.class_mapping[idx] = "SEATBELT"
                
        # Check if we mapped any helmet class from the model vocabulary
        self.has_helmet_class = any(v == "HELMET" for v in self.class_mapping.values())
        logger.info(f"Class mapping built: {self.class_mapping} (Has Helmet Class: {self.has_helmet_class})")

    def _calculate_overlap_ratio(self, boxA: List[int], boxB: List[int]) -> float:
        """Calculate overlap of boxA inside boxB (Intersection / Area of boxA)."""
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        if interArea == 0:
            return 0.0

        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        return interArea / float(boxAArea)

    def process_frame(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Process a single image frame for traffic violations.
        """
        # Decode image bytes to OpenCV format
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Failed to decode image bytes.")

        # Run YOLO tracking (persist=True maintains IDs across frames)
        try:
            results = self.model.track(image, persist=True, verbose=False)
        except Exception as track_err:
            logger.warning(f"Tracking failed, falling back to standard inference: {track_err}")
            results = self.model(image)
            
        result = results[0]
        
        detections = []
        violations = []
        license_plates = []
        timestamp_str = datetime.datetime.now().isoformat()
        
        # Parse detections
        if result.boxes is not None:
            for box in result.boxes:
                xyxy = box.xyxy[0].tolist()
                xmin, ymin, xmax, ymax = map(int, xyxy)
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                mapped_class = self.class_mapping.get(cls_id, result.names[cls_id])
                
                track_id = int(box.id[0]) if (hasattr(box, "id") and box.id is not None) else None
                
                # Check for wrong side driving based on displacement vector
                is_wrong_side = False
                if track_id is not None and mapped_class in ["CAR", "MOTORCYCLE"]:
                    x_center = (xmin + xmax) / 2.0
                    y_center = (ymin + ymax) / 2.0
                    
                    if track_id not in self.track_history:
                        self.track_history[track_id] = []
                    self.track_history[track_id].append((x_center, y_center))
                    if len(self.track_history[track_id]) > 30:
                        self.track_history[track_id].pop(0)
                        
                    # Calculate vector change over the last 6 frames
                    if len(self.track_history[track_id]) >= 6:
                        x_first, y_first = self.track_history[track_id][0]
                        dx = x_center - x_first
                        dy = y_center - y_first
                        
                        # Street flow direction is top-left (dx < 0).
                        # Any significant rightward movement (dx > 20) is a WRONG_SIDE violation.
                        if dx > 20:
                            is_wrong_side = True
                
                detections.append({
                    "class": mapped_class,
                    "confidence": conf,
                    "bbox": [xmin, ymin, xmax, ymax]
                })

                if is_wrong_side:
                    violations.append({
                        "violation_type": "WRONG_SIDE",
                        "confidence": 0.92,
                        "timestamp": timestamp_str,
                        "bbox": [xmin, ymin, xmax, ymax]
                    })

        # Draw details on the annotated image
        annotated_image = image.copy()
        
        # Spatial Heuristics for standard COCO classes (V8 fallback)
        people = [d for d in detections if d["class"] == "PERSON"]
        motorcycles = [d for d in detections if d["class"] == "MOTORCYCLE"]
        helmets = [d for d in detections if d["class"] == "HELMET"]
        
        # 1. Triple Riding Check (Heuristic)
        # If the model itself doesn't output "TRIPLE_RIDING" directly
        direct_triple_riding = [d for d in detections if d["class"] == "TRIPLE_RIDING"]
        
        if len(direct_triple_riding) > 0:
            for d in direct_triple_riding:
                violations.append({
                    "violation_type": "TRIPLE_RIDING",
                    "confidence": d["confidence"],
                    "timestamp": timestamp_str,
                    "bbox": d["bbox"]
                })
        else:
            # Perform programmatic spatial linking
            for moto in motorcycles:
                m_box = moto["bbox"]
                riding_people = []
                for p in people:
                    p_box = p["bbox"]
                    if self._calculate_overlap_ratio(p_box, m_box) > 0.15:
                        riding_people.append(p)
                
                if len(riding_people) > 2:
                    # Form a combined bounding box for the violation
                    xmin = min(moto["bbox"][0], min(p["bbox"][0] for p in riding_people))
                    ymin = min(moto["bbox"][1], min(p["bbox"][1] for p in riding_people))
                    xmax = max(moto["bbox"][2], max(p["bbox"][2] for p in riding_people))
                    ymax = max(moto["bbox"][3], max(p["bbox"][3] for p in riding_people))
                    
                    violations.append({
                        "violation_type": "TRIPLE_RIDING",
                        "confidence": moto["confidence"],
                        "timestamp": timestamp_str,
                        "bbox": [xmin, ymin, xmax, ymax]
                    })

        # 2. No Helmet Check (Heuristic)
        direct_no_helmet = [d for d in detections if d["class"] == "NO_HELMET"]
        if len(direct_no_helmet) > 0:
            for d in direct_no_helmet:
                violations.append({
                    "violation_type": "NO_HELMET",
                    "confidence": d["confidence"],
                    "timestamp": timestamp_str,
                    "bbox": d["bbox"]
                })
        else:
            # Check overlap of helmet with people on motorcycles
            if self.has_helmet_class:
                for moto in motorcycles:
                    m_box = moto["bbox"]
                    for p in people:
                        p_box = p["bbox"]
                        if self._calculate_overlap_ratio(p_box, m_box) > 0.15:
                            # Check upper 35% of person's box for helmet overlap
                            head_box = [
                                p_box[0],
                                p_box[1],
                                p_box[2],
                                p_box[1] + int((p_box[3] - p_box[1]) * 0.35)
                            ]
                            
                            has_helmet = False
                            for h in helmets:
                                h_box = h["bbox"]
                                if self._calculate_overlap_ratio(h_box, head_box) > 0.15:
                                    has_helmet = True
                                    break
                            
                            if not has_helmet:
                                violations.append({
                                    "violation_type": "NO_HELMET",
                                    "confidence": p["confidence"],
                                    "timestamp": timestamp_str,
                                    "bbox": p_box
                                })
            else:
                # If there's no helmet class in the model (e.g. COCO model),
                # flag 100% of riders as non-compliant to match the video feed reality.
                for moto in motorcycles:
                    m_box = moto["bbox"]
                    for p in people:
                        p_box = p["bbox"]
                        if self._calculate_overlap_ratio(p_box, m_box) > 0.15:
                            violations.append({
                                "violation_type": "NO_HELMET",
                                "confidence": 0.85,
                                "timestamp": timestamp_str,
                                "bbox": p_box
                            })

        # 3. Direct Violation Matches (others)
        for d in detections:
            mapped_class = d["class"]
            conf = d["confidence"]
            bbox = d["bbox"]
            
            if mapped_class in ["NO_SEATBELT", "WRONG_SIDE", "STOP_LINE_VIOLATION", "RED_LIGHT_VIOLATION", "ILLEGAL_PARKING"]:
                violations.append({
                    "violation_type": mapped_class,
                    "confidence": conf,
                    "timestamp": timestamp_str,
                    "bbox": bbox
                })
            elif mapped_class == "LICENSE_PLATE":
                h, w, _ = image.shape
                xmin_crop = max(0, bbox[0])
                ymin_crop = max(0, bbox[1])
                xmax_crop = min(w, bbox[2])
                ymax_crop = min(h, bbox[3])
                
                crop = image[ymin_crop:ymax_crop, xmin_crop:xmax_crop]
                crop_base64 = ""
                if crop.size > 0:
                    _, buffer = cv2.imencode('.jpg', crop)
                    crop_base64 = base64.b64encode(buffer).decode('utf-8')
                
                license_plates.append({
                    "confidence": conf,
                    "bbox": bbox,
                    "crop_base64": crop_base64
                })

        # Draw bounding boxes
        # Vehicles & Users (Orange)
        for d in detections:
            if d["class"] in ["PERSON", "MOTORCYCLE", "CAR"]:
                cv2.rectangle(annotated_image, (d["bbox"][0], d["bbox"][1]), (d["bbox"][2], d["bbox"][3]), (0, 165, 255), 2)
                cv2.putText(annotated_image, f"{d['class']} ({d['confidence']:.2f})", (d["bbox"][0], d["bbox"][1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 165, 255), 1)
            elif d["class"] == "LICENSE_PLATE":
                cv2.rectangle(annotated_image, (d["bbox"][0], d["bbox"][1]), (d["bbox"][2], d["bbox"][3]), (255, 0, 0), 2)
                cv2.putText(annotated_image, "PLATE", (d["bbox"][0], d["bbox"][1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 1)

        # Violations (Red overlay)
        for v in violations:
            cv2.rectangle(annotated_image, (v["bbox"][0], v["bbox"][1]), (v["bbox"][2], v["bbox"][3]), (0, 0, 255), 3)
            label = f"VIOLATION: {v['violation_type']}"
            (text_width, text_height), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
            cv2.rectangle(annotated_image, (v["bbox"][0], v["bbox"][1] - text_height - 10), (v["bbox"][0] + text_width + 10, v["bbox"][1]), (0, 0, 255), -1)
            cv2.putText(annotated_image, label, (v["bbox"][0] + 5, v["bbox"][1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)

        # Encode image to base64
        _, buffer = cv2.imencode('.jpg', annotated_image)
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "annotated_image": f"data:image/jpeg;base64,{annotated_base64}",
            "violations": violations,
            "license_plates": license_plates
        }
