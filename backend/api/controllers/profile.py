from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_current_user
from backend.database.database import get_db
from backend.database.models import UserModel
from backend.storage.minio_client import (
    PROFILE_PICTURES_BUCKET,
    minio_storage,
)


router = APIRouter(
    prefix="/profile",
    tags=["profile"],
)


ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024


def _profile_object_key(value: str) -> str:
    prefix = f"{PROFILE_PICTURES_BUCKET}/"
    if value.startswith(prefix):
        return value[len(prefix):]
    return value


@router.post("/picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile picture must be JPG, PNG, or WebP.",
        )

    data = await file.read()

    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile picture cannot be empty.",
        )

    if len(data) > MAX_PROFILE_PICTURE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Profile picture must be 5 MB or smaller.",
        )

    user = (
        db.query(UserModel)
        .filter(UserModel.id == user_id)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    extension = ALLOWED_CONTENT_TYPES[file.content_type]
    object_name = f"users/{user.id}/profile{extension}"

    old_key = (
        _profile_object_key(user.profile_picture_key)
        if user.profile_picture_key
        else None
    )

    try:
        minio_storage.upload_bytes(
            PROFILE_PICTURES_BUCKET,
            object_name,
            data,
            content_type=file.content_type,
        )

        user.profile_picture_key = object_name
        db.commit()
        db.refresh(user)

        if old_key and old_key != stored_key:
            try:
                minio_storage.delete_object(
                    PROFILE_PICTURES_BUCKET,
                    old_key,
                )
            except Exception:
                # The database now points to the new image.
                # Failure to remove the old object should not
                # make the successful upload fail.
                pass

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store profile picture.",
        ) from exc

    return {
        "message": "Profile picture updated successfully.",
        "profile_picture_key": user.profile_picture_key,
    }


@router.get("/picture")
def get_profile_picture(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(UserModel)
        .filter(UserModel.id == user_id)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if not user.profile_picture_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile picture not found.",
        )

    try:
        object_key = _profile_object_key(user.profile_picture_key)

        image_data = minio_storage.download_bytes(
            PROFILE_PICTURES_BUCKET,
            object_key,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile picture not found.",
        ) from exc

    object_key = _profile_object_key(user.profile_picture_key)
    extension = object_key.rsplit(".", 1)[-1].lower()

    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }

    return Response(
        content=image_data,
        media_type=content_types.get(
            extension,
            "application/octet-stream",
        ),
        headers={
            "Cache-Control": "private, max-age=300",
        },
    )


@router.delete("/picture")
def delete_profile_picture(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(UserModel)
        .filter(UserModel.id == user_id)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    old_key = (
        _profile_object_key(user.profile_picture_key)
        if user.profile_picture_key
        else None
    )

    if not old_key:
        return {
            "message": "No profile picture to delete.",
        }

    try:
        minio_storage.delete_object(
            PROFILE_PICTURES_BUCKET,
            old_key,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete profile picture.",
        ) from exc

    user.profile_picture_key = None
    db.commit()

    return {
        "message": "Profile picture deleted successfully.",
    }
