import React from 'react';
import './Legal.css';

const TermsOfService = () => {
  return (
    <div className="legal-page">
      <div className="container section-padding">
        <div className="legal-header">
          <h1 className="section-title">TERMS OF SERVICE</h1>
          <p className="legal-updated">Last updated: January 2025</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              Welcome to KOSTIN. These Terms of Service ("Terms") govern your use of our website and the purchase of products from our online store. By accessing our website or making a purchase, you agree to be bound by these Terms.
            </p>
            <p>
              KOSTIN operates in compliance with European Union consumer protection laws, including the Consumer Rights Directive (2011/83/EU).
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Company Information</h2>
            <ul>
              <li>Company Name: KOSTIN</li>
              <li>Location: Brussels, Belgium, EU</li>
              <li>Email: contact@kostin.com</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Products and Pricing</h2>
            <h3>3.1 Product Information</h3>
            <p>
              We strive to provide accurate product descriptions and images. However, colors may vary slightly due to monitor settings. All products are authentic luxury cosmetics from authorized distributors.
            </p>

            <h3>3.2 Pricing</h3>
            <p>
              All prices are displayed in Euros (€) and include applicable VAT for EU customers. Prices are subject to change without notice, but changes will not affect orders already placed.
            </p>

            <h3>3.3 Availability</h3>
            <p>
              Product availability is subject to change. If a product becomes unavailable after you place an order, we will contact you to offer alternatives or a full refund.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Orders and Payment</h2>
            <h3>4.1 Placing Orders</h3>
            <p>
              By placing an order, you confirm that you are at least 18 years old or have parental consent. You agree that all information provided is accurate and complete.
            </p>

            <h3>4.2 Order Confirmation</h3>
            <p>
              You will receive an email confirmation upon placing your order. A contract is formed when we send a shipping confirmation email.
            </p>

            <h3>4.3 Payment Methods</h3>
            <p>
              We accept major credit cards, debit cards, and other payment methods as displayed at checkout. All payments are processed securely through our payment providers.
            </p>

            <h3>4.4 Order Cancellation</h3>
            <p>
              You may cancel your order before it has been shipped by contacting us at orders@kostin.com.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Shipping</h2>
            <h3>5.1 Shipping Areas</h3>
            <p>
              We currently ship to all European Union member states. We do not ship outside of Europe at this time.
            </p>

            <h3>5.2 Shipping Costs</h3>
            <ul>
              <li>Orders over €100: FREE shipping</li>
              <li>Orders under €100: Standard shipping rates apply (calculated at checkout)</li>
            </ul>

            <h3>5.3 Delivery Times</h3>
            <p>
              Standard delivery within the EU typically takes 3-7 business days, depending on your location. Express shipping options may be available at checkout.
            </p>

            <h3>5.4 Risk of Loss</h3>
            <p>
              In accordance with EU consumer law, the risk of loss passes to you when you or a third party indicated by you takes physical possession of the goods.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Right of Withdrawal (EU Consumer Rights)</h2>
            <h3>6.1 14-Day Withdrawal Period</h3>
            <p>
              Under EU law, you have the right to withdraw from your purchase within 14 days of receiving your order without giving any reason.
            </p>

            <h3>6.2 How to Exercise Your Right</h3>
            <p>
              To exercise your right of withdrawal, you must inform us of your decision by a clear statement (e.g., email to returns@kostin.com). You may use the model withdrawal form, but it is not obligatory.
            </p>

            <h3>6.3 Effects of Withdrawal</h3>
            <p>
              If you withdraw, we will reimburse all payments received, including delivery costs (except for supplementary costs if you chose a delivery type other than the least expensive standard delivery). Reimbursement will be made within 14 days using the same payment method you used.
            </p>

            <h3>6.4 Conditions for Returns</h3>
            <p>
              Products must be returned unused, in original packaging, with all seals intact. For hygiene reasons, we cannot accept returns of opened cosmetic products unless defective.
            </p>

            <h3>6.5 Exceptions</h3>
            <p>
              The right of withdrawal does not apply to sealed goods which are not suitable for return due to health protection or hygiene reasons if unsealed after delivery.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Returns and Refunds</h2>
            <h3>7.1 Defective Products</h3>
            <p>
              If you receive a defective or damaged product, please contact us within 48 hours at returns@kostin.com with photos of the damage. We will arrange a replacement or full refund.
            </p>

            <h3>7.2 Return Process</h3>
            <p>
              To initiate a return:
            </p>
            <ol>
              <li>Contact us at returns@kostin.com</li>
              <li>Receive a Return Authorization Number</li>
              <li>Ship the product back in its original packaging</li>
              <li>Receive your refund within 14 days of us receiving the return</li>
            </ol>

            <h3>7.3 Return Shipping Costs</h3>
            <p>
              You are responsible for return shipping costs unless the product is defective or we made an error with your order.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Legal Guarantee</h2>
            <p>
              Under EU law, you benefit from a legal guarantee of conformity for goods. If a product does not conform to the contract within 2 years of delivery, you may request repair, replacement, price reduction, or contract termination.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Intellectual Property</h2>
            <p>
              All content on this website, including text, graphics, logos, and images, is the property of KOSTIN or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Limitation of Liability</h2>
            <p>
              To the extent permitted by law, KOSTIN shall not be liable for any indirect, incidental, special, or consequential damages. Our total liability shall not exceed the amount you paid for the specific product giving rise to the claim.
            </p>
            <p>
              Nothing in these Terms limits your statutory rights as a consumer under EU law.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Dispute Resolution</h2>
            <h3>12.1 Customer Service</h3>
            <p>
              If you have a complaint, please contact us first at contact@kostin.com. We will try to resolve any issues promptly.
            </p>

            <h3>12.2 Online Dispute Resolution</h3>
            <p>
              The European Commission provides an Online Dispute Resolution (ODR) platform for consumers: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>
            </p>

            <h3>12.3 Governing Law</h3>
            <p>
              These Terms are governed by Belgian law. If you are a consumer residing in the EU, you also benefit from mandatory provisions of your country of residence.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be effective upon posting on our website. Your continued use of our website after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Contact Us</h2>
            <p>
              For any questions about these Terms of Service, please contact us:
            </p>
            <ul>
              <li>Email: contact@kostin.com</li>
              <li>Address: Brussels, Belgium, EU</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
