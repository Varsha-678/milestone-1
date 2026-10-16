from typing import List, Dict, Any, Optional


# Canonical category mappings matching common dataset labels
PPE_CATEGORY_ALIASES = {
    "helmet": ["hardhat", "helmet", "safety helmet"],
    "vest": ["safety vest", "vest", "high-vis vest"],
    "mask": ["mask", "face mask", "safety mask"],
    "gloves": ["glove", "gloves", "safety gloves"],
    "boots": ["boot", "boots", "shoes", "safety boots"]
}

DEFAULT_POLICY_REQUIRED = ["helmet", "vest"]


def evaluate_compliance(
    detections: List[Dict[str, Any]],
    supported_classes: List[str],
    policy_required_categories: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Evaluates PPE compliance based on visibly detected items and a configurable policy.
    
    Compliance Calculation:
    - Compliance Rate (%) = (Required Items Visibly Detected / Total Policy Items Evaluated) * 100
    - If no person or PPE is detected, reports 'Insufficient Data' to avoid false confidence.
    """
    if policy_required_categories is None:
        policy_required_categories = DEFAULT_POLICY_REQUIRED

    # Standardize policy category names
    norm_policy = [cat.lower().strip() for cat in policy_required_categories]

    # Check which policy items can actually be detected by the active model
    supported_lower = [c.lower() for c in supported_classes]
    
    evaluable_categories = []
    unsupported_categories = []

    for cat in norm_policy:
        aliases = PPE_CATEGORY_ALIASES.get(cat, [cat])
        if any(any(alias in supp for alias in aliases) for supp in supported_lower):
            evaluable_categories.append(cat)
        else:
            unsupported_categories.append(cat)

    # Detect workers or persons present
    has_person = any("person" in d["class_name"].lower() or "worker" in d["class_name"].lower() for d in detections)
    total_detections = len(detections)

    detected_required_items = []
    missing_items = []
    direct_violations = []

    # Check for direct negative classes (e.g. 'NO-Hardhat', 'NO-Safety Vest')
    for d in detections:
        cname = d["class_name"].lower()
        if d.get("is_violation", False):
            direct_violations.append(d["class_name"])
            if "hardhat" in cname or "helmet" in cname:
                missing_items.append("Safety Helmet (Direct violation observed: NO-Hardhat)")
            elif "vest" in cname:
                missing_items.append("Safety Vest (Direct violation observed: NO-Safety Vest)")
            elif "mask" in cname:
                missing_items.append("Safety Mask (Direct violation observed: NO-Mask)")

    # Check for compliant items detected
    for cat in evaluable_categories:
        aliases = PPE_CATEGORY_ALIASES.get(cat, [cat])
        found = any(
            d.get("is_ppe", False) and any(alias in d["class_name"].lower() for alias in aliases)
            for d in detections
        )
        if found:
            detected_required_items.append(cat.capitalize())
        else:
            if not any(cat in m.lower() for m in missing_items):
                missing_items.append(f"Possible missing {cat.capitalize()} (Not detected in frame)")

    numerator = len(detected_required_items)
    denominator = len(evaluable_categories)

    # Determine status and percentage
    if denominator == 0:
        status_label = "Insufficient Data"
        percentage = None
        formula_desc = "No required PPE categories are supported by the active model."
    elif total_detections == 0 and not has_person:
        status_label = "Insufficient Data"
        percentage = None
        formula_desc = "No workers or equipment detected in media."
    else:
        percentage = round((numerator / denominator) * 100.0, 1)
        formula_desc = f"({numerator} Detected / {denominator} Required Items) * 100 = {percentage}%"
        
        if len(direct_violations) > 0 or len(missing_items) > 0:
            status_label = "Safety Violations Detected"
        else:
            status_label = "Fully Compliant"

    return {
        "status_label": status_label,
        "compliance_percentage": percentage,
        "formula": formula_desc,
        "numerator": numerator,
        "denominator": denominator,
        "policy_required_items": [c.capitalize() for c in norm_policy],
        "evaluable_items": [c.capitalize() for c in evaluable_categories],
        "unsupported_policy_items": [c.capitalize() for c in unsupported_categories],
        "detected_required_items": detected_required_items,
        "missing_items": missing_items,
        "direct_violations": direct_violations,
        "total_ppe_detected": sum(1 for d in detections if d.get("is_ppe")),
        "total_violations_detected": len(direct_violations) + len([m for m in missing_items if "Direct" in m]),
        "worker_detected": has_person
    }
