import os
import asyncio
import logging
import resend
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """Send email using Resend API (non-blocking)"""
    params = {
        "from": f"KOSTIN <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully to {to_email}")
        return {"status": "success", "email_id": email.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"status": "error", "error": str(e)}


async def send_registration_email(to_email: str, user_name: str, lang: str = "bg"):
    """Send registration confirmation email"""
    
    if lang == "bg":
        subject = "Добре дошли в KOSTIN!"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #c9a86c;">
                <h1 style="font-size: 32px; font-weight: 300; letter-spacing: 8px; margin: 0; color: #1a1a1a;">KOSTIN</h1>
                <p style="font-size: 11px; letter-spacing: 3px; color: #666; margin-top: 8px;">LUXURY FRAGRANCES</p>
            </div>
            
            <div style="padding: 40px 20px;">
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 20px;">Добре дошли, {user_name}!</h2>
                
                <p>Благодарим Ви, че се регистрирахте в KOSTIN - Вашата дестинация за луксозни парфюми.</p>
                
                <p>С Вашия акаунт можете:</p>
                <ul style="color: #555;">
                    <li>Да разглеждате нашата селекция от над 200 луксозни аромата</li>
                    <li>Да запазвате любими продукти</li>
                    <li>Да проследявате поръчките си</li>
                    <li>Да получавате ексклузивни оферти</li>
                </ul>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="https://kostinparfums.com/products" 
                       style="display: inline-block; background: #1a1a1a; color: #fff; padding: 15px 40px; text-decoration: none; font-size: 14px; letter-spacing: 2px;">
                        РАЗГЛЕДАЙТЕ КОЛЕКЦИЯТА
                    </a>
                </div>
                
                <p style="color: #888; font-size: 13px;">Ако имате въпроси, свържете се с нас на <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a></p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                <p>ГРИИН ПОТЕНШЪЛ ЕООД | ЕИК: 208341137</p>
                <p>гр. Плевен 5800, бул. Чаталджа № 4</p>
                <p>&copy; 2025 KOSTIN. Всички права запазени.</p>
            </div>
        </body>
        </html>
        """
    else:
        subject = "Welcome to KOSTIN!"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #c9a86c;">
                <h1 style="font-size: 32px; font-weight: 300; letter-spacing: 8px; margin: 0; color: #1a1a1a;">KOSTIN</h1>
                <p style="font-size: 11px; letter-spacing: 3px; color: #666; margin-top: 8px;">LUXURY FRAGRANCES</p>
            </div>
            
            <div style="padding: 40px 20px;">
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 20px;">Welcome, {user_name}!</h2>
                
                <p>Thank you for registering at KOSTIN - your destination for luxury fragrances.</p>
                
                <p>With your account you can:</p>
                <ul style="color: #555;">
                    <li>Browse our selection of over 200 luxury fragrances</li>
                    <li>Save your favorite products</li>
                    <li>Track your orders</li>
                    <li>Receive exclusive offers</li>
                </ul>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="https://kostinparfums.com/products" 
                       style="display: inline-block; background: #1a1a1a; color: #fff; padding: 15px 40px; text-decoration: none; font-size: 14px; letter-spacing: 2px;">
                        EXPLORE COLLECTION
                    </a>
                </div>
                
                <p style="color: #888; font-size: 13px;">If you have any questions, contact us at <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a></p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                <p>GREEN POTENTIAL LTD | EIK: 208341137</p>
                <p>Pleven 5800, 4 Chataldzha Blvd., Bulgaria</p>
                <p>&copy; 2025 KOSTIN. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
    
    return await send_email(to_email, subject, html_content)


async def send_order_confirmation_email(
    to_email: str, 
    user_name: str, 
    order_id: str,
    items: list,
    total: float,
    shipping_cost: float,
    lang: str = "bg"
):
    """Send order confirmation email"""
    
    # Build items table
    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #eee;">
                <strong>{item.get('name', 'Product')}</strong><br>
                <span style="color: #888; font-size: 13px;">{item.get('brand', '')}</span>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
            <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">{item.get('price', 0):.2f} лв.</td>
        </tr>
        """
    
    if lang == "bg":
        subject = f"Потвърждение на поръчка #{order_id[:8]}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #c9a86c;">
                <h1 style="font-size: 32px; font-weight: 300; letter-spacing: 8px; margin: 0; color: #1a1a1a;">KOSTIN</h1>
                <p style="font-size: 11px; letter-spacing: 3px; color: #666; margin-top: 8px;">LUXURY FRAGRANCES</p>
            </div>
            
            <div style="padding: 40px 20px;">
                <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
                    <p style="color: #28a745; font-size: 18px; margin: 0;">&#10003; Поръчката е потвърдена!</p>
                </div>
                
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 20px;">Здравейте, {user_name}!</h2>
                
                <p>Благодарим Ви за поръчката! Ето обобщение:</p>
                
                <div style="background: #fafafa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Номер на поръчка:</strong> #{order_id[:8].upper()}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Продукт</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Кол.</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Цена</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="border-top: 2px solid #1a1a1a; padding-top: 15px; margin-top: 10px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 5px 0;">Междинна сума:</td>
                            <td style="text-align: right;">{total - shipping_cost:.2f} лв.</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">Доставка:</td>
                            <td style="text-align: right;">{shipping_cost:.2f} лв.</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; font-size: 18px;"><strong>Общо:</strong></td>
                            <td style="text-align: right; font-size: 18px;"><strong>{total:.2f} лв.</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #c9a86c;">
                    <p style="margin: 0; color: #856404;"><strong>Какво следва?</strong></p>
                    <p style="margin: 10px 0 0 0; color: #856404;">Ще получите имейл с информация за доставката, когато поръчката Ви бъде изпратена.</p>
                </div>
                
                <p style="color: #888; font-size: 13px;">При въпроси, свържете се с нас на <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a> или на телефон +359 889 567 870</p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                <p>ГРИИН ПОТЕНШЪЛ ЕООД | ЕИК: 208341137</p>
                <p>гр. Плевен 5800, бул. Чаталджа № 4</p>
                <p>&copy; 2025 KOSTIN. Всички права запазени.</p>
            </div>
        </body>
        </html>
        """
    else:
        subject = f"Order Confirmation #{order_id[:8]}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #c9a86c;">
                <h1 style="font-size: 32px; font-weight: 300; letter-spacing: 8px; margin: 0; color: #1a1a1a;">KOSTIN</h1>
                <p style="font-size: 11px; letter-spacing: 3px; color: #666; margin-top: 8px;">LUXURY FRAGRANCES</p>
            </div>
            
            <div style="padding: 40px 20px;">
                <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
                    <p style="color: #28a745; font-size: 18px; margin: 0;">&#10003; Order Confirmed!</p>
                </div>
                
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 20px;">Hello, {user_name}!</h2>
                
                <p>Thank you for your order! Here's a summary:</p>
                
                <div style="background: #fafafa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Order Number:</strong> #{order_id[:8].upper()}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="border-top: 2px solid #1a1a1a; padding-top: 15px; margin-top: 10px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 5px 0;">Subtotal:</td>
                            <td style="text-align: right;">{total - shipping_cost:.2f} BGN</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">Shipping:</td>
                            <td style="text-align: right;">{shipping_cost:.2f} BGN</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; font-size: 18px;"><strong>Total:</strong></td>
                            <td style="text-align: right; font-size: 18px;"><strong>{total:.2f} BGN</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #c9a86c;">
                    <p style="margin: 0; color: #856404;"><strong>What's next?</strong></p>
                    <p style="margin: 10px 0 0 0; color: #856404;">You'll receive an email with shipping information once your order has been dispatched.</p>
                </div>
                
                <p style="color: #888; font-size: 13px;">For questions, contact us at <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a> or call +359 889 567 870</p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                <p>GREEN POTENTIAL LTD | EIK: 208341137</p>
                <p>Pleven 5800, 4 Chataldzha Blvd., Bulgaria</p>
                <p>&copy; 2025 KOSTIN. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
    
    return await send_email(to_email, subject, html_content)
