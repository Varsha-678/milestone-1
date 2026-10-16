import os
import re
import uuid
from pathlib import Path


def sanitize_filename(filename: str) -> str:
    """
    Strips directory separators and non-standard characters from filename.
    Preserves valid basename and extension.
    """
    if not filename:
        return "unnamed_file"

    # Extract basename only
    base = os.path.basename(filename)
    
    # Replace whitespace and unsafe characters with underscores
    clean_base = re.sub(r'[^a-zA-Z0-9_.-]', '_', base)
    
    # Avoid leading dots or hidden files
    clean_base = clean_base.lstrip('.')
    if not clean_base:
        return "file_" + uuid.uuid4().hex[:8]
    
    return clean_base


def generate_unique_filename(original_filename: str) -> str:
    """
    Produces a collision-free server filename with sanitized stem + UUID prefix.
    """
    sanitized = sanitize_filename(original_filename)
    ext = Path(sanitized).suffix.lower()
    stem = Path(sanitized).stem[:40]
    unique_id = uuid.uuid4().hex[:12]
    return f"{stem}_{unique_id}{ext}"


def is_safe_path(base_directory: Path, target_path: Path) -> bool:
    """
    Prevents path traversal attacks by ensuring target_path resolves strictly
    inside base_directory.
    """
    try:
        resolved_base = base_directory.resolve()
        resolved_target = target_path.resolve()
        return resolved_target.is_relative_to(resolved_base)
    except Exception:
        return False


def safe_delete_file(file_path: Path, allowed_roots: list[Path]) -> bool:
    """
    Safely removes a file only if it resides within one of the approved root directories.
    """
    try:
        if not file_path or not file_path.exists():
            return False

        resolved = file_path.resolve()
        is_allowed = any(
            is_safe_path(root, resolved) for root in allowed_roots
        )
        if is_allowed and resolved.is_file():
            resolved.unlink(missing_ok=True)
            return True
        elif is_allowed and resolved.is_dir():
            import shutil
            shutil.rmtree(resolved, ignore_errors=True)
            return True
        return False
    except Exception:
        return False
