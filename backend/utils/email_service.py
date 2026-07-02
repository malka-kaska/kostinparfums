import os
import asyncio
import logging
import base64
import resend
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "contact@kostinparfums.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://kostinparfums.com")

# Logo URL (hosted on Cloudinary or your server)
LOGO_URL = "https://res.cloudinary.com/dbtifacuv/image/upload/v1749848249/logo_aulozz.png"

# Fixed exchange rate for EUR to BGN (Bulgaria's Euro adoption)
EUR_TO_BGN_RATE = 1.95583

def format_dual_price(eur_amount: float) -> str:
    """Format price in both EUR and BGN for email templates"""
    if eur_amount is None or not isinstance(eur_amount, (int, float)):
        return "€0.00 / 0.00 лв."
    bgn_amount = eur_amount * EUR_TO_BGN_RATE
    return f"€{eur_amount:.2f} / {bgn_amount:.2f} лв."

async def send_email(to_email: str, subject: str, html_content: str, attachments: list = None) -> dict:
    """Send email using Resend API (non-blocking) with optional attachments"""
    params = {
        "from": f"KOSTIN <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    # Add attachments if provided
    if attachments:
        params["attachments"] = attachments
    
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
            <p style="margin: 5px 0;">ГРИИН ПОТЕНШЪЛ ЕООД</p>
            <p style="margin: 5px 0;">Тел: +359 889 567 870</p>
            <p style="margin: 15px 0 5px 0;">&copy; 2025 KOSTIN. Всички права запазени.</p>
        </div>
        """
    else:
        return """
        <div style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 5px 0;">GREEN POTENTIAL LTD</p>
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
                    <a href="{FRONTEND_URL}/products" 
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
                    <a href="{FRONTEND_URL}/products" 
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
    discount_code: str = None,
    discount_amount: float = 0,
    tracking_number: str = None,
    tracking_url: str = None,
    lang: str = "bg"
):
    """Send order confirmation email with optional discount info and tracking"""
    
    header = get_email_header(lang)
    footer = get_email_footer(lang)
    
    # Calculate subtotal (before discount and shipping)
    subtotal = total - shipping_cost + discount_amount
    
    # Build items table
    items_html = ""
    for item in items:
        item_price = item.get('price', 0)
        item_price_bgn = item_price * EUR_TO_BGN_RATE
        items_html += f"""
        <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; vertical-align: top;">
                <strong style="color: #1a1a1a;">{item.get('name', 'Product')}</strong><br>
                <span style="color: #888; font-size: 12px;">{item.get('brand', '')}</span>
            </td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #555;">{item.get('quantity', 1)}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #1a1a1a;">€{item_price:.2f}<br><span style="color: #888; font-size: 11px;">{item_price_bgn:.2f} лв.</span></td>
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
                            <td style="text-align: right; color: #555;">{format_dual_price(subtotal)}</td>
                        </tr>
                        {"<tr><td style='padding: 5px 0; color: #16a34a;'>Отстъпка (" + discount_code + "):</td><td style='text-align: right; color: #16a34a;'>-" + format_dual_price(discount_amount) + "</td></tr>" if discount_code and discount_amount > 0 else ""}
                        <tr>
                            <td style="padding: 5px 0; color: #555;">Доставка:</td>
                            <td style="text-align: right; color: #555;">{format_dual_price(shipping_cost)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0 5px 0; font-size: 18px; color: #1a1a1a;"><strong>Общо:</strong></td>
                            <td style="text-align: right; font-size: 18px; color: #1a1a1a;"><strong>{format_dual_price(total)}</strong></td>
                        </tr>
                    </table>
                </div>
                
                {"" if not tracking_number else f'''
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
                    <p style="margin: 0; color: #0369a1; font-weight: 500;">📦 Информация за доставка</p>
                    <p style="margin: 10px 0 5px 0; color: #0369a1;">Номер на товарителницата: <strong>{tracking_number}</strong></p>
                    <a href="{tracking_url or f"https://www.speedy.bg/bg/track-shipment?shipmentNumber={tracking_number}"}" style="display: inline-block; background: #0ea5e9; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 10px;">Проследи пратката</a>
                </div>
                '''}
                
                <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #c9a86c;">
                    <p style="margin: 0; color: #92400e; font-weight: 500;">Какво следва?</p>
                    <p style="margin: 10px 0 0 0; color: #92400e;">{"Пратката Ви вече е създадена и ще бъде изпратена скоро!" if tracking_number else "Ще получите имейл с информация за доставката, когато поръчката Ви бъде изпратена."}</p>
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
                            <td style="text-align: right; color: #555;">{format_dual_price(subtotal)}</td>
                        </tr>
                        {"<tr><td style='padding: 5px 0; color: #16a34a;'>Discount (" + discount_code + "):</td><td style='text-align: right; color: #16a34a;'>-" + format_dual_price(discount_amount) + "</td></tr>" if discount_code and discount_amount > 0 else ""}
                        <tr>
                            <td style="padding: 5px 0; color: #555;">Shipping:</td>
                            <td style="text-align: right; color: #555;">{format_dual_price(shipping_cost)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0 5px 0; font-size: 18px; color: #1a1a1a;"><strong>Total:</strong></td>
                            <td style="text-align: right; font-size: 18px; color: #1a1a1a;"><strong>{format_dual_price(total)}</strong></td>
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



async def send_email_verification(to_email: str, user_name: str, verification_token: str, lang: str = "bg"):
    """Send email verification link"""
    
    header = get_email_header(lang)
    footer = get_email_footer(lang)
    
    verification_url = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    
    if lang == "bg":
        subject = "Потвърдете имейл адреса си - KOSTIN"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
            {header}
            
            <div style="padding: 0 20px;">
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 20px; font-size: 22px;">Здравейте, {user_name}!</h2>
                
                <p style="color: #555; margin-bottom: 15px;">Благодарим Ви за регистрацията в KOSTIN!</p>
                
                <p style="color: #555; margin-bottom: 25px;">Моля, потвърдете имейл адреса си, като натиснете бутона по-долу:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="{verification_url}" 
                       style="display: inline-block; background: #1a1a1a; color: #fff; padding: 16px 45px; text-decoration: none; font-size: 14px; letter-spacing: 2px; border-radius: 4px;">
                        ПОТВЪРДИ ИМЕЙЛ
                    </a>
                </div>
                
                <p style="color: #888; font-size: 13px; margin-top: 30px;">Или копирайте този линк в браузъра си:</p>
                <p style="color: #c9a86c; font-size: 12px; word-break: break-all;">{verification_url}</p>
                
                <div style="background: #fff8e1; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #c9a86c;">
                    <p style="margin: 0; color: #92400e; font-size: 13px;">Линкът е валиден 24 часа. Ако не сте заявили регистрация, моля игнорирайте този имейл.</p>
                </div>
            </div>
            
            {footer}
        </body>
        </html>
        """
    else:
        subject = "Verify your email - KOSTIN"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
            {header}
            
            <div style="padding: 0 20px;">
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 20px; font-size: 22px;">Hello, {user_name}!</h2>
                
                <p style="color: #555; margin-bottom: 15px;">Thank you for registering at KOSTIN!</p>
                
                <p style="color: #555; margin-bottom: 25px;">Please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="{verification_url}" 
                       style="display: inline-block; background: #1a1a1a; color: #fff; padding: 16px 45px; text-decoration: none; font-size: 14px; letter-spacing: 2px; border-radius: 4px;">
                        VERIFY EMAIL
                    </a>
                </div>
                
                <p style="color: #888; font-size: 13px; margin-top: 30px;">Or copy this link to your browser:</p>
                <p style="color: #c9a86c; font-size: 12px; word-break: break-all;">{verification_url}</p>
                
                <div style="background: #fff8e1; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #c9a86c;">
                    <p style="margin: 0; color: #92400e; font-size: 13px;">This link is valid for 24 hours. If you didn't request this registration, please ignore this email.</p>
                </div>
            </div>
            
            {footer}
        </body>
        </html>
        """
    
    return await send_email(to_email, subject, html_content)


async def send_order_verification_email(
    to_email: str, 
    user_name: str, 
    order_id: str,
    verification_token: str,
    items: list,
    total: float,
    shipping_cost: float,
    lang: str = "bg"
):
    """Send order verification email - user must confirm the order"""
    
    header = get_email_header(lang)
    footer = get_email_footer(lang)
    
    verification_url = f"{FRONTEND_URL}/verify-order?token={verification_token}"
    
    # Build items table
    items_html = ""
    for item in items:
        item_price = item.get('price', 0)
        item_price_bgn = item_price * EUR_TO_BGN_RATE
        items_html += f"""
        <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eee; vertical-align: top;">
                <strong style="color: #1a1a1a; font-size: 14px;">{item.get('name', 'Product')}</strong><br>
                <span style="color: #888; font-size: 11px;">{item.get('brand', '')}</span>
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: center; color: #555;">{item.get('quantity', 1)}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; color: #1a1a1a;">€{item_price:.2f}<br><span style="color: #888; font-size: 10px;">{item_price_bgn:.2f} лв.</span></td>
        </tr>
        """
    
    if lang == "bg":
        subject = f"Потвърдете поръчка #{order_id[:8].upper()} - KOSTIN"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
            {header}
            
            <div style="padding: 0 20px;">
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center; border: 1px solid #fcd34d;">
                    <p style="color: #92400e; font-size: 16px; margin: 0; font-weight: 500;">Потвърдете поръчката си</p>
                </div>
                
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 15px; font-size: 18px;">Здравейте, {user_name}!</h2>
                
                <p style="color: #555; font-size: 14px;">Получихме Вашата поръчка. Моля, прегледайте и потвърдете:</p>
                
                <div style="background: #f8f8f8; padding: 12px 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 0; color: #1a1a1a; font-size: 14px;"><strong>Поръчка:</strong> #{order_id[:8].upper()}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600;">Продукт</th>
                            <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600;">Кол.</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600;">Цена</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="border-top: 2px solid #1a1a1a; padding-top: 12px;">
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="padding: 4px 0; color: #555;">Междинна сума:</td>
                            <td style="text-align: right; color: #555;">{format_dual_price(total - shipping_cost)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #555;">Доставка:</td>
                            <td style="text-align: right; color: #555;">{format_dual_price(shipping_cost)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0 4px 0; font-size: 16px;"><strong>Общо:</strong></td>
                            <td style="text-align: right; font-size: 16px;"><strong>{format_dual_price(total)}</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="display: inline-block; background: #166534; color: #fff; padding: 16px 45px; text-decoration: none; font-size: 14px; letter-spacing: 2px; border-radius: 4px;">
                        ПОТВЪРДИ ПОРЪЧКАТА
                    </a>
                </div>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #991b1b; font-size: 13px;"><strong>Важно:</strong> Поръчката ще бъде обработена едва след потвърждение. Линкът е валиден 24 часа.</p>
                </div>
                
                <p style="color: #888; font-size: 13px;">При въпроси: <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a> | +359 889 567 870</p>
            </div>
            
            {footer}
        </body>
        </html>
        """
    else:
        subject = f"Confirm Order #{order_id[:8].upper()} - KOSTIN"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
            {header}
            
            <div style="padding: 0 20px;">
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center; border: 1px solid #fcd34d;">
                    <p style="color: #92400e; font-size: 16px; margin: 0; font-weight: 500;">Please confirm your order</p>
                </div>
                
                <h2 style="color: #1a1a1a; font-weight: 400; margin-bottom: 15px; font-size: 18px;">Hello, {user_name}!</h2>
                
                <p style="color: #555; font-size: 14px;">We received your order. Please review and confirm:</p>
                
                <div style="background: #f8f8f8; padding: 12px 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 0; color: #1a1a1a; font-size: 14px;"><strong>Order:</strong> #{order_id[:8].upper()}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600;">Product</th>
                            <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600;">Qty</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="border-top: 2px solid #1a1a1a; padding-top: 12px;">
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="padding: 4px 0; color: #555;">Subtotal:</td>
                            <td style="text-align: right; color: #555;">{format_dual_price(total - shipping_cost)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #555;">Shipping:</td>
                            <td style="text-align: right; color: #555;">{format_dual_price(shipping_cost)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0 4px 0; font-size: 16px;"><strong>Total:</strong></td>
                            <td style="text-align: right; font-size: 16px;"><strong>{format_dual_price(total)}</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="display: inline-block; background: #166534; color: #fff; padding: 16px 45px; text-decoration: none; font-size: 14px; letter-spacing: 2px; border-radius: 4px;">
                        CONFIRM ORDER
                    </a>
                </div>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #991b1b; font-size: 13px;"><strong>Important:</strong> Your order will only be processed after confirmation. The link is valid for 24 hours.</p>
                </div>
                
                <p style="color: #888; font-size: 13px;">Questions? <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a> | +359 889 567 870</p>
            </div>
            
            {footer}
        </body>
        </html>
        """
    
    return await send_email(to_email, subject, html_content)



async def send_cod_order_confirmation(
    to_email: str,
    order_number: str,
    items: list,
    total: float,
    shipping_address: dict,
    tracking_number: str = None,
    tracking_url: str = None,
    discount_code: str = None,
    discount_amount: float = 0,
    subtotal: float = None,
    shipping_cost: float = 0,
    order_id: str = None,
    cancellation_token: str = None,
    lang: str = "bg"
) -> dict:
    """Send COD order confirmation email with optional tracking info, discount, and cancellation link"""
    
    # Calculate subtotal if not provided
    if subtotal is None:
        subtotal = total - shipping_cost + discount_amount
    
    # Build items HTML
    items_html = ""
    for item in items:
        item_total = float(item.get('price', 0)) * int(item.get('quantity', 1))
        item_total_bgn = item_total * EUR_TO_BGN_RATE
        items_html += f"""
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                <strong style="color: #1a1a1a;">{item.get('name', 'Product')}</strong>
                <br><span style="color: #888; font-size: 12px;">Количество: {item.get('quantity', 1)}</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #1a1a1a;">
                €{item_total:.2f}<br><span style="color: #888; font-size: 11px;">{item_total_bgn:.2f} лв.</span>
            </td>
        </tr>
        """
    
    header = get_email_header(lang)
    footer = get_email_footer(lang)
    
    # Address formatting
    addr = shipping_address
    address_html = f"""
        <strong>{addr.get('full_name', '')}</strong><br>
        {addr.get('address', '')}<br>
        {addr.get('city', '')} {addr.get('postal_code', '')}<br>
        Тел: {addr.get('phone', '')}
    """
    if addr.get('notes'):
        address_html += f"<br><em>Бележки: {addr.get('notes')}</em>"
    
    # Tracking section HTML
    tracking_html = ""
    if tracking_number:
        if lang == "bg":
            tracking_html = f"""
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4caf50;">
                    <p style="margin: 0 0 10px 0; color: #2e7d32; font-size: 14px;">
                        <strong>📦 Пратката е създадена!</strong>
                    </p>
                    <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                        Номер за проследяване: <strong>{tracking_number}</strong><br>
                        <a href="{tracking_url}" style="color: #1b5e20; text-decoration: underline;">Проследи пратката в Speedy</a>
                    </p>
                </div>
            """
        else:
            tracking_html = f"""
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4caf50;">
                    <p style="margin: 0 0 10px 0; color: #2e7d32; font-size: 14px;">
                        <strong>📦 Shipment Created!</strong>
                    </p>
                    <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                        Tracking Number: <strong>{tracking_number}</strong><br>
                        <a href="{tracking_url}" style="color: #1b5e20; text-decoration: underline;">Track on Speedy</a>
                    </p>
                </div>
            """
    
    if lang == "bg":
        subject = f"Поръчка {order_number} - Наложен платеж | KOSTIN"
        title = "Благодарим за поръчката!"
        subtitle = "Вашата поръчка с наложен платеж е приета"
        order_label = "Номер на поръчка"
        items_label = "Поръчани продукти"
        total_label = "Обща сума за плащане"
        delivery_label = "Адрес за доставка"
        payment_note = "Плащането ще бъде извършено при доставка на куриера."
        contact_text = "Въпроси?"
    else:
        subject = f"Order {order_number} - Cash on Delivery | KOSTIN"
        title = "Thank you for your order!"
        subtitle = "Your Cash on Delivery order has been received"
        order_label = "Order Number"
        items_label = "Ordered Products"
        total_label = "Total Amount Due"
        delivery_label = "Delivery Address"
        payment_note = "Payment will be collected upon delivery."
        contact_text = "Questions?"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f8f8; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            {header}
            
            <div style="padding: 0 40px 40px 40px;">
                <h2 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 10px 0; text-align: center;">{title}</h2>
                <p style="color: #666; font-size: 14px; text-align: center; margin: 0 0 30px 0;">{subtitle}</p>
                
                <div style="background: linear-gradient(135deg, #c9a86c 0%, #d4a574 100%); color: #fff; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                    <p style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">{order_label}</p>
                    <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">{order_number}</p>
                </div>
                
                {tracking_html}
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #c9a86c;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <strong>💵 Наложен платеж</strong><br>
                        {payment_note}
                    </p>
                </div>
                
                <!-- Free Return Policy -->
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4caf50;">
                    <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                        <strong>↩️ Безплатно връщане до 14 дни</strong><br>
                        При неразопакован продукт можете да го върнете безплатно. Ваучерът за връщане е включен в пратката.
                    </p>
                </div>
                
                <!-- Order Cancellation Link -->
                {f'''<div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f87171;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                        <strong>❌ Искате да откажете поръчката?</strong><br>
                        Ако желаете да откажете тази поръчка, <a href="{FRONTEND_URL}/cancel-order?order={order_id}&token={cancellation_token}" style="color: #dc2626; text-decoration: underline;">кликнете тук</a>
                    </p>
                </div>''' if order_id and cancellation_token else ''}
                
                <h3 style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #c9a86c;">{items_label}</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                    {items_html}
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">{'Междинна сума' if lang == 'bg' else 'Subtotal'}</td>
                        <td style="padding: 8px 0; text-align: right; color: #666; font-size: 14px;">{format_dual_price(subtotal)}</td>
                    </tr>
                    {f'''<tr>
                        <td style="padding: 8px 0; color: #16a34a; font-size: 14px;">
                            {'Отстъпка' if lang == 'bg' else 'Discount'} ({discount_code})
                        </td>
                        <td style="padding: 8px 0; text-align: right; color: #16a34a; font-size: 14px;">-{format_dual_price(discount_amount)}</td>
                    </tr>''' if discount_code and discount_amount > 0 else ''}
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">{'Доставка' if lang == 'bg' else 'Shipping'}</td>
                        <td style="padding: 8px 0; text-align: right; color: #666; font-size: 14px;">{format_dual_price(shipping_cost)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 15px 0; font-weight: bold; color: #1a1a1a; font-size: 16px; border-top: 2px solid #1a1a1a;">{total_label}</td>
                        <td style="padding: 15px 0; text-align: right; font-weight: bold; color: #c9a86c; font-size: 20px; border-top: 2px solid #1a1a1a;">{format_dual_price(total)}</td>
                    </tr>
                </table>
                
                <h3 style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #c9a86c;">{delivery_label}</h3>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 25px; color: #1a1a1a; font-size: 14px; line-height: 1.6;">
                    {address_html}
                </div>
                
                <p style="color: #888; font-size: 13px; text-align: center;">{contact_text} <a href="mailto:contact@kostinparfums.com" style="color: #c9a86c;">contact@kostinparfums.com</a> | +359 889 567 870</p>
            </div>
            
            {footer}
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)



async def send_password_reset_email(to_email: str, name: str, token: str):
    """Send password reset email with secure link"""
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    
    subject = "Възстановяване на парола | KOSTIN"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://res.cloudinary.com/dj3zd0gxq/image/upload/v1749040949/KOSTIN_Logo_ttvfmx.png" alt="KOSTIN" style="height: 40px; margin-bottom: 20px;">
            </div>
            
            <div style="background: #ffffff; padding: 40px; border-radius: 2px;">
                <h1 style="font-size: 22px; font-weight: 300; color: #1a1a1a; margin: 0 0 25px; text-align: center; letter-spacing: 1px;">
                    ВЪЗСТАНОВЯВАНЕ НА ПАРОЛА
                </h1>
                
                <p style="color: #666; font-size: 14px; line-height: 1.8; margin: 0 0 20px;">
                    Здравейте{', ' + name if name else ''},
                </p>
                
                <p style="color: #666; font-size: 14px; line-height: 1.8; margin: 0 0 25px;">
                    Получихме заявка за възстановяване на паролата на вашия акаунт в KOSTIN. 
                    Кликнете бутона по-долу, за да зададете нова парола:
                </p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="{reset_url}" 
                       style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 35px; text-decoration: none; font-size: 13px; letter-spacing: 2px;">
                        ЗАДАЙ НОВА ПАРОЛА
                    </a>
                </div>
                
                <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 25px 0 0; text-align: center;">
                    Този линк е валиден 1 час. Ако не сте заявили възстановяване на парола, 
                    можете спокойно да игнорирате този имейл.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #888; font-size: 12px;">
                    © {datetime.now().year} KOSTIN | Луксозни парфюми
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)



async def send_invoice_email(
    to_email: str,
    user_name: str,
    order: dict,
    pdf_bytes: bytes,
    lang: str = "bg"
):
    """Send invoice/receipt email with PDF attachment for card payments"""
    
    order_number = order.get("order_number", order.get("_id", "N/A"))
    total = order.get("total", 0)
    tracking_number = order.get("tracking_number", "")
    tracking_url = order.get("tracking_url", "")
    
    subject = f"Вашата разписка от KOSTIN - Поръчка {order_number}" if lang == "bg" else f"Your receipt from KOSTIN - Order {order_number}"
    
    # Build tracking section
    tracking_section = ""
    if tracking_number:
        tracking_section = f"""
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; color: #0369a1; font-weight: 500;">📦 {"Информация за доставка" if lang == "bg" else "Shipping Information"}</p>
            <p style="margin: 10px 0 5px 0; color: #0369a1;">{"Номер за проследяване" if lang == "bg" else "Tracking Number"}: <strong>{tracking_number}</strong></p>
            <a href="{tracking_url}" style="display: inline-block; background: #0ea5e9; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 10px;">{"Проследи пратката" if lang == "bg" else "Track Shipment"}</a>
        </div>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
            {get_email_header(lang)}
            
            <h2 style="font-size: 24px; color: #1a1a1a; margin-bottom: 20px; text-align: center;">
                {"Благодарим за поръчката!" if lang == "bg" else "Thank you for your order!"}
            </h2>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                {"Здравейте" if lang == "bg" else "Hello"}, <strong>{user_name}</strong>!
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                {"Вашето плащане е успешно обработено. Приложена е електронна разписка за Вашата поръчка." if lang == "bg" else "Your payment has been successfully processed. Please find your electronic receipt attached."}
            </p>
            
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 25px; border-radius: 8px; margin: 20px 0; color: white;">
                <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.8;">{"Номер на поръчка" if lang == "bg" else "Order Number"}</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">{order_number}</p>
                <p style="margin: 15px 0 0 0; font-size: 18px; color: #c9a86c;">
                    {"Обща сума" if lang == "bg" else "Total"}: {format_dual_price(total)}
                </p>
            </div>
            
            {tracking_section}
            
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c9a86c;">
                <p style="margin: 0; color: #92400e; font-weight: 500;">📎 {"Приложение" if lang == "bg" else "Attachment"}</p>
                <p style="margin: 10px 0 0 0; color: #92400e;">
                    {"Вашата електронна разписка е приложена към този имейл като PDF файл." if lang == "bg" else "Your electronic receipt is attached to this email as a PDF file."}
                </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                {"При въпроси, не се колебайте да се свържете с нас." if lang == "bg" else "If you have any questions, please don't hesitate to contact us."}
            </p>
            
            {get_email_footer(lang)}
        </div>
    </body>
    </html>
    """
    
    # Prepare PDF attachment
    pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
    attachments = [
        {
            "filename": f"KOSTIN_Receipt_{order_number}.pdf",
            "content": pdf_base64
        }
    ]
    
    result = await send_email(to_email, subject, html_content, attachments)
    
    if result.get("status") == "success":
        logger.info(f"Invoice email sent to {to_email} for order {order_number}")
    else:
        logger.error(f"Failed to send invoice email to {to_email}: {result.get('error')}")
    
    return result



# Admin email for notifications - reload env to ensure latest value
_admin_email_from_env = os.environ.get("ADMIN_EMAIL")
ADMIN_EMAIL = _admin_email_from_env if _admin_email_from_env else "contact@kostinparfums.com"


async def send_admin_cancellation_notification(
    order_number: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    reason: str,
    total: float,
    items: list
):
    """Send email to admin when a customer requests order cancellation"""
    
    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.get('brand', '')} {item.get('name', '')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€{item.get('price', 0):.2f}</td>
        </tr>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #dc2626; margin: 0;">⚠️ Заявка за отказ от поръчка</h1>
            </div>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
                <h2 style="margin: 0 0 10px 0; color: #991b1b;">Поръчка: {order_number}</h2>
                <p style="margin: 0; color: #991b1b;"><strong>Причина за отказ:</strong></p>
                <p style="margin: 10px 0 0 0; color: #7f1d1d; font-style: italic;">"{reason}"</p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #374151;">Данни за клиента:</h3>
                <p style="margin: 5px 0;"><strong>Име:</strong> {customer_name}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:{customer_email}">{customer_email}</a></p>
                <p style="margin: 5px 0;"><strong>Телефон:</strong> <a href="tel:{customer_phone}">{customer_phone}</a></p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #374151;">Продукти в поръчката:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 10px; text-align: left;">Продукт</th>
                            <th style="padding: 10px; text-align: center;">Кол.</th>
                            <th style="padding: 10px; text-align: right;">Цена</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f3f4f6; font-weight: bold;">
                            <td colspan="2" style="padding: 10px;">Обща сума:</td>
                            <td style="padding: 10px; text-align: right;">{format_dual_price(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                    <strong>Действие:</strong> Моля, свържете се с клиента възможно най-скоро за потвърждение на отказа.
                    След това изтрийте товарителницата от Speedy ръчно.
                </p>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 12px; text-align: center;">
                Този имейл е автоматично генериран от KOSTIN Parfums системата.
            </p>
        </div>
    </body>
    </html>
    """
    
    subject = f"⚠️ Заявка за отказ - Поръчка {order_number}"
    
    result = await send_email(ADMIN_EMAIL, subject, html_content)
    
    if result.get("status") == "success":
        logger.info(f"Admin cancellation notification sent for order {order_number}")
    else:
        logger.error(f"Failed to send admin cancellation notification: {result.get('error')}")
    
    return result


async def send_order_cancelled_email(
    to_email: str,
    user_name: str,
    order_number: str,
    reason: str
):
    """Send email to customer when their order is cancelled by admin"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
            {get_email_header('bg')}
            
            <h2 style="color: #1a1a1a; text-align: center;">Поръчката Ви е отменена</h2>
            
            <p style="color: #666;">Здравейте, <strong>{user_name}</strong>,</p>
            
            <p style="color: #666;">
                За съжаление, Вашата поръчка <strong>{order_number}</strong> беше отменена.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #374151;"><strong>Причина:</strong></p>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-style: italic;">"{reason}"</p>
            </div>
            
            <p style="color: #666;">
                Ако имате въпроси или смятате, че това е грешка, моля свържете се с нас.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{FRONTEND_URL}/products" style="display: inline-block; background: #c9a86c; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                    Продължи пазаруването
                </a>
            </div>
            
            {get_email_footer('bg')}
        </div>
    </body>
    </html>
    """
    
    subject = f"Поръчка {order_number} - Отменена"
    
    result = await send_email(to_email, subject, html_content)
    
    if result.get("status") == "success":
        logger.info(f"Order cancelled email sent to {to_email} for order {order_number}")
    else:
        logger.error(f"Failed to send order cancelled email: {result.get('error')}")
    
    return result



async def send_admin_new_order_notification(
    order_number: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    payment_method: str,
    total: float,
    shipping_cost: float,
    items: list,
    shipping_address: dict,
    tracking_number: str = None,
    discount_code: str = None,
    discount_amount: float = 0
):
    """Send email to admin when a new order is placed"""
    
    items_html = ""
    subtotal = 0
    for item in items:
        item_total = float(item.get('price', 0)) * int(item.get('quantity', 1))
        subtotal += item_total
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>{item.get('brand', '')}</strong><br>
                <span style="color: #666;">{item.get('name', '')}</span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">€{float(item.get('price', 0)):.2f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">€{item_total:.2f}</td>
        </tr>
        """
    
    payment_label = "💵 Наложен платеж (COD)" if payment_method == "cod" else "💳 Карта (Stripe)"
    payment_color = "#f59e0b" if payment_method == "cod" else "#10b981"
    
    # Format address
    address_parts = []
    if shipping_address.get('full_name'):
        address_parts.append(f"<strong>{shipping_address.get('full_name')}</strong>")
    if shipping_address.get('phone'):
        address_parts.append(f"📞 {shipping_address.get('phone')}")
    if shipping_address.get('office_name'):
        address_parts.append(f"📍 Офис: {shipping_address.get('office_name')}")
    elif shipping_address.get('address'):
        address_parts.append(f"📍 {shipping_address.get('address')}")
    if shipping_address.get('city'):
        address_parts.append(f"🏙️ {shipping_address.get('city')}")
    if shipping_address.get('notes'):
        address_parts.append(f"📝 {shipping_address.get('notes')}")
    
    address_html = "<br>".join(address_parts)
    
    tracking_html = ""
    if tracking_number:
        tracking_html = f"""
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46;">
                <strong>🚚 Товарителница:</strong> {tracking_number}<br>
                <a href="https://www.speedy.bg/bg/track-shipment?shipmentNumber={tracking_number}" style="color: #059669;">Проследи в Speedy →</a>
            </p>
        </div>
        """
    
    # Discount HTML for totals section
    discount_html = ""
    if discount_code and discount_amount > 0:
        discount_html = f"""
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #22c55e;">
                    <span>🏷️ Отстъпка ({discount_code}):</span>
                    <span>-€{discount_amount:.2f}</span>
                </div>"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0;">🎉 Нова поръчка!</h1>
                <p style="color: #666; margin-top: 10px;">Получена е нова поръчка в KOSTIN</p>
            </div>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
                <h2 style="margin: 0 0 10px 0; color: #166534;">Поръчка: {order_number}</h2>
                <p style="margin: 0; color: #166534;">
                    <span style="display: inline-block; background: {payment_color}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 13px;">
                        {payment_label}
                    </span>
                    {f'<span style="display: inline-block; background: #22c55e; color: white; padding: 4px 10px; border-radius: 4px; font-size: 13px; margin-left: 8px;">🏷️ Код: {discount_code}</span>' if discount_code else ''}
                </p>
            </div>
            
            <!-- Customer Info -->
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">👤 Клиент</h3>
                <p style="margin: 0; color: #4b5563;">
                    <strong>{customer_name}</strong><br>
                    📧 {customer_email}<br>
                    📞 {customer_phone}
                </p>
            </div>
            
            <!-- Shipping Address -->
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">📦 Адрес за доставка</h3>
                <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                    {address_html}
                </p>
                {tracking_html}
            </div>
            
            <!-- Items -->
            <h3 style="margin: 20px 0 10px 0; color: #374151;">🛒 Поръчани продукти</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 10px; text-align: left; font-size: 13px;">Продукт</th>
                        <th style="padding: 10px; text-align: center; font-size: 13px;">Кол.</th>
                        <th style="padding: 10px; text-align: right; font-size: 13px;">Цена</th>
                        <th style="padding: 10px; text-align: right; font-size: 13px;">Общо</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            
            <!-- Totals -->
            <div style="background: #1a1a1a; color: white; padding: 20px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Междинна сума:</span>
                    <span>€{subtotal:.2f}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Доставка:</span>
                    <span>€{shipping_cost:.2f}</span>
                </div>{discount_html}
                <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; border-top: 1px solid #333; padding-top: 10px; margin-top: 10px;">
                    <span>ОБЩО:</span>
                    <span style="color: #c9a86c;">€{total:.2f}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="{FRONTEND_URL}/admin" style="display: inline-block; background: #c9a86c; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                    Виж в Admin Panel →
                </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                Този имейл е автоматично генериран от KOSTIN система.
            </p>
        </div>
    </body>
    </html>
    """
    
    subject = f"🎉 Нова поръчка #{order_number} - €{total:.2f}"
    
    result = await send_email(ADMIN_EMAIL, subject, html_content)
    
    if result.get("status") == "success":
        logger.info(f"Admin new order notification sent for order {order_number} to {ADMIN_EMAIL}")
    else:
        logger.error(f"Failed to send admin new order notification: {result.get('error')}")
    
    return result
