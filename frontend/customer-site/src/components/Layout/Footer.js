import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Using Link from react-router-dom
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'; // Import WhatsApp icon

import './Footer.css'; // We'll create this for custom styles

const Footer = () => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const currentLang = i18n.language;

  return (
    <footer className={`site-footer ${currentLang === 'ar' ? 'rtl' : 'ltr'}`} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <Container>
        <Row className="py-5">
          <Col md={4} className="mb-4 mb-md-0 footer-col">
            <h5>{t('footer.aboutTitle', 'مفروشات عروبة المنار')}</h5>
            <p className="footer-about-text">
              {t('footer.aboutText', 'وجهتك المثالية لتجديد منزلك بأجود أنواع المفروشات التي تجمع بين الفخامة والجودة. نختص في السجاد، الموكيت، المجالس العربية، والستائر.')}
            </p>
          </Col>

          <Col md={3} className="mb-4 mb-md-0 footer-col">
            <h5>{t('footer.contactTitle', 'تواصل معانــــــــــــا')}</h5>
            <Nav className="flex-column footer-contact-info">
              <Nav.Item className="mb-2">
                <FontAwesomeIcon icon={faPhone} className="me-2" />
                <div dir="ltr">
                  <a href="tel:+966558494648" className="footer-link">+966 558494648</a>
                </div>
              </Nav.Item>
              <Nav.Item>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                <span>{t('footer.address', 'الرياض، المنصورية، منفوحة الرياض 12685، المملكة العربية السعودية')}</span>
              </Nav.Item>
              <Nav.Item className="mt-2">
                <a
                  href={`https://wa.me/${t('contactInfo.whatsappNumber', '966558494648')}`} // Use translation for number if it varies by lang
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link social-icon-link"
                  aria-label={t('footer.whatsappAria', 'Contact us on WhatsApp')}
                >
                  <FontAwesomeIcon icon={faWhatsapp} size="lg" />
                  <span className="ms-2 d-inline-block d-md-none">{t('footer.whatsapp', 'WhatsApp')}</span>
                </a>
                {/* Add other social media links here if desired */}
                {/* <a href="https" target="_blank" rel="noopener noreferrer" className="footer-link social-icon-link ms-2">
                  <FontAwesomeIcon icon={faInstagram} size="lg" />
                </a>
                <a href="https" target="_blank" rel="noopener noreferrer" className="footer-link social-icon-link ms-2">
                  <FontAwesomeIcon icon={faTiktok} size="lg" />
                </a> */}
              </Nav.Item>
            </Nav>
          </Col>

          <Col md={2} className="mb-4 mb-md-0 footer-col">
            <h5>{t('footer.pagesTitle', 'الصفحات')}</h5>
            <Nav className="flex-column">
              <Nav.Item>
                <Link to="/shop" className="footer-link">{t('nav.shop', 'المتجــــــر')}</Link>
              </Nav.Item>
              <Nav.Item>
                <Link to="/account" className="footer-link">{t('nav.myAccount', 'حسابي')}</Link>
              </Nav.Item>
              <Nav.Item>
                <Link to="/offers" className="footer-link">{t('footer.offersLink', 'اقوي العروض')}</Link>
              </Nav.Item>
              <Nav.Item>
                <Link to="/cart" className="footer-link">{t('nav.cart', 'سلة المشتريات')}</Link>
              </Nav.Item>
              <Nav.Item>
                <Link to="/privacy-policy" className="footer-link">{t('nav.privacyPolicy', 'سياسة الخصوصية')}</Link>
              </Nav.Item>
            </Nav>
          </Col>

          <Col md={3} className="footer-col">
            <h5>{t('footer.newsletterTitle', 'النشرة الإخبارية')}</h5>
            <p>{t('footer.newsletterText', 'اشترك في نشرتنا الإخبارية للحصول على آخر التحديثات والعروض.')}</p>
            {/* Basic Newsletter Form - functionality to be added */}
            <form>
              <div className="input-group mb-3">
                <input type="email" className="form-control" placeholder={t('footer.emailPlaceholder', 'ادخل بريدك الالكتروني')} />
                <button className="btn btn-primary" type="submit">{t('footer.subscribeButton', 'اشتراك')}</button>
              </div>
            </form>
          </Col>
        </Row>
        <Row>
          <Col className="text-center py-3 footer-copyright">
            <span>&copy; {currentYear} {t('companyName', 'مفروشات عروبة المنار')}. {t('footer.rightsReserved', 'All rights reserved.')}</span>
            <br />
            <span className="developer-credit">{t('footer.developedBy', 'Developed by Ibrahim Abd Nasser')}</span>
            {/* Or if you are the developer: */}
            {/* <span className="developer-credit">{t('footer.developedBy', 'Developed by Jules AI')}</span> */}
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
