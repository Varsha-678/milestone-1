# SafeSight AI: Intelligent PPE Detection and Workplace Safety Analyzer

**Milestone 1 — Workplace Safety Monitoring Web Application**

SafeSight AI is a full-stack, computer vision-based workplace safety auditing application designed for industrial environments, construction facilities, and manufacturing sites. The system accepts workplace imagery or video feeds, performs deep server-side validation, runs YOLOv8 object detection on site equipment, evaluates compliance against safety policies, and produces persistent inspection records and downloadable safety analysis reports.

---

## 1. Key Implemented Features

- **Single-File Validation Pipeline:**
  - Strict server-side verification of magic bytes, image headers, decompression integrity, and video container decodability.
  - Supported image formats: **JPG, JPEG, PNG, WEBP**.
  - Supported video formats: **MP4, AVI, MOV**.
  - Maximum upload size configurable via environment variable (default: **50 MB**).
  - Rejection of oversized files, corrupted images, unreadable video codecs, empty files, and directory traversal attempts (`../../`).

- **YOLOv8 Computer Vision Pipeline:**
  - Loads real PyTorch model weights (`models/ppe_best.pt`) once on startup and reuses the model across inference requests.
  - Dynamically extracts class mappings from `model.names`.
  - Non-fabricating detection: only reports classes actually recognized by active model weights.
  - Bounding box rendering with confidence percentages and color-coded status badges:
    - **Green (#16a34a):** Compliant PPE (Safety Helmet / Hardhat, High-Visibility Vest, Safety Mask).
    - **Red (#dc2626):** Direct negative violations (NO-Hardhat, NO-Safety Vest, NO-Mask).
    - **Blue (#0284c7):** Worker / Person context.
    - **Slate (#64748b):** Machinery, vehicles, and hazardous cones.
  - Configurable detection confidence threshold slider (10% to 80%).

- **Video Keyframe Analysis Engine:**
  - Periodic keyframe sampling via OpenCV at configurable intervals (default: 1.0 second).
  - Background asynchronous task execution via FastAPI `BackgroundTasks`.
  - Interactive Frame-by-Frame Results Gallery in the UI displaying timestamps, frame thumbnails, bounding boxes, and per-frame compliance breakdown.
  - Video stream metadata extraction: resolution, framerate, total frames, duration, and analyzed keyframe count.

- **Configurable PPE Compliance Policy:**
  - Customizable site policy checklist (Safety Helmet, Safety Vest, Safety Mask).
  - Explicit compliance formula:
    $$\text{Compliance Rate (\%)} = \left(\frac{\text{Detected Required Categories}}{\text{Evaluated Policy Categories}}\right) \times 100$$
  - Handles missing equipment as "Possible missing PPE / Not detected in frame" rather than asserting false certainty.
  - Transparent status reporting: Outputs **"Insufficient Data"** when media contains no visible workers or equipment.

- **Persistent Database & Storage:**
  - SQLite database managed via SQLAlchemy (`safesight.db`).
  - Persistent job statuses: `Uploaded`, `Processing`, `Completed`, `Failed`.
  - Failed jobs record error messages and do not remain stuck in `Processing`.
  - Media uploads, annotated results, and HTML reports stored safely in separate directories with path boundary verification.

- **Downloadable Inspection Reports:**
  - Generates standalone, self-contained HTML reports with print/PDF layout.
  - Includes analysis record ID, timestamps, media metadata, class breakdown, formula documentation, and statutory safety disclaimers.

- **Modern Industrial Dashboard UI:**
  - Clean, light aesthetics with dark green / teal accents (#0f766e).
  - Interactive charts via Recharts (Compliance Breakdown Donut and PPE Class Detection Bar Chart).
  - Real-time model status banner.
  - Searchable and filterable history table with direct result viewing and safe file deletion.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 19 with Vite 8
- **Language:** JavaScript (ESNext)
- **Styling:** Tailwind CSS 4 with custom industrial safety design system
- **Data Visualization:** Recharts
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.12+)
- **Server:** Uvicorn ASGI
- **Computer Vision:** Ultralytics YOLOv8 & OpenCV (cv2)
- **Image Processing:** Pillow (PIL)
- **Database:** SQLite with SQLAlchemy ORM
- **Testing:** Pytest & FastAPI TestClient

---

## 3. Project Structure

```text
infosys mile1/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py            # REST API endpoints (/health, /analyze, /jobs, /report)
│   │   ├── database/
│   │   │   ├── models.py            # SQLAlchemy AnalysisJob database model
│   │   │   └── session.py           # Database engine & session maker
│   │   ├── schemas/
│   │   │   └── job_schemas.py       # Pydantic schemas & response models
│   │   ├── services/
│   │   │   ├── compliance_service.py # PPE compliance logic & formula evaluation
│   │   │   ├── report_service.py    # Self-contained HTML report generator
│   │   │   ├── video_service.py     # OpenCV video keyframe extraction & analysis
│   │   │   └── yolo_service.py      # Ultralytics YOLO model manager & bounding boxes
│   │   ├── utils/
│   │   │   ├── file_validator.py    # Deep file validation & security checks
│   │   │   └── security.py          # Filename sanitization & path traversal prevention
│   │   ├── config.py                # Environment configuration & directories
│   │   └── main.py                  # FastAPI application entrypoint & static mounting
│   ├── tests/
│   │   ├── test_api.py              # API endpoint & workflow integration tests
│   │   ├── test_compliance.py       # Compliance calculation & policy unit tests
│   │   └── test_validation.py       # File validation & security tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Responsive header with live model status
│   │   │   ├── ResultsViewer.jsx    # Annotated visualizer & video frame gallery
│   │   │   ├── StatCard.jsx         # KPI summary card component
│   │   │   └── UploadCard.jsx       # Single-file upload & policy selector
│   │   ├── pages/
│   │   │   ├── AboutPage.jsx        # Project overview, model guide & workflow
│   │   │   ├── DashboardPage.jsx    # KPI metrics & Recharts analytics
│   │   │   ├── HistoryPage.jsx      # Filterable database inspection records
│   │   │   └── UploadPage.jsx       # Media inspection submission page
│   │   ├── services/
│   │   │   └── api.js               # Frontend fetch client
│   │   ├── App.jsx                  # Main application orchestrator
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js               # Vite config with backend proxy setup
├── models/
│   ├── ppe_best.pt                  # Pre-configured YOLOv8 PPE detection weights
│   ├── yolov8n.pt                   # Base fallback model
│   └── README.md                    # Model documentation & custom weights guide
├── reports/                         # Generated HTML inspection reports
├── results/                         # Annotated output images & video keyframes
├── uploads/                         # Stored uploaded media
├── .env.example                     # Environment configuration template
├── README.md                        # Project documentation
└── safesight.db                     # Persistent SQLite database
```

---

## 4. Setup and Installation Instructions (Windows)

### Prerequisites
1. **Python 3.10+** (Python 3.12 recommended)
2. **Node.js 18+** (Node.js 20+ recommended)
3. **Git**

---

### Step 1: Backend Setup

Open a terminal (PowerShell or Command Prompt) in the project root directory:

```powershell
# Navigate to project root
cd "c:\Users\VARSHA K\Desktop\infosys mile1"

# Create a Python virtual environment (optional but recommended)
python -m venv venv
.\venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

---

### Step 2: Environment Configuration

Create a `.env` file from `.env.example`:

```powershell
copy .env.example .env
```

Default configuration in `.env`:
```ini
PPE_MODEL_PATH=models/ppe_best.pt
DEFAULT_CONF_THRESHOLD=0.25
MAX_UPLOAD_SIZE_MB=50
VIDEO_SAMPLE_INTERVAL_SECONDS=1.0
PORT=8000
HOST=127.0.0.1
DATABASE_URL=sqlite:///./safesight.db
```

---

### Step 3: Frontend Setup

In a new terminal window:

```powershell
# Navigate to frontend directory
cd "c:\Users\VARSHA K\Desktop\infosys mile1\frontend"

# Install frontend dependencies
npm install
```

---

## 5. Running the Application

### 1. Start the FastAPI Backend

From the project root:

```powershell
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify backend health at: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
FastAPI Interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Start the React Frontend

In the frontend terminal:

```powershell
cd frontend
npm run dev
```

Open your web browser and navigate to: [http://localhost:5173](http://localhost:5173)

---

## 6. Running Automated Tests

SafeSight AI includes an automated test suite containing **28 tests** covering all 20 required milestone verification scenarios:

```powershell
python -m pytest backend/tests -v
```

### Verified Test Cases:
1. `test_health_endpoint`: Backend operational status and model readiness.
2. `test_analyze_valid_jpg`: Valid JPEG image upload, inference, and report generation.
3. `test_analyze_valid_png`: Valid PNG upload and processing.
4. `test_analyze_valid_webp`: Valid WEBP upload and processing.
5. `test_analyze_valid_video`: Valid MP4 video upload and asynchronous keyframe processing.
6. `test_analyze_unsupported_format`: Rejection of unsupported file extensions (e.g. `.exe`, `.py`).
7. `test_analyze_empty_file`: Rejection of 0-byte uploads.
8. `test_analyze_corrupted_image`: Deep Pillow validation rejecting malformed byte payloads.
9. `test_oversized_file`: Server-side enforcement of 50 MB upload ceiling.
10. `test_safe_filenames_and_paths`: Sanitization of path traversal (`../../etc/passwd`) and UUID isolation.
11. `test_missing_model_weights_handling`: Safe degradation when model weights are missing without crashing.
12. `test_failed_processing_status_handling`: Verification that failed jobs receive status `Failed` and error details.
13. `test_empty_detection_results`: Compliance evaluation returns `Insufficient Data` for empty scenes.
14. `test_compliant_detection_results`: 100% compliance score calculation when required PPE is visible.
15. `test_missing_required_ppe_detection`: Accurate violation identification and percentage reduction for absent PPE.
16. `test_direct_negative_violation_class`: Detection of negative violation classes (`NO-Hardhat`).
17. `test_valid_video_file_check`: OpenCV verification of video container, frame rate, and frame dimensions.
18. `test_video_no_readable_frames_or_invalid`: Error handling for unreadable video streams.
19. `test_jobs_history_and_deletion`: Record persistence, listing, single-job retrieval, and safe file cleanup.
20. `test_database_persistence_across_sessions`: SQLite database state preserved across application restarts.

---

## 7. Model Weights & Classes

The system includes pre-trained YOLOv8 weights located at `models/ppe_best.pt`.

### Active Model Classes (10 Categories):
1. `Hardhat` — Compliant Safety Helmet
2. `Mask` — Compliant Safety Face Mask
3. `Safety Vest` — Compliant High-Visibility Vest
4. `NO-Hardhat` — Direct Violation (Worker without helmet)
5. `NO-Mask` — Direct Violation (Worker without mask)
6. `NO-Safety Vest` — Direct Violation (Worker without vest)
7. `Person` — Site Worker / Pedestrian Context
8. `Safety Cone` — Traffic / Hazard Boundary Cone
9. `machinery` — Industrial Plant Machinery
10. `vehicle` — Construction & Warehouse Vehicle

### Adding Custom Weights (e.g. Boots & Gloves):
1. Copy your trained `.pt` file into `models/` (e.g. `models/custom_ppe.pt`).
2. Update `PPE_MODEL_PATH=models/custom_ppe.pt` in `.env`.
3. Restart the backend server. SafeSight AI will inspect `model.names` and adapt detection categories automatically.

---

## 8. Safety & Compliance Disclaimer

SafeSight AI is an automated decision-support system designed to augment safety audits and inspection workflows. Computer vision inferences are probabilistic and dependent on camera angles, scene illumination, and equipment occlusion. SafeSight AI outputs do not replace qualified human safety officers or statutory Occupational Safety and Health Administration (OSHA) site inspections.
