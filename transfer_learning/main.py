"""
PeoplePay360 - High-FPS Native Desktop AI Face Attendance
Runs locally as a native Python popup window (no browser needed).
Uses a multi-threaded architecture with asynchronous InsightFace inference
to ensure smooth 30+ FPS video with real-time facial recognition and attendance tracking.

Controls:
  [C] or [SPACE] : Biometric Check-In (marks attendance)
  [O]            : Biometric Check-Out
  [R]            : Enroll / Register current face
  [Q] or [ESC]   : Exit
"""

import cv2
import os
import json
import time
import datetime
import threading
import numpy as np
import insightface
from insightface.app import FaceAnalysis

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
FACES_FILE = os.path.join(DATA_DIR, "registered_faces.json")
LOGS_FILE = os.path.join(DATA_DIR, "attendance_logs.json")

print("\n" + "="*60)
print("  PEOPLEPAY360 - HIGH-FPS DESKTOP AI FACE ATTENDANCE  ")
print("="*60)
print("[1/3] Loading InsightFace ArcFace engine (optimized buffalo_sc)...")

# Initialize InsightFace with optimized 320x320 det_size for maximum CPU FPS
face_app = FaceAnalysis(name='buffalo_sc', providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(320, 320))
print("[2/3] InsightFace model initialized successfully!")

REGISTERED_FACES = {}
ATTENDANCE_LOGS = []

def load_data():
    global REGISTERED_FACES, ATTENDANCE_LOGS
    if os.path.exists(FACES_FILE):
        try:
            with open(FACES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            for emp_num, record in data.items():
                REGISTERED_FACES[emp_num] = {
                    "employeeNumber": record["employeeNumber"],
                    "name": record["name"],
                    "role": record.get("role", "Employee"),
                    "email": record.get("email", ""),
                    "embedding": np.array(record["embedding"], dtype=np.float32)
                }
            print(f"[3/3] Loaded {len(REGISTERED_FACES)} registered profile(s) from disk.")
        except Exception as e:
            print(f"[WARN] Failed to load faces: {e}")

    if os.path.exists(LOGS_FILE):
        try:
            with open(LOGS_FILE, "r", encoding="utf-8") as f:
                ATTENDANCE_LOGS = json.load(f)
        except Exception:
            pass

def save_faces():
    try:
        data = {}
        for emp_num, record in REGISTERED_FACES.items():
            data[emp_num] = {
                "employeeNumber": record["employeeNumber"],
                "name": record["name"],
                "email": record.get("email", ""),
                "embedding": record["embedding"].tolist()
            }
        with open(FACES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[WARN] Failed to save faces: {e}")

def save_logs():
    try:
        with open(LOGS_FILE, "w", encoding="utf-8") as f:
            json.dump(ATTENDANCE_LOGS[-100:], f, indent=2)
    except Exception as e:
        print(f"[WARN] Failed to save logs: {e}")

def notify_backend_punch(emp_number, action, confidence, entry_id=None, time_str=None, iso_now=None, worked_hours=0.0):
    try:
        import urllib.request
        url = "http://127.0.0.1:5000/api/attendance/live-punch"
        payload = json.dumps({
            "employeeNumber": emp_number,
            "action": action,
            "matchConfidence": confidence,
            "entryId": entry_id,
            "timeStr": time_str,
            "isoNow": iso_now,
            "workedHours": worked_hours
        }).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            pass
    except Exception:
        pass # Non-blocking; local JSON log is primary source

def match_face(target_embedding, threshold=0.45):
    best_match = None
    highest_sim = -1.0
    for emp_num, record in REGISTERED_FACES.items():
        sim = float(np.dot(target_embedding, record["embedding"]))
        if sim > highest_sim:
            highest_sim = sim
            best_match = record
    if best_match and highest_sim >= threshold:
        return True, best_match, highest_sim
    return False, best_match, highest_sim


# ==========================================
# THREADED ASYNC INFERENCE PIPELINE
# (Keeps camera stream running at full 30+ FPS)
# ==========================================
latest_raw_frame = None
frame_lock = threading.Lock()
is_running = True

# Shared state updated by background AI thread
ai_lock = threading.Lock()
tracked_faces = []      # list of dicts: {"bbox": [x1, y1, x2, y2], "label": str, "matched": bool, "embedding": np.ndarray}
active_embedding = None # primary face embedding for action triggers

def ai_inference_worker():
    global tracked_faces, active_embedding, is_running
    while is_running:
        frame_to_process = None
        with frame_lock:
            if latest_raw_frame is not None:
                frame_to_process = latest_raw_frame.copy()

        if frame_to_process is None:
            time.sleep(0.005)
            continue

        try:
            # Downscale frame for ultra-fast AI inference without loading the CPU
            orig_h, orig_w = frame_to_process.shape[:2]
            infer_w = 320
            infer_h = int(orig_h * (infer_w / orig_w))
            small_frame = cv2.resize(frame_to_process, (infer_w, infer_h), interpolation=cv2.INTER_LINEAR)
            scale_x = orig_w / float(infer_w)
            scale_y = orig_h / float(infer_h)

            faces = face_app.get(small_frame)
            new_tracked = []
            primary_emb = None

            if len(faces) > 0:
                # Sort by face area descending
                faces = sorted(faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]), reverse=True)
                
                for idx, f in enumerate(faces):
                    # Scale coordinates back to full HD display frame
                    bbox = [
                        int(f.bbox[0] * scale_x),
                        int(f.bbox[1] * scale_y),
                        int(f.bbox[2] * scale_x),
                        int(f.bbox[3] * scale_y)
                    ]
                    emb = f.embedding
                    norm = np.linalg.norm(emb)
                    label = "Detecting..."
                    matched = False
                    
                    if norm > 0:
                        emb = emb / norm
                        if idx == 0:
                            primary_emb = emb
                        matched, rec, sim = match_face(emb)
                        if matched:
                            role_str = f" [{rec['role']}]" if rec.get('role') else ""
                            label = f"{rec['name']}{role_str} ({int(sim*100)}%)"
                        else:
                            label = f"Unregistered ({int(max(0, sim)*100)}%)"
                    
                    new_tracked.append({
                        "bbox": bbox,
                        "label": label,
                        "matched": matched,
                        "embedding": emb
                    })

            with ai_lock:
                tracked_faces = new_tracked
                active_embedding = primary_emb

        except Exception as e:
            pass

        time.sleep(0.02)


def main():
    global latest_raw_frame, is_running
    load_data()

    # Open camera with DirectShow for instant, crisp HD streaming
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("\n[ERROR] Could not open webcam. Please check camera permissions.")
        return

    # Request HD 720p (1280x720) for crystal-clear video quality
    cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[INFO] Camera stream active: {actual_w}x{actual_h} HD resolution")

    # Start background AI worker thread
    ai_thread = threading.Thread(target=ai_inference_worker, daemon=True)
    ai_thread.start()

    window_title = "PeoplePay360 - AI Face Biometric Attendance (HD)"
    cv2.namedWindow(window_title, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_title, actual_w, actual_h)
    cv2.setWindowProperty(window_title, cv2.WND_PROP_TOPMOST, 1)

    print("\n" + "="*60)
    print(" >> NATIVE HD PYTHON WEBCAM WINDOW IS NOW ACTIVE << ")
    print(" Controls:")
    print("   [C] or [SPACE] -> Biometric Check-In")
    print("   [O]            -> Biometric Check-Out")
    print("   [R]            -> Enroll / Register Face")
    print("   [Q] or [ESC]   -> Quit")
    print("="*60 + "\n")

    hud_banner = "Align your face with camera. Press [C] for Check-In"
    hud_banner_color = (0, 240, 180)
    hud_banner_timer = time.time() + 4.0

    prev_time = time.time()
    fps_display = "30 FPS"
    frame_counter = 0

    while True:
        ret, raw_frame = cap.read()
        if not ret or raw_frame is None:
            time.sleep(0.005)
            continue

        # Flip horizontally for natural mirror view
        raw_frame = cv2.flip(raw_frame, 1)

        # Unsharp Mask to remove camera sensor blur & make edges/face details sharp
        gaussian = cv2.GaussianBlur(raw_frame, (0, 0), 2.0)
        frame = cv2.addWeighted(raw_frame, 1.3, gaussian, -0.3, 0)
        h, w = frame.shape[:2]

        # Update latest frame for background AI thread
        with frame_lock:
            latest_raw_frame = raw_frame

        # FPS calculation every 10 frames
        frame_counter += 1
        if frame_counter >= 10:
            now = time.time()
            dt = now - prev_time
            if dt > 0:
                fps = frame_counter / dt
                fps_display = f"{fps:.1f} FPS"
            prev_time = now
            frame_counter = 0

        # Read latest tracked faces from background thread
        with ai_lock:
            current_tracked = list(tracked_faces)
            current_primary_emb = active_embedding

        # Draw futuristic face bounding boxes and labels
        for item in current_tracked:
            bbox = item["bbox"]
            label = item["label"]
            matched = item["matched"]

            # Choose box color: neon emerald for recognized, amber for unrecognized
            color = (40, 220, 100) if matched else (0, 165, 255)

            # Clamp coordinates to frame
            x1, y1 = max(0, bbox[0]), max(0, bbox[1])
            x2, y2 = min(w, bbox[2]), min(h, bbox[3])

            # Draw corner brackets / reticle
            corner_len = min(25, (x2 - x1) // 4)
            th = 2
            # Top-left
            cv2.line(frame, (x1, y1), (x1 + corner_len, y1), color, th)
            cv2.line(frame, (x1, y1), (x1, y1 + corner_len), color, th)
            # Top-right
            cv2.line(frame, (x2, y1), (x2 - corner_len, y1), color, th)
            cv2.line(frame, (x2, y1), (x2, y1 + corner_len), color, th)
            # Bottom-left
            cv2.line(frame, (x1, y2), (x1 + corner_len, y2), color, th)
            cv2.line(frame, (x1, y2), (x1, y2 - corner_len), color, th)
            # Bottom-right
            cv2.line(frame, (x2, y2), (x2 - corner_len, y2), color, th)
            cv2.line(frame, (x2, y2), (x2, y2 - corner_len), color, th)

            # Thin inner rectangle
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 1)

            # Label banner
            (tw, th_box), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_DUPLEX, 0.5, 1)
            badge_y1 = max(0, y1 - 22)
            cv2.rectangle(frame, (x1, badge_y1), (x1 + tw + 10, y1), color, -1)
            cv2.putText(frame, label, (x1 + 5, y1 - 6),
                        cv2.FONT_HERSHEY_DUPLEX, 0.5, (10, 15, 25), 1, cv2.LINE_AA)

        # ----------------------------------------------------
        # TOP HUD BAR: Title, Engine & Live FPS
        # ----------------------------------------------------
        cv2.rectangle(frame, (0, 0), (w, 36), (15, 20, 30), -1)
        cv2.putText(frame, "PeoplePay360 AI Biometrics", (12, 24),
                    cv2.FONT_HERSHEY_DUPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
        
        # FPS badge on top-right
        cv2.putText(frame, f"[ {fps_display} ]", (w - 110, 24),
                    cv2.FONT_HERSHEY_DUPLEX, 0.52, (0, 255, 180), 1, cv2.LINE_AA)

        # ----------------------------------------------------
        # BOTTOM HUD BAR: Controls & Action Notification
        # ----------------------------------------------------
        cv2.rectangle(frame, (0, h - 52), (w, h), (15, 20, 30), -1)
        cv2.line(frame, (0, h - 52), (w, h - 52), (50, 60, 80), 1)

        # Check if banner expired
        if time.time() > hud_banner_timer:
            hud_banner = "[C] Check-In   |   [O] Check-Out   |   [R] Register   |   [Q] Quit"
            hud_banner_color = (190, 200, 210)

        cv2.putText(frame, hud_banner, (15, h - 18),
                    cv2.FONT_HERSHEY_DUPLEX, 0.52, hud_banner_color, 1, cv2.LINE_AA)

        # Display window
        cv2.imshow(window_title, frame)

        # Non-blocking key check for instantaneous responsiveness (1ms)
        key = cv2.waitKey(1) & 0xFF

        # Exit
        if key == ord('q') or key == ord('Q') or key == 27: # ESC
            break

        # Check-In: 'c', 'C', or SPACE
        elif key == ord('c') or key == ord('C') or key == 32:
            if current_primary_emb is not None:
                matched, rec, sim = match_face(current_primary_emb)
                if matched:
                    now = datetime.datetime.now()
                    date_str = now.strftime("%Y-%m-%d")
                    time_str = now.strftime("%I:%M:%S %p")
                    day_str = now.strftime("%A")
                    iso_now = now.strftime("%Y-%m-%dT%H:%M:%S")

                    parts = rec["name"].split(" ", 1)
                    first_name = parts[0]
                    last_name = parts[1] if len(parts) > 1 else ""

                    # Check if there is an OPEN (unfinished) session for this employee today
                    open_entry = None
                    for entry in ATTENDANCE_LOGS:
                        if entry.get("employeeNumber") == rec["employeeNumber"] and entry.get("date") == date_str:
                            if not entry.get("checkOut"):
                                open_entry = entry
                                break

                    active_id = None
                    if open_entry:
                        # Still open session: update checkIn timestamp
                        open_entry["checkIn"] = iso_now
                        open_entry["checkInTime"] = time_str
                        open_entry["matchConfidence"] = round(sim * 100, 1)
                        open_entry["status"] = "PRESENT"
                        active_id = open_entry.get("id")
                    else:
                        # Prior session completed or new scan: ALWAYS ADD A BRAND NEW ENTRY!
                        active_id = f"ATT-{int(time.time()*1000)}"
                        new_entry = {
                            "id": active_id,
                            "employee": {
                                "firstName": first_name,
                                "lastName": last_name,
                                "employeeNumber": rec["employeeNumber"]
                            },
                            "employeeNumber": rec["employeeNumber"],
                            "name": rec["name"],
                            "date": date_str,
                            "checkIn": iso_now,
                            "checkInTime": time_str,
                            "checkOut": "",
                            "checkOutTime": "",
                            "workedHours": 0.0,
                            "overtimeHours": 0.0,
                            "status": "PRESENT",
                            "actions": "",
                            "matchConfidence": round(sim * 100, 1)
                        }
                        ATTENDANCE_LOGS.insert(0, new_entry)

                    save_logs()
                    threading.Thread(
                        target=notify_backend_punch, 
                        args=(rec["employeeNumber"], "CHECK_IN", round(sim * 100, 1), active_id, time_str, iso_now), 
                        daemon=True
                    ).start()
                    role_tag = f" [{rec['role']}]" if rec.get('role') else ""
                    hud_banner = f"CHECK-IN SUCCESS: {rec['name']}{role_tag} at {time_str} ({day_str})"
                    hud_banner_color = (0, 255, 120) # bright green
                    hud_banner_timer = time.time() + 3.5
                    print(f"[ATTENDANCE] Checked IN: {rec['name']} - {rec.get('role', '')} ({rec['employeeNumber']}) on {day_str}, {date_str} at {time_str} - Match: {sim*100:.1f}%")
                else:
                    hud_banner = "Face not recognized. Press [R] to register!"
                    hud_banner_color = (0, 140, 255)
                    hud_banner_timer = time.time() + 3.0
            else:
                hud_banner = "No face detected in camera! Please look directly at lens."
                hud_banner_color = (0, 100, 255)
                hud_banner_timer = time.time() + 2.5

        # Check-Out: 'o' or 'O'
        elif key == ord('o') or key == ord('O'):
            if current_primary_emb is not None:
                matched, rec, sim = match_face(current_primary_emb)
                if matched:
                    now = datetime.datetime.now()
                    date_str = now.strftime("%Y-%m-%d")
                    time_str = now.strftime("%I:%M:%S %p")
                    day_str = now.strftime("%A")
                    iso_now = now.strftime("%Y-%m-%dT%H:%M:%S")

                    parts = rec["name"].split(" ", 1)
                    first_name = parts[0]
                    last_name = parts[1] if len(parts) > 1 else ""

                    # Find the most recent OPEN entry today for this employee
                    open_entry = None
                    for entry in ATTENDANCE_LOGS:
                        if entry.get("employeeNumber") == rec["employeeNumber"] and entry.get("date") == date_str:
                            if not entry.get("checkOut"):
                                open_entry = entry
                                break

                    active_id = None
                    worked_hours = 8.0
                    if open_entry:
                        open_entry["checkOut"] = iso_now
                        open_entry["checkOutTime"] = time_str
                        open_entry["matchConfidence"] = round(sim * 100, 1)
                        open_entry["status"] = "PRESENT"

                        # DYNAMIC TIME DIFFERENCE CALCULATION
                        if open_entry.get("checkIn"):
                            try:
                                ci_raw = open_entry["checkIn"]
                                if "T" in ci_raw:
                                    ci_dt = datetime.datetime.fromisoformat(ci_raw)
                                else:
                                    ci_dt = datetime.datetime.strptime(f"{open_entry['date']} {open_entry.get('checkInTime')}", "%Y-%m-%d %I:%M:%S %p")
                                diff_seconds = max(0, (now - ci_dt).total_seconds())
                                worked_hours = max(0.01, round(diff_seconds / 3600.0, 2))
                            except Exception:
                                worked_hours = 8.0
                        else:
                            ci_dt = now - datetime.timedelta(hours=8)
                            open_entry["checkIn"] = ci_dt.strftime("%Y-%m-%dT%H:%M:%S")
                            open_entry["checkInTime"] = ci_dt.strftime("%I:%M:%S %p")
                            worked_hours = 8.0

                        overtime_hours = max(0.0, round(worked_hours - 8.0, 2))
                        open_entry["workedHours"] = worked_hours
                        open_entry["overtimeHours"] = overtime_hours
                        active_id = open_entry.get("id")
                    else:
                        # If no open check-in today, create complete new record
                        ci_dt = now - datetime.timedelta(minutes=1)
                        worked_hours = 0.01
                        active_id = f"ATT-{int(time.time()*1000)}"
                        new_entry = {
                            "id": active_id,
                            "employee": {
                                "firstName": first_name,
                                "lastName": last_name,
                                "employeeNumber": rec["employeeNumber"]
                            },
                            "employeeNumber": rec["employeeNumber"],
                            "name": rec["name"],
                            "date": date_str,
                            "checkIn": ci_dt.strftime("%Y-%m-%dT%H:%M:%S"),
                            "checkInTime": ci_dt.strftime("%I:%M:%S %p"),
                            "checkOut": iso_now,
                            "checkOutTime": time_str,
                            "workedHours": worked_hours,
                            "overtimeHours": 0.0,
                            "status": "PRESENT",
                            "actions": "",
                            "matchConfidence": round(sim * 100, 1)
                        }
                        ATTENDANCE_LOGS.insert(0, new_entry)

                    save_logs()
                    threading.Thread(
                        target=notify_backend_punch, 
                        args=(rec["employeeNumber"], "CHECK_OUT", round(sim * 100, 1), active_id, time_str, iso_now, worked_hours), 
                        daemon=True
                    ).start()
                    role_tag = f" [{rec['role']}]" if rec.get('role') else ""
                    hud_banner = f"CHECK-OUT SUCCESS: {rec['name']}{role_tag} at {time_str} ({worked_hours} hrs)"
                    hud_banner_color = (255, 200, 0) # cyan/yellow
                    hud_banner_timer = time.time() + 3.5
                    print(f"[ATTENDANCE] Checked OUT: {rec['name']} - {rec.get('role', '')} ({rec['employeeNumber']}) on {day_str}, {date_str} at {time_str} | Worked: {worked_hours} hrs - Match: {sim*100:.1f}%")
                else:
                    hud_banner = "Face not recognized. Press [R] to register!"
                    hud_banner_color = (0, 140, 255)
                    hud_banner_timer = time.time() + 3.0
            else:
                hud_banner = "No face detected in camera!"
                hud_banner_color = (0, 100, 255)
                hud_banner_timer = time.time() + 2.5

        # Register: 'r' or 'R'
        elif key == ord('r') or key == ord('R'):
            if current_primary_emb is not None:
                emp_num = f"EMP-{len(REGISTERED_FACES)+1:03d}"
                name = f"User-{emp_num}"
                REGISTERED_FACES[emp_num] = {
                    "employeeNumber": emp_num,
                    "name": name,
                    "email": f"{emp_num.lower()}@peoplepay360.com",
                    "embedding": current_primary_emb,
                    "registeredAt": datetime.datetime.now().isoformat()
                }
                save_faces()
                hud_banner = f"✓ ENROLLED: Face registered as {name} ({emp_num})!"
                hud_banner_color = (0, 255, 120)
                hud_banner_timer = time.time() + 4.0
                print(f"[ENROLL] Enrolled new face as {name} ({emp_num})")
            else:
                hud_banner = "No face visible to register."
                hud_banner_color = (0, 100, 255)
                hud_banner_timer = time.time() + 2.5

    is_running = False
    cap.release()
    cv2.destroyAllWindows()
    print("[INFO] Webcam window closed. Attendance data saved.")


if __name__ == "__main__":
    main()