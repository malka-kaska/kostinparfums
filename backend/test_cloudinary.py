#!/usr/bin/env python3
"""
Cloudinary Integration Test Script for KOSTIN
Tests upload, metadata retrieval, and image transformation
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api

# ============================================
# CLOUDINARY CONFIGURATION (inline credentials)
# ============================================
cloudinary.config(
    cloud_name="dqce6cuho",
    api_key="544739354554935",
    api_secret="v1H2dqudPJwvGfVBagzeyhaVY7s",
    secure=True
)

print("=" * 50)
print("CLOUDINARY INTEGRATION TEST")
print("=" * 50)

# ============================================
# 1. UPLOAD AN IMAGE
# ============================================
print("\n[1] Uploading sample image...")

# Using a sample image from Cloudinary's demo domain
sample_image_url = "https://res.cloudinary.com/demo/image/upload/sample.jpg"

upload_result = cloudinary.uploader.upload(
    sample_image_url,
    folder="kostin_test",  # Upload to a test folder
    public_id="test_image"  # Give it a specific public ID
)

secure_url = upload_result.get("secure_url")
public_id = upload_result.get("public_id")

print(f"✓ Image uploaded successfully!")
print(f"  Secure URL: {secure_url}")
print(f"  Public ID: {public_id}")

# ============================================
# 2. GET IMAGE DETAILS (METADATA)
# ============================================
print("\n[2] Fetching image metadata...")

resource = cloudinary.api.resource(public_id)

width = resource.get("width")
height = resource.get("height")
format_ = resource.get("format")
bytes_ = resource.get("bytes")

print(f"✓ Image metadata retrieved!")
print(f"  Width: {width}px")
print(f"  Height: {height}px")
print(f"  Format: {format_}")
print(f"  Size: {bytes_} bytes ({bytes_ / 1024:.2f} KB)")

# ============================================
# 3. TRANSFORM THE IMAGE
# ============================================
print("\n[3] Generating optimized image URL...")

# Build a transformed URL with:
# - f_auto: Automatically selects the best format (WebP, AVIF, etc.) based on browser support
# - q_auto: Automatically adjusts quality for optimal file size while maintaining visual quality
transformed_url = cloudinary.CloudinaryImage(public_id).build_url(
    fetch_format="auto",  # f_auto - automatic format selection
    quality="auto"        # q_auto - automatic quality optimization
)

print(f"✓ Transformed URL generated!")
print(f"  Original format: {format_}")
print(f"  Optimized URL will serve best format for your browser")

# ============================================
# FINAL SUCCESS MESSAGE
# ============================================
print("\n" + "=" * 50)
print("Done! Click link below to see optimized version of the image.")
print("Check the size and the format.")
print("=" * 50)
print(f"\n{transformed_url}\n")
