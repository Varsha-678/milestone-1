import os
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import cv2

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

from backend.app.config import PPE_MODEL_PATH, DEFAULT_CONF_THRESHOLD


def compute_iou(box1: List[int], box2: List[int]) -> float:
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    if inter == 0:
        return 0.0
    a1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    a2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = a1 + a2 - inter
    return (inter / float(union)) if union > 0 else 0.0


def compute_ioa(box_inner: List[int], box_outer: List[int]) -> float:
    x1 = max(box_inner[0], box_outer[0])
    y1 = max(box_inner[1], box_outer[1])
    x2 = min(box_inner[2], box_outer[2])
    y2 = min(box_inner[3], box_outer[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    a_inner = (box_inner[2] - box_inner[0]) * (box_inner[3] - box_inner[1])
    return (inter / float(a_inner)) if a_inner > 0 else 0.0


def apply_nms(detections: List[Dict[str, Any]], iou_thresh: float = 0.35) -> List[Dict[str, Any]]:
    if not detections:
        return []
    sorted_dets = sorted(detections, key=lambda x: x["confidence"], reverse=True)
    kept = []
    for d in sorted_dets:
        box = d["box"]
        cls = d["class_name"].lower()
        duplicate = False
        for k in kept:
            k_cls = k["class_name"].lower()
            is_same_category = (cls == k_cls) or (
                ("mask" in cls and "mask" in k_cls) or
                ("helmet" in cls and "helmet" in k_cls) or
                ("hardhat" in cls and "hardhat" in k_cls) or
                ("vest" in cls and "vest" in k_cls)
            )
            if is_same_category:
                iou = compute_iou(box, k["box"])
                ioa = max(compute_ioa(box, k["box"]), compute_ioa(k["box"], box))
                if iou > iou_thresh or ioa > 0.60:
                    duplicate = True
                    break
            elif "person" in cls and "person" in k_cls:
                iou = compute_iou(box, k["box"])
                if iou > 0.50 or compute_ioa(box, k["box"]) > 0.70:
                    duplicate = True
                    break
        if not duplicate:
            kept.append(d)
    return kept


class YOLOModelManager:
    _instance: Optional["YOLOModelManager"] = None

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or PPE_MODEL_PATH
        self.model = None
        self.is_loaded = False
        self.error_message: Optional[str] = None
        self.names: Dict[int, str] = {}
        self.load_model()

    def load_model(self):
        """Attempts to load the configured YOLOv8 weights safely."""
        path = Path(self.model_path)
        if not path.is_file():
            self.is_loaded = False
            self.error_message = (
                f"Model weights not found at '{self.model_path}'. "
                f"Please ensure valid weights exist or configure PPE_MODEL_PATH in .env."
            )
            return

        if YOLO is None:
            self.is_loaded = False
            self.error_message = "Ultralytics package is not installed."
            return

        try:
            # Load PyTorch YOLO model weights
            self.model = YOLO(str(path))
            self.names = getattr(self.model, "names", {})
            self.is_loaded = True
            self.error_message = None
        except Exception as exc:
            self.is_loaded = False
            self.model = None
            self.error_message = f"Failed to initialize YOLO model: {str(exc)}"

    def classify_label(self, label: str) -> Tuple[bool, bool, str]:
        """
        Determines whether a detection is compliant PPE, a direct violation, or contextual.
        Returns: (is_ppe, is_violation, hex_color)
        """
        lower = label.lower().strip()
        
        # Direct Negative Violations
        if any(neg in lower for neg in ["no-", "no_", "without_", "missing_"]):
            return (False, True, "#dc2626")  # Red for violation
        
        # Compliant PPE
        if any(ppe in lower for ppe in ["hardhat", "helmet", "vest", "mask", "glove", "boot", "shoe", "goggle", "glass"]):
            return (True, False, "#16a34a")  # Green for compliant PPE
            
        # Contextual objects (Worker / Machinery / etc.)
        if "person" in lower or "worker" in lower:
            return (False, False, "#0284c7")  # Blue for worker
            
        return (False, False, "#64748b")  # Slate for other objects

    def get_supported_classes(self) -> List[str]:
        if not self.is_loaded or not self.names:
            return []
        return [self.names[k] for k in sorted(self.names.keys())]

    def predict(
        self,
        image_bgr: np.ndarray,
        conf_threshold: float = DEFAULT_CONF_THRESHOLD
    ) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Runs YOLOv8 object detection on a BGR image array.
        Returns (annotated_bgr_image, structured_detections_list).
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError(self.error_message or "PPE Model is not loaded.")

        if image_bgr is None or image_bgr.size == 0:
            raise ValueError("Input image array is empty or invalid.")

        # Execute prediction with tightened NMS iou threshold
        results = self.model.predict(
            source=image_bgr,
            conf=conf_threshold,
            iou=0.45,
            verbose=False
        )

        raw_detections: List[Dict[str, Any]] = []
        annotated_image = image_bgr.copy()

        if not results or len(results) == 0:
            return annotated_image, []

        res = results[0]
        boxes = res.boxes

        if boxes is None or len(boxes) == 0:
            return annotated_image, []

        h, w = image_bgr.shape[:2]

        for box in boxes:
            xyxy = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            cls_name = self.names.get(cls_id, f"class_{cls_id}")

            is_ppe, is_violation, hex_color = self.classify_label(cls_name)

            x1, y1, x2, y2 = [int(v) for v in xyxy]
            # Clamp coordinates to image boundaries
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w - 1, x2), min(h - 1, y2)

            raw_detections.append({
                "class_id": cls_id,
                "class_name": cls_name,
                "confidence": round(conf, 4),
                "box": [x1, y1, x2, y2],
                "is_ppe": is_ppe,
                "is_violation": is_violation,
                "color": hex_color
            })

        # Apply robust Non-Maximum Suppression to remove overlapping duplicate boxes
        detections = apply_nms(raw_detections, iou_thresh=0.35)

        # Draw deduplicated crisp bounding boxes on annotated_image
        for d in detections:
            x1, y1, x2, y2 = d["box"]
            cls_name = d["class_name"]
            conf = d["confidence"]
            hex_color = d["color"]

            # Convert hex color to BGR for OpenCV
            hex_clean = hex_color.lstrip("#")
            rgb = tuple(int(hex_clean[i:i+2], 16) for i in (0, 2, 4))
            bgr = (rgb[2], rgb[1], rgb[0])

            # Draw crisp bounding box
            cv2.rectangle(annotated_image, (x1, y1), (x2, y2), bgr, 2)

            # Draw label banner
            label_text = f"{cls_name} {int(conf * 100)}%"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.55
            thickness = 1
            (text_w, text_h), baseline = cv2.getTextSize(label_text, font, font_scale, thickness)

            # Background rectangle for text
            text_bg_y1 = max(0, y1 - text_h - 8)
            text_bg_y2 = y1
            cv2.rectangle(
                annotated_image,
                (x1, text_bg_y1),
                (x1 + text_w + 10, text_bg_y2),
                bgr,
                -1
            )
            # White text
            cv2.putText(
                annotated_image,
                label_text,
                (x1 + 5, y1 - 4),
                font,
                font_scale,
                (255, 255, 255),
                thickness,
                lineType=cv2.LINE_AA
            )

        return annotated_image, detections


# Global Singleton Getter
_yolo_manager: Optional[YOLOModelManager] = None


def get_yolo_manager() -> YOLOModelManager:
    global _yolo_manager
    if _yolo_manager is None:
        _yolo_manager = YOLOModelManager()
    return _yolo_manager
