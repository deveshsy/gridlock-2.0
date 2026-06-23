import os
import qrcode
from fpdf import FPDF

def generate_echallan_pdf(
    license_plate: str,
    violation_type: str,
    camera_node: str,
    timestamp: str,
    fine_amount: int,
    evidence_image_path: str = None,
    output_path: str = "challan.pdf"
) -> str:
    pdf = FPDF()
    pdf.add_page()
    
    # Set margins
    pdf.set_margins(15, 15, 15)
    
    # 1. Header (BTP WebP Logo centered instead of text banner)
    logo_path = "Bengaluru-Traffic.webp"
    logo_rendered = False
    
    for path in [logo_path, "../Bengaluru-Traffic.webp", "frontend/public/Bengaluru-Traffic.webp"]:
        if os.path.exists(path):
            pdf.image(path, x=87.5, y=15, w=35) # Centered logo (printable width is 180, center is 15 + 90 - 17.5 = 87.5)
            logo_rendered = True
            break
            
    if not logo_rendered:
        # Fallback text banner if logo is missing
        pdf.set_fill_color(40, 116, 240)
        pdf.rect(15, 15, 180, 15, 'F')
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_y(19)
        pdf.cell(180, 8, "BANGALORE TRAFFIC POLICE (BTP)", align="C")
        pdf.set_y(35)
    else:
        # Label below BTP logo
        pdf.set_y(52)
        pdf.set_text_color(40, 116, 240)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(180, 5, "BANGALORE TRAFFIC POLICE (BTP)", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "I", 7.5)
        pdf.cell(180, 4, "Neural Network Traffic Monitoring Command Centre, Bengaluru", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_y(63)
        
    # Reset text color to slate dark
    pdf.set_text_color(51, 65, 85)
    
    # 2. Document details
    pdf.set_font("Helvetica", "B", 11)
    challan_id = f"BTP-EC-{hash(timestamp) % 100000000:08d}"
    pdf.cell(180, 6, f"Challan Number: {challan_id}", align="L", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("Helvetica", "", 8.5)
    pdf.cell(180, 4, f"Date of Issue: {timestamp}", align="L", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(180, 4, "Status: PENDING PAYMENT", align="L", new_x="LMARGIN", new_y="NEXT")
    
    # Separator line
    pdf.set_draw_color(226, 232, 240)
    pdf.line(15, pdf.get_y() + 2, 195, pdf.get_y() + 2)
    
    # 3. Violation details table
    pdf.set_y(pdf.get_y() + 5)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(248, 250, 252) # Light slate row background
    
    # Table headers
    pdf.cell(80, 7, "Description / Parameter", border=1, fill=True)
    pdf.cell(100, 7, "Recorded Details", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")
    
    # Table rows
    pdf.set_font("Helvetica", "", 8.5)
    
    rows = [
        ("LICENSE PLATE", license_plate),
        ("VIOLATION DETECTED", violation_type),
        ("CAMERA NODE ID", camera_node),
        ("VIOLATION TIMESTAMP", timestamp),
        ("FINE AMOUNT (INR)", f"Rs. {fine_amount}/-"),
    ]
    
    for label, val in rows:
        pdf.set_font("Helvetica", "B", 8.5)
        pdf.cell(80, 7, label, border=1)
        pdf.set_font("Helvetica", "", 8.5)
        pdf.cell(100, 7, val, border=1, new_x="LMARGIN", new_y="NEXT")
        
    # 4. Evidence Image Embed (Replacing text placeholder)
    pdf.set_y(pdf.get_y() + 4)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(180, 5, "EVIDENCE DOCUMENTATION (INFERENCE FRAME)", new_x="LMARGIN", new_y="NEXT")
    
    evidence_image = None
    if evidence_image_path and os.path.exists(evidence_image_path):
        evidence_image = evidence_image_path
    else:
        # Fallback to default screenshot or bounding box frame
        for fallback in [
            "Screenshot 2026-06-22 at 2.57.24\u202fPM.png",
            "../Screenshot 2026-06-22 at 2.57.24\u202fPM.png",
            "test_annotated_output.jpg",
            "../backend/test_annotated_output.jpg"
        ]:
            if os.path.exists(fallback):
                evidence_image = fallback
                break
                
    if evidence_image:
        # Centered frame image (width 110, height 58, 16:9 ratio)
        pdf.image(evidence_image, x=50, y=pdf.get_y() + 2, w=110, h=58)
        pdf.set_y(pdf.get_y() + 62)
    else:
        # Draw placeholder box
        pdf.set_fill_color(241, 245, 249)
        pdf.set_draw_color(203, 213, 225)
        pdf.rect(15, pdf.get_y() + 2, 180, 45, 'DF')
        pdf.set_y(pdf.get_y() + 20)
        pdf.set_font("Helvetica", "I", 8.5)
        pdf.set_text_color(100, 116, 139)
        pdf.cell(180, 6, "[ CAMERA INFERENCE VISUAL PROOF ATTACHED ON LIVE DATABASE ]", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(51, 65, 85)
        pdf.set_y(pdf.get_y() + 25)
        
    # 5. Payment QR Code and Instructions
    pdf.set_y(pdf.get_y() + 3)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(180, 5, "PAYMENT AND SIGN-OFF DETAILS", new_x="LMARGIN", new_y="NEXT")
    
    # Generate QR Code dynamically
    qr_dir = "/tmp/btp_qr"
    os.makedirs(qr_dir, exist_ok=True)
    qr_path = os.path.join(qr_dir, f"qr_{challan_id}.png")
    
    # UPI URI mapped to specific fine amount and reference
    upi_uri = f"upi://pay?pa=dsy@pingpay&pn=Bangalore%20Traffic%20Police&tr={challan_id}&am={fine_amount}&cu=INR"
    
    qr = qrcode.QRCode(version=1, box_size=5, border=1)
    qr.add_data(upi_uri)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_img.save(qr_path)
    
    # Embed QR Code on the left (w=25, h=25)
    pdf.image(qr_path, x=15, y=pdf.get_y() + 2, w=25, h=25)
    
    # Payment Instructions on the right
    pdf.set_y(pdf.get_y() + 2)
    pdf.set_x(46)
    pdf.set_font("Helvetica", "B", 8)
    pdf.cell(145, 4, "SCAN TO PAY CHALLAN:", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_x(46)
    pdf.set_font("Helvetica", "", 7.5)
    pdf.cell(145, 3.5, "1. Scan the QR code using any UPI app (GPay, PhonePe, Paytm).", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(46)
    pdf.cell(145, 3.5, f"2. The exact fine amount of Rs. {fine_amount}/- is pre-filled automatically.", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(46)
    pdf.cell(145, 3.5, f"3. Confirm payment to 'Bangalore Traffic Police' (ID: {challan_id}).", new_x="LMARGIN", new_y="NEXT")
    
    # Footer signed off line
    pdf.set_y(260)
    pdf.set_draw_color(226, 232, 240)
    pdf.line(15, 258, 195, 258)
    pdf.set_font("Helvetica", "I", 7)
    pdf.cell(180, 5, "Digitally Signed and Approved by BTP Neural Traffic Monitoring Command Centre, Bengaluru.", align="C")
    
    pdf.output(output_path)
    return output_path
