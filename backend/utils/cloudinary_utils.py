"""
Cloudinary utility functions for KOSTIN E-commerce
Handles image uploads and transformations
"""
import cloudinary
import cloudinary.uploader
import os
import logging

logger = logging.getLogger(__name__)

# Configure Cloudinary from environment variables
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)


def upload_image(file_data: bytes, filename: str = None, folder: str = "kostin_products") -> dict:
    """
    Upload an image to Cloudinary
    
    Args:
        file_data: Image bytes
        filename: Optional filename for public_id
        folder: Cloudinary folder to upload to
    
    Returns:
        dict with secure_url, public_id, width, height, format, bytes
    """
    try:
        # Generate a public_id from filename if provided
        public_id = None
        if filename:
            # Remove extension and sanitize
            name = os.path.splitext(filename)[0]
            name = "".join(c if c.isalnum() or c in "-_" else "_" for c in name)
            public_id = f"{folder}/{name}"
        
        result = cloudinary.uploader.upload(
            file_data,
            folder=folder if not public_id else None,
            public_id=public_id,
            overwrite=True,
            resource_type="image",
            transformation=[
                {"quality": "auto", "fetch_format": "auto"}
            ]
        )
        
        logger.info(f"Image uploaded successfully: {result.get('public_id')}")
        
        return {
            "success": True,
            "secure_url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format"),
            "bytes": result.get("bytes"),
        }
        
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def delete_image(public_id: str) -> bool:
    """
    Delete an image from Cloudinary
    
    Args:
        public_id: The public ID of the image to delete
    
    Returns:
        True if successful, False otherwise
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        logger.error(f"Cloudinary delete failed: {e}")
        return False


def get_optimized_url(public_id: str, width: int = None, height: int = None) -> str:
    """
    Generate an optimized URL for an image
    
    Args:
        public_id: The public ID of the image
        width: Optional width to resize to
        height: Optional height to resize to
    
    Returns:
        Optimized image URL
    """
    transformations = {
        "fetch_format": "auto",
        "quality": "auto",
    }
    
    if width:
        transformations["width"] = width
        transformations["crop"] = "scale"
    if height:
        transformations["height"] = height
        transformations["crop"] = "scale"
    
    return cloudinary.CloudinaryImage(public_id).build_url(**transformations)
