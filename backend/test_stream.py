import os
import cv2
import base64
import requests
import numpy as np
import sys
import argparse
from typing import Dict, Any

# Configurations
DEFAULT_VIDEO_PATH = "/Users/dsy/fh/kolkata traffic #india #youtubeshorts.mp4"
DEFAULT_API_URL = "http://127.0.0.1:8001/api/v1/analyze-frame"

def main():
    parser = argparse.ArgumentParser(description="Omni-Gaze Live Stream Client Test")
    parser.add_argument("--video", type=str, default=DEFAULT_VIDEO_PATH, help="Path to input video file")
    parser.add_argument("--url", type=str, default=DEFAULT_API_URL, help="Target API frame analysis URL")
    parser.add_argument("--headless", action="store_true", help="Run in headless mode without opening GUI windows")
    args = parser.parse_args()

    video_path = args.video
    api_url = args.url
    headless = args.headless

    print(f"--- Omni-Gaze Live Stream Client Test ---")
    print(f"Target Video: {video_path}")
    print(f"Target API Endpoint: {api_url}")
    print(f"Headless Mode: {headless}")

    if not os.path.exists(video_path):
        print(f"ERROR: Video file not found at: {video_path}")
        sys.exit(1)

    # Open video capture
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"ERROR: Failed to open video file: {video_path}")
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Video opened. FPS: {fps:.2f}, Total Frames: {total_frames}, Resolution: {width}x{height}")
    print("Starting processing. Press 'q' in the GUI window to quit (if not in headless mode).\n")

    # Initialize video writer to save output
    output_filename = "output_annotated.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out_video = cv2.VideoWriter(output_filename, fourcc, fps, (width, height))
    print(f"Saving annotated video to: {os.path.abspath(output_filename)}")

    frame_count = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("End of video stream reached.")
                break

            frame_count += 1
            frame_to_write = frame
            
            # Encode frame as JPEG
            _, buffer = cv2.imencode('.jpg', frame)
            jpeg_bytes = buffer.tobytes()

            # Prepare files payload for multipart/form-data
            files = {
                'file': ('frame.jpg', jpeg_bytes, 'image/jpeg')
            }

            try:
                # POST request to FastAPI endpoint
                response = requests.post(api_url, files=files, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # 1. Parse and print violation metadata in real-time
                    violations = data.get("violations", [])
                    if len(violations) > 0:
                        print(f"[Frame {frame_count}] VIOLATION ALERT:")
                        for v in violations:
                            print(f"  - {v['violation_type']} (Confidence: {v['confidence']:.2f}) bbox: {v['bbox']}")
                    
                    # 2. Extract and decode annotated image
                    annotated_base64 = data.get("annotated_image")
                    if annotated_base64:
                        # Strip data URI prefix if present
                        if "," in annotated_base64:
                            annotated_base64 = annotated_base64.split(",")[1]
                        
                        img_data = base64.b64decode(annotated_base64)
                        nparr = np.frombuffer(img_data, np.uint8)
                        annotated_frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                        
                        if annotated_frame is not None:
                            frame_to_write = annotated_frame
                            if not headless:
                                cv2.imshow('Omni-Gaze Live Stream', annotated_frame)
                        else:
                            if not headless:
                                cv2.imshow('Omni-Gaze Live Stream', frame)
                else:
                    print(f"Error: API returned status code {response.status_code} - {response.text}")
                    if not headless:
                        cv2.imshow('Omni-Gaze Live Stream', frame)

            except requests.exceptions.RequestException as req_err:
                print(f"Connection Error: Failed to reach API server. Is it running? {req_err}")
                if not headless:
                    cv2.imshow('Omni-Gaze Live Stream', frame)

            # Write the current frame (annotated or fallback) to video output file
            out_video.write(frame_to_write)

            # waitKey(1) handles window drawing updates and keyboard input (only if GUI is active)
            if not headless:
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("User terminated stream.")
                    break
            else:
                # Add a tiny delay or check to allow visual feedback in CLI
                if frame_count % 10 == 0:
                    print(f"Processed {frame_count}/{total_frames} frames...")

    finally:
        # Clean up
        cap.release()
        out_video.release()
        if not headless:
            cv2.destroyAllWindows()
        print("Video capture and video writer released, resources cleaned up.")

if __name__ == "__main__":
    main()
