#!/usr/bin/env python3
"""
KOSTIN Parfums — Cloudinary Creatives Uploader
Uploads all 15 generated Higgsfield creatives to Cloudinary and saves URLs in a JSON file.
"""
import os
import json
import logging
from pathlib import Path
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

def main():
    repo_root = Path(__file__).resolve().parent.parent
    load_dotenv(dotenv_path=repo_root / ".env")
    
    # Configure Cloudinary
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    
    if not all([cloud_name, api_key, api_secret]):
        logger.error("Cloudinary credentials missing from environment variables (.env).")
        sys.exit(1)
        
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )
    
    generated_dir = repo_root / "marketing" / "creatives" / "generated"
    if not generated_dir.exists():
        logger.error(f"Generated creatives directory does not exist: {generated_dir}")
        return
        
    logger.info("Scanning for generated creative files...")
    
    # File search mapping: folder to category/name
    creatives_to_upload = []
    for subfolder in ["ig_stories", "meta_briefs", "fb_ads"]:
        subfolder_path = generated_dir / subfolder
        if not subfolder_path.exists():
            continue
        for file_path in subfolder_path.glob("*.*"):
            if file_path.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp"]:
                creatives_to_upload.append((subfolder, file_path))
                
    logger.info(f"Found {len(creatives_to_upload)} creatives to upload.")
    
    results = {}
    
    for category, file_path in creatives_to_upload:
        filename = file_path.name
        rel_path = f"marketing/creatives/generated/{category}/{filename}"
        public_id = f"kostin_creatives/{category}/{file_path.stem}"
        
        logger.info(f"Uploading {rel_path} to Cloudinary public_id: {public_id}")
        
        try:
            with open(file_path, "rb") as f:
                upload_result = cloudinary.uploader.upload(
                    f.read(),
                    public_id=public_id,
                    overwrite=True,
                    resource_type="image",
                    transformation=[
                        {"quality": "auto", "fetch_format": "auto"}
                    ]
                )
                
            secure_url = upload_result.get("secure_url")
            logger.info(f"✓ Uploaded: {secure_url}")
            
            results[rel_path] = {
                "url": secure_url,
                "public_id": public_id,
                "category": category,
                "filename": filename,
                "local_path": str(file_path.resolve())
            }
        except Exception as e:
            logger.error(f"✗ Failed to upload {filename}: {e}")
            
    # Save results to JSON file
    output_json = generated_dir / "cloudinary_urls.json"
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    logger.info(f"✓ Cloudinary URLs saved to: {output_json}")
    print(f"\nUploaded {len(results)} of {len(creatives_to_upload)} assets.")

if __name__ == "__main__":
    import sys
    main()
