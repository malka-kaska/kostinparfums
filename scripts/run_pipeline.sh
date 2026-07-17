#!/bin/bash
# KOSTIN Parfums — Creative Sync & Database Seeding Pipeline
# Runs the upload and database seeding scripts sequentially.

echo "=================================================="
echo "KOSTIN Parfums — Creative Sync & Seeding Pipeline"
echo "=================================================="

# 1. Validate environment
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one with your credentials."
  exit 1
fi

# 2. Upload creatives to Cloudinary
echo ""
echo "[Step 1/2] Uploading creatives to Cloudinary..."
python3 scripts/upload_creatives_to_cloudinary.py
if [ $? -ne 0 ]; then
  echo "Error: Cloudinary upload failed."
  exit 1
fi

# 3. Seed database
echo ""
echo "[Step 2/2] Seeding database collections..."
python3 scripts/seed_creatives_to_db.py
if [ $? -ne 0 ]; then
  echo "Warning: Database seeding failed (this is expected if your local IP is not whitelisted in MongoDB Atlas)."
  echo "To resolve this, add your current IP address to the Atlas Network Access Whitelist,"
  echo "or run this script on your production host (emergent.sh) where database access is configured."
fi

echo ""
echo "Pipeline completed!"
