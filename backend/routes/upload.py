"""
Image upload routes for KOSTIN E-commerce
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from utils.auth import get_current_user
from utils.cloudinary_utils import upload_image, delete_image
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/image")
async def upload_product_image(
    request: Request,
    file: UploadFile = File(...)
):
    """
    Upload a product image to Cloudinary
    Requires admin authentication
    """
    db = request.app.state.db
    
    # Check admin auth
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Check file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    # Upload to Cloudinary
    result = upload_image(contents, filename=file.filename)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Upload failed"))
    
    logger.info(f"Admin {user.get('email')} uploaded image: {result.get('public_id')}")
    
    return {
        "url": result.get("secure_url"),
        "public_id": result.get("public_id"),
        "width": result.get("width"),
        "height": result.get("height"),
        "format": result.get("format"),
        "size": result.get("bytes"),
    }


@router.delete("/image/{public_id:path}")
async def delete_product_image(
    request: Request,
    public_id: str
):
    """
    Delete a product image from Cloudinary
    Requires admin authentication
    """
    db = request.app.state.db
    
    # Check admin auth
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = delete_image(public_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete image")
    
    logger.info(f"Admin {user.get('email')} deleted image: {public_id}")
    
    return {"message": "Image deleted successfully"}
