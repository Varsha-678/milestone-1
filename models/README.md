# SafeSight AI — Model Management & Weights Guide

This directory holds the YOLOv8 model weights utilized by the SafeSight AI computer vision pipeline.

## Default Model Location

- **Target Path:** `models/ppe_best.pt`
- **Environment Variable:** `PPE_MODEL_PATH` in `.env` (defaults to `models/ppe_best.pt`)

---

## 1. Provided Model Weights (`models/ppe_best.pt`)

The system comes pre-configured with a YOLOv8 PPE detection model trained on workplace safety datasets.

### Supported Classes:
1. `Hardhat` (Safety Helmet — Compliant PPE)
2. `Mask` (Safety Face Mask — Compliant PPE)
3. `Safety Vest` (High-Visibility Safety Vest — Compliant PPE)
4. `NO-Hardhat` (Direct Violation — Missing Helmet)
5. `NO-Mask` (Direct Violation — Missing Mask)
6. `NO-Safety Vest` (Direct Violation — Missing Vest)
7. `Person` (Worker / Pedestrian)
8. `Safety Cone` (Traffic & Hazard Cone)
9. `machinery` (Industrial Machinery)
10. `vehicle` (Construction & Warehouse Vehicles)

---

## 2. Using Custom or Additional Weights

If you have trained a custom YOLOv8 model (e.g., using Roboflow or Kaggle PPE datasets that include gloves, goggles, or safety boots):

1. Export or copy your PyTorch model file (e.g., `best.pt`) into this directory:
   ```bash
   copy /path/to/your_model.pt models/ppe_best.pt
   ```
2. Or configure a custom path in your `.env`:
   ```bash
   PPE_MODEL_PATH=models/my_custom_ppe_model.pt
   ```
3. Restart the backend service. SafeSight AI dynamically inspects `model.names` at startup and maps compliant PPE classes, direct violations, and contextual classes automatically.

---

## 3. Fallback & Safe Degradation

If no valid model weights are found at the configured path:
- The backend will **not crash**.
- The `/api/health` endpoint will report `model_loaded: false` and `model_status: "Model weights not found at configured path"`.
- The web UI will inform the user that a model file must be placed in `models/` before inference can run.
- Upload, validation, database history, and navigation continue to function normally.
