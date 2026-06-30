"""
Inv.bg API Integration for Official Electronic Invoices
Creates official invoices in the Bulgarian inv.bg system
"""
import os
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Inv.bg API Configuration
INVBG_API_URL = "https://api.inv.bg/v3"
INVBG_API_TOKEN = os.getenv("INVBG_API_TOKEN")

# VAT rate in Bulgaria
VAT_RATE = 20.0


class InvBgClient:
    """Client for inv.bg API"""
    
    def __init__(self, token: str = None):
        self.token = token or INVBG_API_TOKEN
        self.base_url = INVBG_API_URL
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Accept-Language": "bg"
        }
    
    async def _request(self, method: str, endpoint: str, data: dict = None) -> dict:
        """Make an async HTTP request to inv.bg API"""
        url = f"{self.base_url}{endpoint}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                if method.upper() == "GET":
                    response = await client.get(url, headers=self.headers, params=data)
                elif method.upper() == "POST":
                    response = await client.post(url, headers=self.headers, json=data)
                elif method.upper() == "PATCH":
                    response = await client.patch(url, headers=self.headers, json=data)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                
                if response.status_code == 204:
                    return {"success": True}
                
                return response.json()
                
            except httpx.HTTPStatusError as e:
                logger.error(f"Inv.bg API error: {e.response.status_code} - {e.response.text}")
                raise Exception(f"Inv.bg API error: {e.response.text}")
            except Exception as e:
                logger.error(f"Inv.bg request failed: {e}")
                raise
    
    async def get_firm_info(self) -> dict:
        """Get firm information"""
        return await self._request("GET", "/firm")
    
    async def get_next_invoice_number(self) -> int:
        """Get the next available invoice number"""
        result = await self._request("GET", "/invoices/number/free")
        return result.get("number", 1)
    
    async def get_payment_methods(self) -> list:
        """Get available payment methods"""
        return await self._request("GET", "/invoices/payment-methods")
    
    async def find_or_create_client(self, client_data: dict) -> int:
        """Find existing client by name/email or create new one"""
        # Search for existing client
        search_name = client_data.get("name", "")
        clients_response = await self._request("GET", "/clients", {"search": search_name})
        
        clients = clients_response.get("clients", [])
        for client in clients:
            if client.get("name") == search_name:
                return client.get("id")
        
        # Create new client if not found
        new_client = {
            "name": client_data.get("name", "Клиент"),
            "address": client_data.get("address", ""),
            "town": client_data.get("city", ""),
            "country": "BG",
            "email": client_data.get("email", ""),
            "is_person": True  # Physical person (not company)
        }
        
        result = await self._request("POST", "/clients", new_client)
        return result.get("id")
    
    async def create_invoice(
        self,
        order: dict,
        client_id: int = None,
        payment_method: str = "card"
    ) -> dict:
        """
        Create an official invoice in inv.bg
        
        Args:
            order: Order data with items, shipping_address, total, etc.
            client_id: Optional existing client ID
            payment_method: Payment method (card, cash, bank)
        
        Returns:
            Invoice data including ID and number
        """
        # Get or create client
        shipping_address = order.get("shipping_address", {})
        
        if not client_id:
            client_data = {
                "name": shipping_address.get("full_name", "Клиент"),
                "address": shipping_address.get("address", ""),
                "city": shipping_address.get("city", ""),
                "email": shipping_address.get("email", order.get("user_email", ""))
            }
            client_id = await self.find_or_create_client(client_data)
        
        # Build invoice items
        invoice_items = []
        for item in order.get("items", []):
            item_name = f"{item.get('brand', '')} {item.get('name', 'Артикул')}".strip()
            quantity = item.get("quantity", 1)
            price = float(item.get("price", 0))
            
            invoice_items.append({
                "name": item_name[:100],  # Max 100 chars
                "quantity": quantity,
                "quantity_unit": "бр.",
                "price": price,
                "vat_percent": VAT_RATE
            })
        
        # Add shipping cost as separate item if present
        shipping_cost = float(order.get("shipping_cost", 0))
        if shipping_cost > 0:
            invoice_items.append({
                "name": "Доставка / Shipping",
                "quantity": 1,
                "quantity_unit": "бр.",
                "price": shipping_cost,
                "vat_percent": VAT_RATE
            })
        
        # Handle discount
        discount_amount = float(order.get("discount_amount", 0))
        if discount_amount > 0:
            discount_code = order.get("discount_code", "DISCOUNT")
            invoice_items.append({
                "name": f"Отстъпка / Discount ({discount_code})",
                "quantity": 1,
                "quantity_unit": "бр.",
                "price": -discount_amount,  # Negative price for discount
                "vat_percent": VAT_RATE
            })
        
        # Map payment method
        payment_method_map = {
            "card": "card",
            "cod": "ondlv",  # On delivery
            "bank": "bank",
            "cash": "cash"
        }
        inv_payment_method = payment_method_map.get(payment_method, "card")
        
        # Build invoice payload
        order_number = order.get("order_number", str(order.get("_id", "")))
        
        invoice_data = {
            "type": "dan",  # "dan" = данъчна фактура (tax invoice)
            "client_id": client_id,
            "currency": "EUR",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "payment_method": inv_payment_method,
            "items": invoice_items,
            "note": f"Онлайн поръчка: {order_number}\nOnline order: {order_number}",
            "is_draft": False,  # Create as final invoice, not draft
            "send_email": False  # We'll send via our own email system
        }
        
        # Add tracking info if available
        tracking_number = order.get("tracking_number")
        if tracking_number:
            invoice_data["note"] += f"\nСпиди товарителница: {tracking_number}"
        
        logger.info(f"Creating inv.bg invoice for order {order_number}")
        
        result = await self._request("POST", "/invoices", invoice_data)
        
        invoice_id = result.get("id")
        invoice_number = result.get("number")
        
        logger.info(f"Created inv.bg invoice #{invoice_number} (ID: {invoice_id}) for order {order_number}")
        
        return {
            "success": True,
            "invoice_id": invoice_id,
            "invoice_number": invoice_number,
            "invoice_type": "dan",
            "total": result.get("payment_amount_total"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_invoice_pdf(self, invoice_id: int) -> bytes:
        """Download invoice as PDF"""
        url = f"{self.base_url}/invoices/{invoice_id}/pdf"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.content
    
    async def send_invoice_email(self, invoice_id: int, email: str) -> dict:
        """Send invoice via inv.bg email system"""
        data = {
            "emails": [email],
            "document_type": "invoices",
            "document_id": invoice_id
        }
        return await self._request("POST", "/emails/send", data)


# Singleton instance
_client: Optional[InvBgClient] = None


def get_invbg_client() -> InvBgClient:
    """Get or create inv.bg client instance"""
    global _client
    if _client is None:
        _client = InvBgClient()
    return _client


async def create_official_invoice(order: dict, payment_method: str = "card") -> dict:
    """
    Create an official invoice for an order using inv.bg
    
    Args:
        order: Order dictionary with items, shipping_address, total, etc.
        payment_method: Payment method (card, cod, bank)
    
    Returns:
        Invoice result with invoice_id, invoice_number, etc.
    """
    try:
        client = get_invbg_client()
        result = await client.create_invoice(order, payment_method=payment_method)
        return result
    except Exception as e:
        logger.error(f"Failed to create official invoice: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def get_invoice_pdf_bytes(invoice_id: int) -> Optional[bytes]:
    """Get invoice PDF as bytes"""
    try:
        client = get_invbg_client()
        return await client.get_invoice_pdf(invoice_id)
    except Exception as e:
        logger.error(f"Failed to get invoice PDF: {e}")
        return None
