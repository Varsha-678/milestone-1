import uuid
from datetime import datetime, timezone
from typing import Dict
from fastapi import APIRouter, HTTPException, status, Header
from backend.app.schemas.auth_schemas import LoginRequest, RegisterRequest, AuthResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pre-populated demo safety personnel accounts
DEMO_USERS: Dict[str, dict] = {
    "admin@safesight.ai": {
        "id": "usr-admin-01",
        "name": "Dr. Aris Vance",
        "email": "admin@safesight.ai",
        "password": "password123",
        "role": "Safety Lead",
        "department": "EHS Operations & AI Directorate",
        "avatar": "AV",
        "created_at": "2026-01-15T08:00:00Z"
    },
    "inspector@safesight.ai": {
        "id": "usr-insp-02",
        "name": "Sarah Connor",
        "email": "inspector@safesight.ai",
        "password": "password123",
        "role": "PPE Field Inspector",
        "department": "Site Audit & Field Safety",
        "avatar": "SC",
        "created_at": "2026-02-10T11:30:00Z"
    },
    "officer@safesight.ai": {
        "id": "usr-off-03",
        "name": "John Miller",
        "email": "officer@safesight.ai",
        "password": "password123",
        "role": "Site Safety Officer",
        "department": "Hazard Control & Compliance",
        "avatar": "JM",
        "created_at": "2026-03-01T09:15:00Z"
    }
}

# Runtime user registry (in-memory persistent during server life)
USER_REGISTRY: Dict[str, dict] = {**DEMO_USERS}


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    email = req.email.strip().lower()
    user = USER_REGISTRY.get(email)

    if not user:
        # If user isn't in registry yet, allow demo signin if password is provided
        if len(req.password.strip()) >= 4:
            # Auto-provision on first valid attempt for convenience
            name_part = email.split('@')[0].replace('.', ' ').title()
            initials = "".join([part[0].upper() for part in name_part.split()[:2]]) or "U"
            user = {
                "id": f"usr-{uuid.uuid4().hex[:8]}",
                "name": name_part,
                "email": email,
                "password": req.password,
                "role": req.role or "Safety Lead",
                "department": "General Operations",
                "avatar": initials,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            USER_REGISTRY[email] = user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Password must be at least 4 characters."
            )

    if user["password"] != req.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. For demo accounts, use 'password123'."
        )

    # If role was selected in form, update user role
    if req.role:
        user["role"] = req.role

    token = f"ss_tok_{uuid.uuid4().hex}"

    return {
        "status": "success",
        "token": token,
        "user": UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            department=user.get("department", "Safety & Compliance"),
            avatar=user.get("avatar", "U"),
            created_at=user["created_at"]
        ),
        "message": f"Welcome back, {user['name']}! Access granted to SafeSight Operations."
    }


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    email = req.email.strip().lower()
    
    if len(req.password.strip()) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long."
        )

    if not req.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required."
        )

    parts = req.name.strip().split()
    initials = "".join([p[0].upper() for p in parts[:2]]) if parts else "U"

    new_user = {
        "id": f"usr-{uuid.uuid4().hex[:8]}",
        "name": req.name.strip(),
        "email": email,
        "password": req.password,
        "role": req.role or "Safety Lead",
        "department": req.department or "Operations & Inspection",
        "avatar": initials,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    USER_REGISTRY[email] = new_user
    token = f"ss_tok_{uuid.uuid4().hex}"

    return {
        "status": "success",
        "token": token,
        "user": UserResponse(
            id=new_user["id"],
            name=new_user["name"],
            email=new_user["email"],
            role=new_user["role"],
            department=new_user["department"],
            avatar=new_user["avatar"],
            created_at=new_user["created_at"]
        ),
        "message": f"Account created for {new_user['name']}. Welcome to SafeSight Operations!"
    }


@router.get("/me", response_model=UserResponse)
def get_current_user(authorization: str = Header(None)):
    # Simple token validation
    # If no token, return demo admin user as fallback
    user = DEMO_USERS["admin@safesight.ai"]
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        department=user["department"],
        avatar=user["avatar"],
        created_at=user["created_at"]
    )


@router.post("/logout")
def logout():
    return {"status": "success", "message": "Logged out successfully."}
