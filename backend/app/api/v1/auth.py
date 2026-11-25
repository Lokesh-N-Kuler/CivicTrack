from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.rate_limiter import login_rate_limiter
from app.api.deps import get_current_user, get_client_ip
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    # Enforce role to citizen on public registration
    email_clean = user_in.email.lower().strip()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        email=email_clean,
        hashed_password=hashed_pw,
        full_name=user_in.full_name.strip(),
        phone_number=user_in.phone_number.strip() if user_in.phone_number else None,
        role="citizen",  # Public registration is always citizen
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    client_ip = get_client_ip(request)
    log_audit_event(
        db=db,
        action="REGISTER",
        resource_type="user",
        resource_id=str(new_user.id),
        user_id=new_user.id,
        details={"email": new_user.email, "role": new_user.role},
        ip_address=client_ip
    )

    access_token = create_access_token(subject=new_user.id, role=new_user.role)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
def login(
    user_credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = get_client_ip(request)
    rate_limit_key = f"{client_ip}:{user_credentials.email.lower()}"
    login_rate_limiter.check(rate_limit_key)

    user = db.query(User).filter(User.email == user_credentials.email.lower().strip()).first()
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        # Log failed attempt
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            resource_type="auth",
            details={"email": user_credentials.email.lower()},
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated/deleted. Please contact support to request restoration."
        )

    if user.is_blocked:
        reason = user.blocked_reason or "Violation of municipal civic service terms."
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your account has been blocked by an administrator. Reason: {reason}. Contact administrator at admin@civictrack.local for assistance."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled."
        )

    # Track last login timestamp
    from datetime import datetime, timezone
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    log_audit_event(
        db=db,
        action="LOGIN_SUCCESS",
        resource_type="user",
        resource_id=str(user.id),
        user_id=user.id,
        details={"role": user.role},
        ip_address=client_ip
    )

    access_token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log_audit_event(
        db=db,
        action="LOGOUT",
        resource_type="user",
        resource_id=str(current_user.id),
        user_id=current_user.id,
        ip_address=get_client_ip(request)
    )
    return {"message": "Logged out successfully."}
