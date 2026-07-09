import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Legal.css';

const PrivacyPolicyEN = () => (
  <div className="legal-content">
    <section className="legal-section company-info-section">
      <h2>Data Controller Information</h2>
      <div className="company-details">
        <p><strong>Company Name:</strong> GREEN POTENTIAL LTD (ГРИИН ПОТЕНШЪЛ ЕООД)</p>
        <p><strong>Company Registration Number (EIK):</strong> 208341137</p>
        <p><strong>Registered Address:</strong> Bulgaria, Pleven 5800, 4 Chataldzha Blvd., Entrance A, Floor 4, Apt. 10</p>
        <p><strong>Manager:</strong> Konstantin Valeriev Kirchev</p>
        <p><strong>Email:</strong> contact@kostinparfums.com</p>
        <p><strong>Phone:</strong> +359 889 567 870</p>
      </div>
    </section>
    <section className="legal-section">
      <h2>1. Introduction</h2>
      <p>GREEN POTENTIAL LTD, operating under the brand KOSTIN ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website (kostinparfums.com) and make purchases from our online store.</p>
      <p>We comply with the General Data Protection Regulation (GDPR), the Bulgarian Personal Data Protection Act, and other applicable European data protection laws.</p>
    </section>
    <section className="legal-section">
      <h2>2. Data Controller</h2>
      <p>GREEN POTENTIAL LTD (ГРИИН ПОТЕНШЪЛ ЕООД), EIK 208341137, is the data controller responsible for your personal data. If you have any questions about this Privacy Policy, please contact us at:</p>
      <ul>
        <li>Email: contact@kostinparfums.com</li>
        <li>Phone: +359 889 567 870</li>
        <li>Address: 4 Chataldzha Blvd., Entrance A, Floor 4, Apt. 10, Pleven 5800, Bulgaria</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>3. Information We Collect</h2>
      <h3>3.1 Personal Data</h3>
      <p>We may collect the following personal data:</p>
      <ul>
        <li><strong>Identity Data:</strong> First name, last name</li>
        <li><strong>Contact Data:</strong> Email address, phone number, shipping address, billing address</li>
        <li><strong>Transaction Data:</strong> Payment details, purchase history, order information</li>
        <li><strong>Technical Data:</strong> IP address, browser type, device information, cookies</li>
        <li><strong>Usage Data:</strong> How you use our website, pages visited, time spent</li>
        <li><strong>Marketing Data:</strong> Your preferences for receiving marketing communications</li>
      </ul>
      <h3>3.2 How We Collect Data</h3>
      <ul>
        <li>Directly from you when you create an account, make a purchase, or contact us</li>
        <li>Automatically through cookies and similar technologies</li>
        <li>From third-party payment processors (Stripe)</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>4. How We Use Your Data</h2>
      <p>We use your personal data for the following purposes:</p>
      <ul>
        <li>To process and fulfill your orders</li>
        <li>To manage your account and provide customer support</li>
        <li>To send order confirmations and shipping updates</li>
        <li>To improve our website and services</li>
        <li>To send marketing communications (with your consent)</li>
        <li>To comply with legal obligations</li>
        <li>To prevent fraud and ensure security</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>5. Legal Basis for Processing (GDPR)</h2>
      <ul>
        <li><strong>Contract:</strong> Processing necessary to fulfill orders</li>
        <li><strong>Consent:</strong> Marketing communications</li>
        <li><strong>Legitimate Interests:</strong> Improving our services, fraud prevention</li>
        <li><strong>Legal Obligation:</strong> Tax and accounting requirements</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>6. Data Sharing</h2>
      <p>We may share your data with:</p>
      <ul>
        <li><strong>Payment Processors:</strong> Stripe, for secure payment processing</li>
        <li><strong>Shipping Partners:</strong> To deliver your orders</li>
        <li><strong>Service Providers:</strong> Email services, analytics, hosting</li>
        <li><strong>Meta Platforms (Facebook/Instagram):</strong> Conversion data sent via Meta Pixel and Conversions API — only after explicit marketing cookie consent</li>
      </ul>
      <p>We do not sell your personal data to third parties.</p>
    </section>
    <section className="legal-section">
      <h2>6a. Meta Pixel and Conversions API (CAPI)</h2>
      <p>We use <strong>Meta Pixel</strong> (Facebook/Instagram script) and <strong>Meta Conversions API (CAPI)</strong> to measure the performance of our advertising campaigns. These technologies are activated <strong>only after explicit consent</strong> for marketing cookies.</p>
      <h3>What data is processed?</h3>
      <ul>
        <li><strong>Browser data (Meta Pixel):</strong> IP address, User-Agent, page URL, <code>_fbp</code> cookie, <code>fbclid</code> parameter</li>
        <li><strong>Event data (CAPI):</strong> Hashed email address, hashed phone number, order value, order ID — on completed purchase</li>
        <li>Data is hashed with SHA-256 before transmission and shared only with Meta Platforms Ireland Ltd.</li>
      </ul>
      <h3>Legal basis</h3>
      <p>Processing of data for marketing purposes via Meta Pixel/CAPI is based on <strong>explicit consent</strong> (Art. 6(1)(a) GDPR). You can withdraw your consent at any time via our cookie banner or by contacting us at contact@kostinparfums.com.</p>
      <h3>Limited Data Use</h3>
      <p>When processing data of California or other US state residents under applicable law, we enable the <em>Limited Data Use</em> flag in Meta Conversions API, which restricts Meta's use of the data to delivering advertising services only.</p>
    </section>
    <section className="legal-section">
      <h2>7. Your Rights (GDPR)</h2>
      <p>Under GDPR, you have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Rectify inaccurate data</li>
        <li>Request erasure of your data</li>
        <li>Restrict processing of your data</li>
        <li>Data portability</li>
        <li>Object to processing</li>
        <li>Withdraw consent at any time</li>
      </ul>
      <p>To exercise these rights, contact us at contact@kostinparfums.com.</p>
    </section>
    <section className="legal-section">
      <h2>8. Cookies</h2>
      <p>We use cookies to improve your browsing experience and analyze site traffic. <strong>Marketing cookies</strong> (including Meta Pixel) are activated only after your explicit consent. You can manage cookie preferences through our <a href="/cookies">cookie banner</a> or your browser settings.</p>
    </section>
    <section className="legal-section">
      <h2>9. Data Retention</h2>
      <p>We retain your personal data for as long as necessary to fulfill the purposes outlined in this policy, or as required by law. Order data is retained for 7 years for tax purposes.</p>
    </section>
    <section className="legal-section">
      <h2>10. Contact</h2>
      <p>For privacy-related inquiries:</p>
      <ul>
        <li>Email: <a href="mailto:contact@kostinparfums.com">contact@kostinparfums.com</a></li>
        <li>Phone: +359 889 567 870</li>
        <li>Address: 4 Chataldzha Blvd., Entrance A, Floor 4, Apt. 10, Pleven 5800, Bulgaria</li>
      </ul>
    </section>
  </div>
);

const PrivacyPolicyBG = () => (
  <div className="legal-content">
    <section className="legal-section company-info-section">
      <h2>Информация за администратора на данни</h2>
      <div className="company-details">
        <p><strong>Наименование:</strong> ГРИИН ПОТЕНШЪЛ ЕООД / GREEN POTENTIAL LTD</p>
        <p><strong>ЕИК:</strong> 208341137</p>
        <p><strong>Седалище и адрес на управление:</strong> България, гр. Плевен 5800, бул. Чаталджа № 4, вх. А, ет. 4, ап. 10</p>
        <p><strong>Управител:</strong> Константин Валериев Кирчев</p>
        <p><strong>Имейл:</strong> contact@kostinparfums.com</p>
        <p><strong>Телефон:</strong> +359 889 567 870</p>
      </div>
    </section>
    <section className="legal-section">
      <h2>1. Въведение</h2>
      <p>ГРИИН ПОТЕНШЪЛ ЕООД, оперираща под марката KOSTIN ("ние" или "нас") се ангажира да защитава вашата поверителност. Тази Политика за поверителност обяснява как събираме, използваме, разкриваме и защитаваме вашата информация, когато посещавате нашия уебсайт (kostinparfums.com) и правите покупки от нашия онлайн магазин.</p>
      <p>Ние спазваме Общия регламент за защита на данните (GDPR), Закона за защита на личните данни на Република България и другите приложими европейски закони за защита на данните.</p>
    </section>
    <section className="legal-section">
      <h2>2. Администратор на данни</h2>
      <p>ГРИИН ПОТЕНШЪЛ ЕООД, ЕИК 208341137, е администраторът на данни, отговорен за вашите лични данни. Ако имате въпроси относно тази Политика за поверителност, моля свържете се с нас на:</p>
      <ul>
        <li>Имейл: contact@kostinparfums.com</li>
        <li>Телефон: +359 889 567 870</li>
        <li>Адрес: бул. Чаталджа № 4, вх. А, ет. 4, ап. 10, гр. Плевен 5800, България</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>3. Информация, която събираме</h2>
      <h3>3.1 Лични данни</h3>
      <p>Можем да събираме следните лични данни:</p>
      <ul>
        <li><strong>Данни за самоличност:</strong> Име, фамилия</li>
        <li><strong>Данни за контакт:</strong> Имейл адрес, телефон, адрес за доставка, адрес за фактуриране</li>
        <li><strong>Данни за транзакции:</strong> Данни за плащане, история на покупките, информация за поръчки</li>
        <li><strong>Технически данни:</strong> IP адрес, тип браузър, информация за устройството, бисквитки</li>
        <li><strong>Данни за използване:</strong> Как използвате нашия уебсайт, посетени страници, прекарано време</li>
        <li><strong>Маркетингови данни:</strong> Вашите предпочитания за получаване на маркетингови съобщения</li>
      </ul>
      <h3>3.2 Как събираме данни</h3>
      <ul>
        <li>Директно от вас, когато създавате акаунт, правите покупка или се свързвате с нас</li>
        <li>Автоматично чрез бисквитки и подобни технологии</li>
        <li>От доставчици на платежни услуги (Stripe)</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>4. Как използваме вашите данни</h2>
      <p>Използваме вашите лични данни за следните цели:</p>
      <ul>
        <li>За обработка и изпълнение на вашите поръчки</li>
        <li>За управление на вашия акаунт и предоставяне на клиентска поддръжка</li>
        <li>За изпращане на потвърждения за поръчки и актуализации за доставка</li>
        <li>За подобряване на нашия уебсайт и услуги</li>
        <li>За изпращане на маркетингови съобщения (с вашето съгласие)</li>
        <li>За спазване на правни задължения</li>
        <li>За предотвратяване на измами и осигуряване на сигурност</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>5. Правно основание за обработка (GDPR)</h2>
      <ul>
        <li><strong>Договор:</strong> Обработка, необходима за изпълнение на поръчки</li>
        <li><strong>Съгласие:</strong> Маркетингови съобщения</li>
        <li><strong>Легитимни интереси:</strong> Подобряване на нашите услуги, предотвратяване на измами</li>
        <li><strong>Правно задължение:</strong> Данъчни и счетоводни изисквания</li>
      </ul>
    </section>
    <section className="legal-section">
      <h2>6. Споделяне на данни</h2>
      <p>Можем да споделяме вашите данни с:</p>
      <ul>
        <li><strong>Доставчици на платежни услуги:</strong> Stripe, за сигурна обработка на плащания</li>
        <li><strong>Куриерски партньори:</strong> За доставка на вашите поръчки</li>
        <li><strong>Доставчици на услуги:</strong> Имейл услуги, анализи, хостинг</li>
        <li><strong>Meta Platforms (Facebook/Instagram):</strong> Данни за реализации от реклами, изпратени чрез Meta Pixel и Conversions API — само след изрично съгласие за маркетингови бисквитки</li>
      </ul>
      <p>Ние не продаваме вашите лични данни на трети страни.</p>
    </section>
    <section className="legal-section">
      <h2>6а. Meta Pixel и Conversions API (CAPI)</h2>
      <p>Използваме <strong>Meta Pixel</strong> (скрипт на Facebook/Instagram) и <strong>Meta Conversions API (CAPI)</strong> за измерване на ефективността на нашите рекламни кампании. Тези технологии се активират <strong>единствено след изрично съгласие</strong> за маркетингови бисквитки.</p>
      <h3>Какви данни се обработват?</h3>
      <ul>
        <li><strong>Данни от браузъра (Meta Pixel):</strong> IP адрес, User-Agent, URL на страницата, бисквитка <code>_fbp</code>, параметър <code>fbclid</code></li>
        <li><strong>Данни за събитие (CAPI):</strong> Хеширан имейл адрес, хеширан телефон, стойност на поръчката, идентификатор на поръчката — при завършена покупка</li>
        <li>Данните се хешират с SHA-256 преди изпращане и се предоставят само на Meta Platforms Ireland Ltd.</li>
      </ul>
      <h3>Правно основание</h3>
      <p>Обработката на данни за маркетингови цели чрез Meta Pixel/CAPI се извършва на основание <strong>изрично съгласие</strong> (чл. 6, ал. 1, буква „а" от GDPR). Можете да оттеглите съгласието си по всяко време чрез нашия банер за бисквитки или като се свържете с нас на contact@kostinparfums.com.</p>
      <h3>Ограничено използване на данни (Limited Data Use)</h3>
      <p>Когато обработваме данни на жители на Калифорния или други щати с приложимо законодателство, активираме флага <em>Limited Data Use</em> в Meta Conversions API, което ограничава използването на данните от Meta само до доставяне на рекламни услуги.</p>
    </section>
    <section className="legal-section">
      <h2>7. Вашите права (GDPR)</h2>
      <p>Съгласно GDPR, вие имате право да:</p>
      <ul>
        <li>Достъп до вашите лични данни</li>
        <li>Коригиране на неточни данни</li>
        <li>Заявка за изтриване на вашите данни</li>
        <li>Ограничаване на обработката на вашите данни</li>
        <li>Преносимост на данните</li>
        <li>Възражение срещу обработката</li>
        <li><strong>Оттегляне на съгласие по всяко време</strong> — включително съгласието за маркетингови бисквитки (Meta Pixel)</li>
      </ul>
      <p>За да упражните тези права или да оттеглите съгласието си за маркетингово проследяване, свържете се с нас на <a href="mailto:contact@kostinparfums.com">contact@kostinparfums.com</a> или актуализирайте настройките си чрез <a href="/cookies">управлението на бисквитки</a>.</p>
    </section>
    <section className="legal-section">
      <h2>8. Бисквитки</h2>
      <p>Използваме бисквитки за подобряване на вашето сърфиране и анализ на трафика на сайта. <strong>Маркетингови бисквитки</strong> (включително Meta Pixel) се активират само след изрично съгласие от ваша страна. Можете да управлявате предпочитанията за бисквитки чрез нашия <a href="/cookies">банер за бисквитки</a> или настройките на вашия браузър.</p>
    </section>
    <section className="legal-section">
      <h2>9. Съхранение на данни</h2>
      <p>Съхраняваме вашите лични данни толкова дълго, колкото е необходимо за целите, описани в тази политика, или както се изисква от закона. Данните за поръчки се съхраняват 7 години за данъчни цели.</p>
    </section>
    <section className="legal-section">
      <h2>10. Контакт</h2>
      <p>За запитвания свързани с поверителност:</p>
      <ul>
        <li>Имейл: <a href="mailto:contact@kostinparfums.com">contact@kostinparfums.com</a></li>
        <li>Телефон: +359 889 567 870</li>
        <li>Адрес: бул. Чаталджа № 4, вх. А, ет. 4, ап. 10, гр. Плевен 5800, България</li>
      </ul>
    </section>
  </div>
);

const PrivacyPolicy = () => {
  const { lang, t } = useLanguage();
  return (
    <div className="legal-page">
      <div className="container section-padding">
        <div className="legal-header">
          <h1 className="section-title">{t('privacyPolicy').toUpperCase()}</h1>
          <p className="legal-updated">{lang === 'bg' ? 'Последна актуализация: Януари 2025' : 'Last updated: January 2025'}</p>
        </div>
        {lang === 'bg' ? <PrivacyPolicyBG /> : <PrivacyPolicyEN />}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
