from backend.app.services.compliance_service import evaluate_compliance


def test_empty_detection_results():
    supported_classes = ["Hardhat", "Mask", "Safety Vest", "Person"]
    detections = []
    
    result = evaluate_compliance(
        detections=detections,
        supported_classes=supported_classes,
        policy_required_categories=["helmet", "vest"]
    )
    
    assert result["status_label"] == "Insufficient Data"
    assert result["compliance_percentage"] is None
    assert "No workers or equipment" in result["formula"]


def test_compliant_detection_results():
    supported_classes = ["Hardhat", "Mask", "Safety Vest", "Person"]
    detections = [
        {"class_name": "Person", "confidence": 0.92, "is_ppe": False, "is_violation": False},
        {"class_name": "Hardhat", "confidence": 0.95, "is_ppe": True, "is_violation": False},
        {"class_name": "Safety Vest", "confidence": 0.89, "is_ppe": True, "is_violation": False}
    ]

    result = evaluate_compliance(
        detections=detections,
        supported_classes=supported_classes,
        policy_required_categories=["helmet", "vest"]
    )

    assert result["status_label"] == "Fully Compliant"
    assert result["compliance_percentage"] == 100.0
    assert result["numerator"] == 2
    assert result["denominator"] == 2
    assert len(result["missing_items"]) == 0


def test_missing_required_ppe_detection():
    supported_classes = ["Hardhat", "Mask", "Safety Vest", "Person"]
    # Worker detected with Hardhat, but NO vest detected
    detections = [
        {"class_name": "Person", "confidence": 0.90, "is_ppe": False, "is_violation": False},
        {"class_name": "Hardhat", "confidence": 0.95, "is_ppe": True, "is_violation": False}
    ]

    result = evaluate_compliance(
        detections=detections,
        supported_classes=supported_classes,
        policy_required_categories=["helmet", "vest"]
    )

    assert result["status_label"] == "Safety Violations Detected"
    assert result["compliance_percentage"] == 50.0  # 1 out of 2
    assert result["numerator"] == 1
    assert result["denominator"] == 2
    assert any("Vest" in m for m in result["missing_items"])


def test_direct_negative_violation_class():
    supported_classes = ["Hardhat", "Mask", "NO-Hardhat", "Safety Vest", "Person"]
    # Model explicitly detected NO-Hardhat
    detections = [
        {"class_name": "Person", "confidence": 0.91, "is_ppe": False, "is_violation": False},
        {"class_name": "NO-Hardhat", "confidence": 0.88, "is_ppe": False, "is_violation": True},
        {"class_name": "Safety Vest", "confidence": 0.86, "is_ppe": True, "is_violation": False}
    ]

    result = evaluate_compliance(
        detections=detections,
        supported_classes=supported_classes,
        policy_required_categories=["helmet", "vest"]
    )

    assert result["status_label"] == "Safety Violations Detected"
    assert len(result["direct_violations"]) == 1
    assert "NO-Hardhat" in result["direct_violations"]
    assert any("NO-Hardhat" in m for m in result["missing_items"])
