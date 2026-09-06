import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.database import crud
from backend.domain.models import EvalResult, Query
from backend.api.schemas.document_schemas import EvalResultCreate, EvalResultResponse

router = APIRouter(prefix="/eval", tags=["eval"])


@router.post("", response_model=EvalResultResponse, status_code=status.HTTP_201_CREATED)
def create_eval_result(payload: EvalResultCreate, db: Session = Depends(get_db)):
    """Log an evaluation benchmark result."""
    eval_id = str(uuid.uuid4())
    eval_domain = EvalResult(
        id=eval_id,
        query=Query(text=payload.query_text, filters=payload.query_filters),
        retrieved_ids=payload.retrieved_ids,
        score=payload.score,
        correct=payload.correct,
        notes=payload.notes,
    )
    db_eval = crud.create_eval_result(db, eval_domain)
    return db_eval


@router.get("", response_model=List[EvalResultResponse])
def list_eval_results(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List evaluation history results."""
    return crud.list_eval_results(db, skip=skip, limit=limit)
