"""
НЕкоректен.КОМ API Integration
Checks customers against the nekorekten.com database of unreliable buyers.
Used to identify customers who don't pay COD orders, return items frequently, etc.
"""

import httpx
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

NEKOREKTEN_API_URL = "https://api.nekorekten.com"
NEKOREKTEN_API_KEY = os.environ.get("NEKOREKTEN_API_KEY", "")


async def check_customer(
    phone: Optional[str] = None,
    email: Optional[str] = None,
    name: Optional[str] = None
) -> dict:
    """
    Check if a customer has reports in nekorekten.com database.
    
    Args:
        phone: Customer phone number (with country code, e.g., 359888123456)
        email: Customer email address
        name: Customer name
        
    Returns:
        dict with:
            - found: bool - whether reports were found
            - reports_count: int - number of reports
            - reports: list - list of report summaries
            - is_risky: bool - True if customer has reports (risky for COD)
    """
    if not NEKOREKTEN_API_KEY:
        logger.warning("NEKOREKTEN_API_KEY not configured, skipping check")
        return {
            "found": False,
            "reports_count": 0,
            "reports": [],
            "is_risky": False,
            "error": "API key not configured"
        }
    
    if not any([phone, email, name]):
        return {
            "found": False,
            "reports_count": 0,
            "reports": [],
            "is_risky": False,
            "error": "At least one search parameter required"
        }
    
    try:
        # Build query parameters
        params = {}
        if phone:
            # Clean phone number - remove spaces, dashes, and + prefix
            clean_phone = phone.replace(" ", "").replace("-", "").replace("+", "")
            # Ensure it starts with country code
            if clean_phone.startswith("0"):
                clean_phone = "359" + clean_phone[1:]
            params["phone"] = clean_phone
        if email:
            params["email"] = email
        if name:
            params["name"] = name
        
        # Use 'one-of' mode to match any of the provided filters
        params["searchMode"] = "one-of"
        
        headers = {
            "Api-Key": NEKOREKTEN_API_KEY
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{NEKOREKTEN_API_URL}/api/v1/reports",
                params=params,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                reports = data if isinstance(data, list) else data.get("reports", [])
                
                # Summarize reports
                report_summaries = []
                for report in reports[:5]:  # Limit to first 5 reports
                    report_summaries.append({
                        "id": report.get("id"),
                        "text": report.get("text", "")[:100] + "..." if len(report.get("text", "")) > 100 else report.get("text", ""),
                        "created_at": report.get("createdAt")
                    })
                
                is_risky = len(reports) > 0
                
                logger.info(f"Nekorekten check: phone={phone}, email={email}, found={len(reports)} reports")
                
                return {
                    "found": is_risky,
                    "reports_count": len(reports),
                    "reports": report_summaries,
                    "is_risky": is_risky
                }
            
            elif response.status_code == 429:
                logger.warning("Nekorekten API rate limit exceeded")
                return {
                    "found": False,
                    "reports_count": 0,
                    "reports": [],
                    "is_risky": False,
                    "error": "Rate limit exceeded"
                }
            
            else:
                logger.error(f"Nekorekten API error: {response.status_code} - {response.text}")
                return {
                    "found": False,
                    "reports_count": 0,
                    "reports": [],
                    "is_risky": False,
                    "error": f"API error: {response.status_code}"
                }
                
    except Exception as e:
        logger.error(f"Nekorekten API exception: {e}")
        return {
            "found": False,
            "reports_count": 0,
            "reports": [],
            "is_risky": False,
            "error": str(e)
        }


async def report_customer(
    phone: str,
    text: str,
    email: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None
) -> dict:
    """
    Report a customer to nekorekten.com database.
    Use this when a customer doesn't pay COD or returns items inappropriately.
    
    Args:
        phone: Customer phone number (required)
        text: Report description - what happened
        email: Customer email (optional)
        first_name: Customer first name (optional)
        last_name: Customer last name (optional)
        
    Returns:
        dict with success status
    """
    if not NEKOREKTEN_API_KEY:
        logger.warning("NEKOREKTEN_API_KEY not configured")
        return {"success": False, "error": "API key not configured"}
    
    if not phone or not text:
        return {"success": False, "error": "Phone and text are required"}
    
    try:
        # Clean phone number
        clean_phone = phone.replace(" ", "").replace("-", "").replace("+", "")
        if clean_phone.startswith("0"):
            clean_phone = "359" + clean_phone[1:]
        
        # Build request body
        body = {
            "phone": clean_phone,
            "text": text
        }
        if email:
            body["email"] = email
        if first_name:
            body["firstName"] = first_name
        if last_name:
            body["lastName"] = last_name
        
        headers = {
            "Api-Key": NEKOREKTEN_API_KEY,
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{NEKOREKTEN_API_URL}/api/v1/reports",
                json=body,
                headers=headers
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"Successfully reported customer to nekorekten: {clean_phone}")
                return {"success": True, "message": "Report submitted successfully"}
            else:
                logger.error(f"Failed to report to nekorekten: {response.status_code} - {response.text}")
                return {"success": False, "error": f"API error: {response.status_code}"}
                
    except Exception as e:
        logger.error(f"Nekorekten report exception: {e}")
        return {"success": False, "error": str(e)}
