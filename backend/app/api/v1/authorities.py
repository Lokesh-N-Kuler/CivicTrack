from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.authority import AuthorityDirectory
from app.schemas.authority import AuthorityResponse, AuthorityCreate, AuthorityUpdate

router = APIRouter()


@router.get("", response_model=List[AuthorityResponse])
def list_authorities(
    department_id: Optional[int] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuthorityDirectory)
    if department_id:
        query = query.filter(AuthorityDirectory.department_id == department_id)
    if category:
        query = query.filter(AuthorityDirectory.supported_categories.ilike(f"%{category}%"))
    return query.order_by(AuthorityDirectory.name.asc()).all()


@router.get("/{authority_id}", response_model=AuthorityResponse)
def get_authority(
    authority_id: int,
    db: Session = Depends(get_db)
):
    auth = db.query(AuthorityDirectory).filter(AuthorityDirectory.id == authority_id).first()
    if not auth:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Authority record not found.")
    return auth


@router.post("", response_model=AuthorityResponse, status_code=status.HTTP_201_CREATED)
def create_authority(
    auth_in: AuthorityCreate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    new_auth = AuthorityDirectory(**auth_in.model_dump())
    db.add(new_auth)
    db.commit()
    db.refresh(new_auth)
    return new_auth


@router.put("/{authority_id}", response_model=AuthorityResponse)
def update_authority(
    authority_id: int,
    auth_in: AuthorityUpdate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    auth = db.query(AuthorityDirectory).filter(AuthorityDirectory.id == authority_id).first()
    if not auth:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Authority record not found.")

    for field, value in auth_in.model_dump(exclude_unset=True).items():
        setattr(auth, field, value)

    db.commit()
    db.refresh(auth)
    return auth
