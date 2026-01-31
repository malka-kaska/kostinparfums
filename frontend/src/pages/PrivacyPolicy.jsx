import React from 'react';
import './Legal.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page">
      <div className="container section-padding">
        <div className="legal-header">
          <h1 className="section-title">PRIVACY POLICY</h1>
          <p className="legal-updated">Last updated: January 2025</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              KOSTIN ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases from our online store.
            </p>
            <p>
              We comply with the General Data Protection Regulation (GDPR) and other applicable European data protection laws.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Data Controller</h2>
            <p>
              KOSTIN is the data controller responsible for your personal data. If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@kostin.com</li>
              <li>Address: Brussels, Belgium, EU</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Information We Collect</h2>
            <h3>3.1 Personal Data</h3>
            <p>We may collect the following personal data:</p>
            <ul>
              <li>Name and contact information (email address, phone number)</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (processed securely through our payment providers)</li>
              <li>Order history and preferences</li>
              <li>Account credentials</li>
            </ul>

            <h3>3.2 Automatically Collected Data</h3>
            <p>When you visit our website, we automatically collect:</p>
            <ul>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Legal Basis for Processing (GDPR)</h2>
            <p>We process your personal data based on:</p>
            <ul>
              <li><strong>Contract Performance:</strong> To fulfill orders and provide our services</li>
              <li><strong>Legitimate Interest:</strong> To improve our website and services</li>
              <li><strong>Legal Obligation:</strong> To comply with tax and accounting requirements</li>
              <li><strong>Consent:</strong> For marketing communications (when applicable)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. How We Use Your Information</h2>
            <p>We use your personal data to:</p>
            <ul>
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders</li>
              <li>Provide customer support</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Data Sharing</h2>
            <p>We may share your data with:</p>
            <ul>
              <li><strong>Payment Processors:</strong> To process transactions securely</li>
              <li><strong>Shipping Partners:</strong> To deliver your orders within Europe</li>
              <li><strong>Service Providers:</strong> Who help us operate our business</li>
              <li><strong>Legal Authorities:</strong> When required by law</li>
            </ul>
            <p>We do not sell your personal data to third parties.</p>
          </section>

          <section className="legal-section">
            <h2>7. International Transfers</h2>
            <p>
              Your data is primarily stored and processed within the European Economic Area (EEA). If we transfer data outside the EEA, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the European Commission.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Data Retention</h2>
            <p>We retain your personal data for:</p>
            <ul>
              <li>Active accounts: As long as your account is active</li>
              <li>Order data: 7 years for tax and legal compliance</li>
              <li>Marketing data: Until you withdraw consent</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Your Rights (GDPR)</h2>
            <p>Under GDPR, you have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Restriction:</strong> Limit how we use your data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Object:</strong> Object to processing based on legitimate interest</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p>
              To exercise these rights, contact us at privacy@kostin.com. We will respond within 30 days.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Cookies</h2>
            <p>
              We use cookies to improve your browsing experience. You can manage cookie preferences through your browser settings. For more information, see our Cookie Policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Complaints</h2>
            <p>
              If you believe your data protection rights have been violated, you have the right to lodge a complaint with your local Data Protection Authority. In Belgium, this is the Data Protection Authority (Gegevensbeschermingsautoriteit).
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our website and updating the "Last updated" date.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Contact Us</h2>
            <p>
              For any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul>
              <li>Email: privacy@kostin.com</li>
              <li>Address: Brussels, Belgium, EU</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
