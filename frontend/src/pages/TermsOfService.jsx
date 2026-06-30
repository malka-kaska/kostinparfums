import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Legal.css';

const TermsEN = () => (
  <div className="legal-content">
    <section className="legal-section company-info-section">
      <h2>Company Information</h2>
      <div className="company-details">
        <p><strong>Company Name:</strong> GREEN POTENTIAL LTD (ГРИИН ПОТЕНШЪЛ ЕООД)</p>
        <p><strong>Company Registration Number (EIK):</strong> 208341137</p>
        <p><strong>Registered Address:</strong> Bulgaria, Pleven 5800, 4 Chataldzha Blvd., Entrance A, Floor 4, Apt. 10</p>
        <p><strong>Manager:</strong> Konstantin Valeriev Kirchev</p>
        <p><strong>Email:</strong> contact@kostinparfums.com</p>
        <p><strong>Phone:</strong> +359 889 567 870</p>
        <p><strong>Business Activity:</strong> Retail trade in perfumery and cosmetic products (NACE 47.75)</p>
      </div>
    </section>
    <section className="legal-section">
      <h2>1. General</h2>
      <p>These Terms of Service ("Terms") govern your use of the KOSTIN website (kostinparfums.com) and online store, operated by GREEN POTENTIAL LTD. By accessing or using our website, you agree to be bound by these Terms. If you do not agree to all Terms, please do not use our website.</p>
    </section>
    <section className="legal-section">
      <h2>2. Products and Pricing</h2>
      <ul>
        <li>All products sold through KOSTIN are 100% authentic and sourced from authorized distributors.</li>
        <li>Prices are displayed in Euros (EUR) and include applicable VAT.</li>
        <li>We reserve the right to modify prices at any time without prior notice.</li>
        <li>Product images are for illustration purposes. Actual packaging may vary.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>3. Orders</h2>
      <ul>
        <li>By placing an order, you make an offer to purchase products from us.</li>
        <li>We reserve the right to accept or decline your order for any reason.</li>
        <li>Order confirmation will be sent to your registered email address.</li>
        <li>Orders can be cancelled within 24 hours of placement by contacting customer service.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>4. Payment</h2>
      <ul>
        <li>We accept major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay.</li>
        <li>All payments are processed securely through Stripe.</li>
        <li>Payment is charged at the time of order placement.</li>
        <li>All transactions are encrypted with industry-standard SSL technology.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>5. Shipping</h2>
      <ul>
        <li>We currently ship to all EU countries.</li>
        <li>Standard shipping: 3-5 business days (EUR 6.99)</li>
        <li>Express shipping: 1-2 business days (EUR 14.99)</li>
        <li>Free shipping on orders over EUR 90.</li>
        <li>Delivery times are estimates and may vary.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>6. Returns and Refunds</h2>
      <ul>
        <li>Returns accepted within 30 days of delivery.</li>
        <li>Products must be unopened, unused, and in original packaging.</li>
        <li>Opened cosmetics and fragrances cannot be returned for hygiene reasons.</li>
        <li>Refunds are processed to the original payment method within 5-7 business days.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>7. User Accounts</h2>
      <ul>
        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
        <li>You must provide accurate and complete information when creating an account.</li>
        <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>8. Intellectual Property</h2>
      <p>All content on this website, including text, images, logos, and design, is the property of KOSTIN or its licensors and is protected by copyright and intellectual property laws. Product names and brands remain the property of their respective owners.</p>
    </section>
    <section className="legal-section">
      <h2>9. Limitation of Liability</h2>
      <p>KOSTIN shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our website or products, to the maximum extent permitted by applicable law.</p>
    </section>
    <section className="legal-section">
      <h2>10. Governing Law</h2>
      <p>These Terms are governed by and construed in accordance with the laws of the Republic of Bulgaria and applicable EU regulations. Any disputes shall be subject to the exclusive jurisdiction of the courts of Pleven, Bulgaria.</p>
    </section>
    <section className="legal-section">
      <h2>11. Contact</h2>
      <p>For questions about these Terms:</p>
      <ul>
        <li>Email: <a href="mailto:contact@kostinparfums.com">contact@kostinparfums.com</a></li>
        <li>Phone: +359 889 567 870</li>
        <li>Address: 4 Chataldzha Blvd., Entrance A, Floor 4, Apt. 10, Pleven 5800, Bulgaria</li>
      </ul>
    </section>
  </div>
);

const TermsBG = () => (
  <div className="legal-content">
    <section className="legal-section company-info-section">
      <h2>Информация за търговеца</h2>
      <div className="company-details">
        <p><strong>Наименование:</strong> ГРИИН ПОТЕНШЪЛ ЕООД / GREEN POTENTIAL LTD</p>
        <p><strong>ЕИК:</strong> 208341137</p>
        <p><strong>Седалище и адрес на управление:</strong> България, гр. Плевен 5800, бул. Чаталджа № 4, вх. А, ет. 4, ап. 10</p>
        <p><strong>Управител:</strong> Константин Валериев Кирчев</p>
        <p><strong>Имейл:</strong> contact@kostinparfums.com</p>
        <p><strong>Телефон:</strong> +359 889 567 870</p>
        <p><strong>Дейност:</strong> Търговия на дребно с парфюмерийни и козметични стоки (КИД 47.75)</p>
      </div>
    </section>
    <section className="legal-section">
      <h2>1. Общи положения</h2>
      <p>Тези Условия за ползване ("Условия") уреждат използването на уебсайта KOSTIN (kostinparfums.com) и онлайн магазина, управляван от ГРИИН ПОТЕНШЪЛ ЕООД. С достъпа или използването на нашия уебсайт, вие се съгласявате да бъдете обвързани с тези Условия. Ако не сте съгласни с всички Условия, моля не използвайте нашия уебсайт.</p>
    </section>
    <section className="legal-section">
      <h2>2. Продукти и цени</h2>
      <ul>
        <li>Всички продукти, продавани чрез KOSTIN, са 100% автентични и доставени от оторизирани дистрибутори.</li>
        <li>Цените са показани в евро (EUR) и включват приложимия ДДС.</li>
        <li>Запазваме си правото да променяме цените по всяко време без предварително уведомление.</li>
        <li>Изображенията на продуктите са с илюстративна цел. Действителната опаковка може да се различава.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>3. Поръчки</h2>
      <ul>
        <li>С подаването на поръчка вие правите предложение за закупуване на продукти от нас.</li>
        <li>Запазваме си правото да приемем или откажем вашата поръчка по каквато и да е причина.</li>
        <li>Потвърждение на поръчката ще бъде изпратено на вашия регистриран имейл адрес.</li>
        <li>Поръчките могат да бъдат отменени в рамките на 24 часа от подаването чрез контакт с обслужването на клиенти.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>4. Плащане</h2>
      <ul>
        <li>Приемаме основни кредитни карти (Visa, Mastercard, American Express), PayPal и Apple Pay.</li>
        <li>Всички плащания се обработват сигурно чрез Stripe.</li>
        <li>Плащането се таксува в момента на подаване на поръчката.</li>
        <li>Всички транзакции са криптирани с индустриална SSL технология.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>5. Доставка</h2>
      <ul>
        <li>В момента доставяме до всички страни от ЕС.</li>
        <li>Стандартна доставка: 3-5 работни дни (EUR 6.99)</li>
        <li>Експресна доставка: 1-2 работни дни (EUR 14.99)</li>
        <li>Безплатна доставка за поръчки над EUR 90.</li>
        <li>Сроковете за доставка са приблизителни и могат да варират.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>6. Връщане и възстановяване</h2>
      <ul>
        <li>Връщания се приемат до 30 дни след доставката.</li>
        <li>Продуктите трябва да са неотваряни, неизползвани и в оригинална опаковка.</li>
        <li>Отворена козметика и парфюми не могат да бъдат върнати по хигиенни причини.</li>
        <li>Възстановяванията се обработват по оригиналния метод на плащане в рамките на 5-7 работни дни.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>7. Потребителски акаунти</h2>
      <ul>
        <li>Вие сте отговорни за поддържането на поверителността на вашите данни за достъп.</li>
        <li>Трябва да предоставите точна и пълна информация при създаване на акаунт.</li>
        <li>Запазваме си правото да спрем или прекратим акаунти, нарушаващи тези Условия.</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>8. Интелектуална собственост</h2>
      <p>Цялото съдържание на този уебсайт, включително текст, изображения, логотипи и дизайн, е собственост на KOSTIN или неговите лицензодатели и е защитено от закони за авторско право и интелектуална собственост. Имената на продуктите и марките остават собственост на съответните им притежатели.</p>
    </section>
    <section className="legal-section">
      <h2>9. Ограничение на отговорността</h2>
      <p>KOSTIN не носи отговорност за каквито и да е косвени, случайни, специални или последващи щети, произтичащи от използването на нашия уебсайт или продукти, до максималната степен, позволена от приложимото законодателство.</p>
    </section>
    <section className="legal-section">
      <h2>10. Приложимо право</h2>
      <p>Тези Условия се уреждат и тълкуват в съответствие със законите на Република България и приложимите регулации на ЕС. Всякакви спорове подлежат на изключителната юрисдикция на съдилищата в гр. Плевен, България.</p>
    </section>
    <section className="legal-section">
      <h2>11. Контакт</h2>
      <p>За въпроси относно тези Условия:</p>
      <ul>
        <li>Имейл: <a href="mailto:contact@kostinparfums.com">contact@kostinparfums.com</a></li>
        <li>Телефон: +359 889 567 870</li>
        <li>Адрес: бул. Чаталджа № 4, вх. А, ет. 4, ап. 10, гр. Плевен 5800, България</li>
      </ul>
    </section>
  </div>
);

const TermsOfService = () => {
  const { lang, t } = useLanguage();
  return (
    <div className="legal-page">
      <div className="container section-padding">
        <div className="legal-header">
          <h1 className="section-title">{t('termsOfService').toUpperCase()}</h1>
          <p className="legal-updated">{lang === 'bg' ? 'Последна актуализация: Януари 2025' : 'Last updated: January 2025'}</p>
        </div>
        {lang === 'bg' ? <TermsBG /> : <TermsEN />}
      </div>
    </div>
  );
};

export default TermsOfService;
