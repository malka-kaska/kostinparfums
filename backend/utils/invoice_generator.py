"""
Invoice PDF Generator for KOSTIN Parfums
Generates electronic invoices/receipts for card payments
"""
import os
import io
from datetime import datetime, timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import logging

logger = logging.getLogger(__name__)

# Company info from environment
COMPANY_NAME = os.getenv("COMPANY_NAME", "ГРИИН ПОТЕНШЪЛ ЕООД")
COMPANY_EIK = os.getenv("COMPANY_EIK", "207776215")
COMPANY_VAT = os.getenv("COMPANY_VAT", "BG207776215")
COMPANY_ADDRESS = os.getenv("COMPANY_ADDRESS", "гр. Варна, бул. Цар Освободител 263А")
COMPANY_CITY = os.getenv("COMPANY_CITY", "Варна")
COMPANY_COUNTRY = os.getenv("COMPANY_COUNTRY", "България")
COMPANY_PHONE = os.getenv("COMPANY_PHONE", "+359889567870")
COMPANY_EMAIL = os.getenv("COMPANY_EMAIL", "contact@kostinparfums.com")
COMPANY_MOL = os.getenv("COMPANY_MOL", "Константин Кирчев")

# VAT rate in Bulgaria
VAT_RATE = 0.20


def generate_invoice_pdf(order: dict) -> bytes:
    """
    Generate a PDF invoice for an order.
    Returns the PDF as bytes.
    """
    buffer = io.BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    # Build the content
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=10,
        alignment=1  # Center
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=9,
        spaceAfter=3
    )
    
    # Title
    order_number = order.get("order_number", order.get("_id", "N/A"))
    invoice_date = datetime.now(timezone.utc).strftime("%d.%m.%Y")
    
    elements.append(Paragraph("РАЗПИСКА / RECEIPT", title_style))
    elements.append(Paragraph(f"No: {order_number}", ParagraphStyle('Center', parent=styles['Normal'], alignment=1, fontSize=12)))
    elements.append(Paragraph(f"Дата: {invoice_date}", ParagraphStyle('Center', parent=styles['Normal'], alignment=1, fontSize=10)))
    elements.append(Spacer(1, 10*mm))
    
    # Two-column header: Seller | Buyer
    seller_info = f"""
    <b>ДОСТАВЧИК / SELLER:</b><br/>
    {COMPANY_NAME}<br/>
    ЕИК: {COMPANY_EIK}<br/>
    ДДС No: {COMPANY_VAT}<br/>
    Адрес: {COMPANY_ADDRESS}<br/>
    Тел: {COMPANY_PHONE}<br/>
    Email: {COMPANY_EMAIL}<br/>
    МОЛ: {COMPANY_MOL}
    """
    
    shipping_address = order.get("shipping_address", {})
    buyer_name = shipping_address.get("full_name", order.get("user_name", "N/A"))
    buyer_email = shipping_address.get("email", order.get("user_email", "N/A"))
    buyer_phone = shipping_address.get("phone", "N/A")
    buyer_address = shipping_address.get("address", "N/A")
    buyer_city = shipping_address.get("city", "N/A")
    
    buyer_info = """
    <b>ПОЛУЧАТЕЛ / BUYER:</b><br/>
    {name}<br/>
    Адрес: {address}<br/>
    Град: {city}<br/>
    Тел: {phone}<br/>
    Email: {email}
    """.format(name=buyer_name, address=buyer_address, city=buyer_city, phone=buyer_phone, email=buyer_email)
    
    # Create two-column table for header
    header_data = [[
        Paragraph(seller_info, normal_style),
        Paragraph(buyer_info, normal_style)
    ]]
    
    header_table = Table(header_data, colWidths=[85*mm, 85*mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10*mm))
    
    # Payment info
    payment_method = order.get("payment_method", "card")
    payment_text = "Картово плащане / Card Payment" if payment_method == "card" else "Наложен платеж / COD"
    elements.append(Paragraph(f"<b>Метод на плащане:</b> {payment_text}", normal_style))
    elements.append(Spacer(1, 5*mm))
    
    # Items table
    items = order.get("items", [])
    
    # Table header
    table_data = [["No", "Артикул / Item", "Кол.", "Ед. цена", "ДДС 20%", "Стойност"]]
    
    subtotal = 0
    total_vat = 0
    
    for idx, item in enumerate(items, 1):
        name = f"{item.get('brand', '')} {item.get('name', 'Артикул')}"
        quantity = item.get("quantity", 1)
        unit_price = float(item.get("price", 0))
        line_total = unit_price * quantity
        line_vat = line_total * VAT_RATE / (1 + VAT_RATE)  # VAT is included in price
        
        subtotal += line_total
        total_vat += line_vat
        
        table_data.append([
            str(idx),
            name[:40],  # Truncate long names
            str(quantity),
            f"{unit_price:.2f} EUR",
            f"{line_vat:.2f} EUR",
            f"{line_total:.2f} EUR"
        ])
    
    # Add shipping if applicable
    shipping_cost = float(order.get("shipping_cost", 0))
    if shipping_cost > 0:
        shipping_vat = shipping_cost * VAT_RATE / (1 + VAT_RATE)
        total_vat += shipping_vat
        subtotal += shipping_cost
        table_data.append([
            "",
            "Доставка / Shipping",
            "1",
            f"{shipping_cost:.2f} EUR",
            f"{shipping_vat:.2f} EUR",
            f"{shipping_cost:.2f} EUR"
        ])
    
    # Add discount if applicable
    discount_amount = float(order.get("discount_amount", 0))
    if discount_amount > 0:
        discount_code = order.get("discount_code", "")
        discount_vat = discount_amount * VAT_RATE / (1 + VAT_RATE)
        total_vat -= discount_vat
        subtotal -= discount_amount
        table_data.append([
            "",
            f"Отстъпка / Discount ({discount_code})",
            "",
            "",
            f"-{discount_vat:.2f} EUR",
            f"-{discount_amount:.2f} EUR"
        ])
    
    # Create items table
    items_table = Table(table_data, colWidths=[10*mm, 70*mm, 15*mm, 25*mm, 25*mm, 25*mm])
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.79, 0.66, 0.43)),  # Gold color
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 1), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWHEIGHT', (0, 0), (-1, -1), 8*mm),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 5*mm))
    
    # Totals
    total = float(order.get("total", subtotal))
    net_amount = total - total_vat
    
    totals_data = [
        ["", "", "", "", "Данъчна основа / Net:", f"{net_amount:.2f} EUR"],
        ["", "", "", "", "ДДС 20% / VAT 20%:", f"{total_vat:.2f} EUR"],
        ["", "", "", "", "ОБЩО / TOTAL:", f"{total:.2f} EUR"],
    ]
    
    # BGN equivalent
    eur_to_bgn = 1.95583
    total_bgn = total * eur_to_bgn
    totals_data.append(["", "", "", "", "Равностойност / Equiv.:", f"{total_bgn:.2f} BGN"])
    
    totals_table = Table(totals_data, colWidths=[10*mm, 70*mm, 15*mm, 25*mm, 25*mm, 25*mm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (4, 0), (4, -1), 'RIGHT'),
        ('ALIGN', (5, 0), (5, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTSIZE', (4, 2), (5, 2), 11),  # Total row bigger
        ('TEXTCOLOR', (4, 2), (5, 2), colors.Color(0.79, 0.66, 0.43)),  # Gold
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 10*mm))
    
    # Tracking info if available
    tracking_number = order.get("tracking_number")
    if tracking_number:
        elements.append(Paragraph(f"<b>Номер за проследяване / Tracking:</b> {tracking_number}", normal_style))
        tracking_url = order.get("tracking_url", f"https://www.speedy.bg/bg/track-shipment?shipmentNumber={tracking_number}")
        elements.append(Paragraph(f"<b>Линк:</b> {tracking_url}", normal_style))
        elements.append(Spacer(1, 5*mm))
    
    # Footer
    footer_text = """
    <br/><br/>
    Този документ е електронна разписка за извършено плащане.<br/>
    This document is an electronic receipt for payment made.<br/><br/>
    Благодарим Ви, че пазарувахте от KOSTIN Parfums!<br/>
    Thank you for shopping at KOSTIN Parfums!<br/><br/>
    www.kostinparfums.com | contact@kostinparfums.com
    """
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=1)))
    
    # Build PDF
    doc.build(elements)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    logger.info(f"Generated invoice PDF for order {order_number}, size: {len(pdf_bytes)} bytes")
    return pdf_bytes


def generate_invoice_number(order_id: str) -> str:
    """Generate a unique invoice number based on order ID and date"""
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"INV-{date_part}-{order_id[-6:].upper()}"
