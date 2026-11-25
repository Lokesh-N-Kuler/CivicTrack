from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.department import Department
from app.schemas.department import DepartmentResponse, DepartmentCreate, DepartmentUpdate
from app.schemas.complaint import DepartmentRecommendationResponse
from app.services.routing_engine import recommend_department

router = APIRouter()


@router.get("/recommend", response_model=DepartmentRecommendationResponse)
def get_department_recommendation(
    category: str = Query(..., description="Grievance category identifier"),
    context: Optional[str] = Query(None, description="Optional extra text or title for context"),
    db: Session = Depends(get_db)
):
    recommendation = recommend_department(db=db, category=category, text_context=context)
    return DepartmentRecommendationResponse(
        category=category,
        department_id=recommendation["department_id"],
        department_name=recommendation["department_name"],
        department_slug=recommendation["department_slug"],
        explanation=recommendation["explanation"]
    )


@router.get("", response_model=List[DepartmentResponse])
def list_departments(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Department)
    if is_active is not None:
        query = query.filter(Department.is_active == is_active)
    return query.order_by(Department.name.asc()).all()


@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: int,
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")
    return dept


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Department).filter(
        (Department.name == dept_in.name) | (Department.slug == dept_in.slug)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department with this name or slug already exists.")

    new_dept = Department(**dept_in.model_dump())
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept


@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    dept_in: DepartmentUpdate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")

    for field, value in dept_in.model_dump(exclude_unset=True).items():
        setattr(dept, field, value)

    db.commit()
    db.refresh(dept)
    return dept
