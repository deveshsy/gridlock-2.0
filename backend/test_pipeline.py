import os
import cv2
import numpy as np
import base64
from src.core.omni_gaze import OmniGazePipeline

def create_dummy_traffic_image():
    """Create a dummy traffic scene image with numpy."""
    # Create a dark gray canvas (representing a road scene)
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img.fill(50)
    
    # Draw a simulated road lane line
    cv2.line(img, (320, 240), (320, 480), (255, 255, 255), 4)
    
    # Draw some placeholder objects representing cars/bikes
    # Bbox 1: Simulate a vehicle (e.g. a car)
    cv2.rectangle(img, (100, 200), (250, 350), (100, 100, 100), -1)
    cv2.putText(img, "Car Placeholder", (110, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    # Bbox 2: Simulate a license plate region
    cv2.rectangle(img, (150, 300), (200, 330), (200, 200, 200), -1)
    cv2.putText(img, "KA 03 1234", (155, 320), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)
    
    # Bbox 3: Simulate a rider (person on motorcycle)
    cv2.circle(img, (450, 250), 30, (200, 150, 100), -1) # Head
    cv2.rectangle(img, (420, 280), (480, 380), (0, 120, 200), -1) # Body
    cv2.putText(img, "Rider", (435, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    
    return img

def main():
    print("--- Starting Omni-Gaze Backend Test (process_frame) ---")
    
    # 1. Create a dummy image
    img = create_dummy_traffic_image()
    _, buffer = cv2.imencode('.jpg', img)
    img_bytes = buffer.tobytes()
    print("Created dummy traffic image bytes.")

    # 2. Setup mock weights path (weights directory)
    os.makedirs("weights", exist_ok=True)
    custom_weights = "weights/indian_traffic.pt"
    
    # 3. Instantiate pipeline
    print("Initializing OmniGazePipeline...")
    pipeline = OmniGazePipeline(weights_path=custom_weights, default_model="weights/yolo12s.pt", fallback_model="weights/yolov8n.pt")
    
    print(f"Active model: {pipeline.model}")
    print(f"Class mapping: {pipeline.class_mapping}")

    # 4. Process the frame
    print("Running process_frame on dummy bytes...")
    try:
        result = pipeline.process_frame(img_bytes)
        
        annotated_base64 = result["annotated_image"]
        violations = result["violations"]
        license_plates = result["license_plates"]
        
        print("\n=== Analysis Results ===")
        print(f"Annotated Image Base64 length: {len(annotated_base64)}")
        print(f"Violations detected ({len(violations)}):")
        for v in violations:
            print(f" - Type: {v['violation_type']}, Conf: {v['confidence']:.2f}, Bbox: {v['bbox']}")
            
        print(f"License Plates detected ({len(license_plates)}):")
        for lp in license_plates:
            print(f" - Conf: {lp['confidence']:.2f}, Bbox: {lp['bbox']}, Crop base64 length: {len(lp['crop_base64'])}")
            
        # Save output image to verify visually (strip prefix)
        base64_data = annotated_base64.split(",")[1]
        annotated_img_data = base64.b64decode(base64_data)
        nparr = np.frombuffer(annotated_img_data, np.uint8)
        annotated_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        cv2.imwrite("test_annotated_output.jpg", annotated_img)
        print("\nSaved annotated test output image as 'test_annotated_output.jpg'.")
        print("Pipeline run completed successfully!")
        
    except Exception as e:
        print(f"Error during analysis: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
