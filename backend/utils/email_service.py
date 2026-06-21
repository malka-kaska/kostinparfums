import os
import asyncio
import logging
import resend
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "contact@kostinparfums.com")

# Logo URL (hosted on Cloudinary or your server)
LOGO_URL = "https://res.cloudinary.com/dbtifacuv/image/upload/v1749848249/logo_aulozz.png"

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


def get_email_header(lang: str = "bg"):
    """Returns the standard KOSTIN email header HTML - matches website design"""
    tagline = "СЕЛЕКЦИЯ ОТ ЛУКСОЗНИ АРОМАТИ" if lang == "bg" else "SELECTION OF LUXURY FRAGRANCES"
    return f"""
    <div style="text-align: center; padding: 40px 20px 30px 20px;">
        <h1 style="font-family: 'Times New Roman', Times, serif; font-size: 42px; font-weight: 400; letter-spacing: 12px; margin: 0; color: #1a1a1a;">KOSTIN</h1>
        <p style="font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 4px; color: #888; margin-top: 12px; text-transform: uppercase;">{tagline}</p>
    </div>
    <div style="width: 60%; max-width: 350px; height: 2px; background-color: #c9a86c; margin: 0 auto 40px auto;"></div>
    """


def get_email_footer(lang: str = "bg"):
    """Returns the standard KOSTIN email footer HTML"""
    if lang == "bg":
        return """
        <div style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 5px 0;">ГРИИН ПОТЕНШЪЛ ЕООД | ЕИК: 208341137</p>
            <p style="margin: 5px 0;">гр. Плевен 5800, бул. Чаталджа № 4</p>
            <p style="margin: 5px 0;">Тел: +359 889 567 870</p>
            <p style="margin: 15px 0 5px 0;">&copy; 2025 KOSTIN. Всички права запазени.</p>
        </div>
        """
    else:
        return """
        <div style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 5px 0;">GREEN POTENTIAL LTD | EIK: 208341137</p>
            <p style="margin: 5px 0;">Pleven 5800, 4 Chataldzha Blvd., Bulgaria</p>
            <p style="margin: 5px 0;">Phone: +359 889 567 870</p>
            <p style="margin: 15px 0 5px 0;">&copy; 2025 KOSTIN. All rights reserved.</p>
        </div>
        """


async def send_registration_email(to_email: str, user_name: str, lang: str = "bg"):
    """Send registration confirmation email"""
    
    header = get_email_header(lang)
    footer = get_email_footer(lang)
    
    if lang == "bg":
        subject = "Добре дошли в KOSTIN!"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
            {header}
            
            <div style="padding: 0 20px;">
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 20px; font-size: 22px;">Добре дошли, {user_name}!</h2>
                
                <p style="color: #555; margin-bottom: 15px;">Благодарим Ви, че се регистрирахте в KOSTIN - Вашата дестинация за луксозни парфюми.</p>
                
                <p style="color: #555; margin-bottom: 10px;">С Вашия акаунт можете:</p>
                <ul style="color: #555; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Да разглеждате нашата селекция от луксозни аромати</li>
                    <li style="margin-bottom: 8px;">Да запазвате любими продукти</li>
                    <li style="margin-bottom: 8px;">Да проследявате поръчките си</li>
                    <li style="margin-bottom: 8px;">Да получавате ексклузивни оферти</li>
                </ul>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="https://kostinparfums.com/products" 
                       style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 35px; text-decoration: none; font-size: 13px; letter-spacing: 2px;">
                        РАЗГЛЕДАЙТЕ КОЛЕКЦИЯТА
                    </a>
                </div>
                
                <p style="color: #888; font-size: 13px;">Ако имате въпроси, свържете се с нас на <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a></p>
            </div>
            
            {footer}
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
            {header}
            
            <div style="padding: 0 20px;">
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 20px; font-size: 22px;">Welcome, {user_name}!</h2>
                
                <p style="color: #555; margin-bottom: 15px;">Thank you for registering at KOSTIN - your destination for luxury fragrances.</p>
                
                <p style="color: #555; margin-bottom: 10px;">With your account you can:</p>
                <ul style="color: #555; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Browse our selection of luxury fragrances</li>
                    <li style="margin-bottom: 8px;">Save your favorite products</li>
                    <li style="margin-bottom: 8px;">Track your orders</li>
                    <li style="margin-bottom: 8px;">Receive exclusive offers</li>
                </ul>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="https://kostinparfums.com/products" 
                       style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 35px; text-decoration: none; font-size: 13px; letter-spacing: 2px;">
                        EXPLORE COLLECTION
                    </a>
                </div>
                
                <p style="color: #888; font-size: 13px;">If you have any questions, contact us at <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a></p>
            </div>
            
            {footer}
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
    
    header = get_email_header(lang)
    footer = get_email_footer(lang)
    
    # Build items table
    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; vertical-align: top;">
                <strong style="color: #1a1a1a;">{item.get('name', 'Product')}</strong><br>
                <span style="color: #888; font-size: 12px;">{item.get('brand', '')}</span>
            </td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #555;">{item.get('quantity', 1)}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #1a1a1a;">{item.get('price', 0):.2f} лв.</td>
        </tr>
        """
    
    if lang == "bg":
        subject = f"Потвърждение на поръчка #{order_id[:8].upper()}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
            {header}
            
            <div style="padding: 0 20px;">
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; border: 1px solid #bbf7d0;">
                    <p style="color: #166534; font-size: 18px; margin: 0; font-weight: 500;">&#10003; Поръчката е потвърдена!</p>
                </div>
                
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 20px; font-size: 20px;">Здравейте, {user_name}!</h2>
                
                <p style="color: #555;">Благодарим Ви за поръчката! Ето обобщение:</p>
                
                <div style="background: #f8f8f8; padding: 15px 20px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; color: #1a1a1a;"><strong>Номер на поръчка:</strong> #{order_id[:8].upper()}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 12px 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; color: #1a1a1a;">Продукт</th>
                            <th style="padding: 12px 10px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; color: #1a1a1a;">Кол.</th>
                            <th style="padding: 12px 10px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; color: #1a1a1a;">Цена</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="border-top: 2px solid #1a1a1a; padding-top: 15px; margin-top: 10px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 5px 0; color: #555;">Междинна сума:</td>
                            <td style="text-align: right; color: #555;">{total - shipping_cost:.2f} лв.</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #555;">Доставка:</td>
                            <td style="text-align: right; color: #555;">{shipping_cost:.2f} лв.</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0 5px 0; font-size: 18px; color: #1a1a1a;"><strong>Общо:</strong></td>
                            <td style="text-align: right; font-size: 18px; color: #1a1a1a;"><strong>{total:.2f} лв.</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #c9a86c;">
                    <p style="margin: 0; color: #92400e; font-weight: 500;">Какво следва?</p>
                    <p style="margin: 10px 0 0 0; color: #92400e;">Ще получите имейл с информация за доставката, когато поръчката Ви бъде изпратена.</p>
                </div>
                
                <p style="color: #888; font-size: 13px;">При въпроси, свържете се с нас на <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a> или на телефон +359 889 567 870</p>
            </div>
            
            {footer}
        </body>
        </html>
        """
    else:
        subject = f"Order Confirmation #{order_id[:8].upper()}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
            {header}
            
            <div style="padding: 0 20px;">
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; border: 1px solid #bbf7d0;">
                    <p style="color: #166534; font-size: 18px; margin: 0; font-weight: 500;">&#10003; Order Confirmed!</p>
                </div>
                
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 20px; font-size: 20px;">Hello, {user_name}!</h2>
                
                <p style="color: #555;">Thank you for your order! Here's a summary:</p>
                
                <div style="background: #f8f8f8; padding: 15px 20px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; color: #1a1a1a;"><strong>Order Number:</strong> #{order_id[:8].upper()}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 12px 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; color: #1a1a1a;">Product</th>
                            <th style="padding: 12px 10px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; color: #1a1a1a;">Qty</th>
                            <th style="padding: 12px 10px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; color: #1a1a1a;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="border-top: 2px solid #1a1a1a; padding-top: 15px; margin-top: 10px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 5px 0; color: #555;">Subtotal:</td>
                            <td style="text-align: right; color: #555;">{total - shipping_cost:.2f} BGN</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #555;">Shipping:</td>
                            <td style="text-align: right; color: #555;">{shipping_cost:.2f} BGN</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0 5px 0; font-size: 18px; color: #1a1a1a;"><strong>Total:</strong></td>
                            <td style="text-align: right; font-size: 18px; color: #1a1a1a;"><strong>{total:.2f} BGN</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #c9a86c;">
                    <p style="margin: 0; color: #92400e; font-weight: 500;">What's next?</p>
                    <p style="margin: 10px 0 0 0; color: #92400e;">You'll receive an email with shipping information once your order has been dispatched.</p>
                </div>
                
                <p style="color: #888; font-size: 13px;">For questions, contact us at <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a> or call +359 889 567 870</p>
            </div>
            
            {footer}
        </body>
        </html>
        """
    
    return await send_email(to_email, subject, html_content)
