import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Image } from 'react-bootstrap';
// import './AboutUsPage.css'; // Optional: if specific styling is needed

const AboutUsPage = () => {
  const { t } = useTranslation();

  // Arabic fallbacks can be provided in t() if keys are missing,
  // but for cleaner code, ensure ar.json is also populated.
  // For this task, we focus on en.json.

  return (
    <Container className="my-3 about-us-page">
      <Helmet>
        <title>{t('pageTitles.aboutUs')}</title>
      </Helmet>
      <Row className="align-items-center mb-4">
        <Col md={12} className="text-center">
          <h1 className="page-main-title">{t('aboutUsPage.title')}</h1>
        </Col>
      </Row>
      <Row>
        <Col md={7}>
          <p className="lead-paragraph">{t('aboutUsPage.paragraph1')}</p>
          <p className="lead-paragraph">{t('aboutUsPage.paragraph2')}</p>
          <p className="lead-paragraph">{t('aboutUsPage.paragraph3')}</p>

          <h3 className="mt-4">{t('aboutUsPage.missionTitle')}</h3>
          <p>{t('aboutUsPage.missionText')}</p>

          <h3 className="mt-4">{t('aboutUsPage.visionTitle')}</h3>
          <p>{t('aboutUsPage.visionText')}</p>
        </Col>
        <Col md={5} className="text-center">
          {/* Replace with an actual relevant image */}
          <Image
            src="https://blog.atome.sg/wp-content/uploads/2022/09/The-Curtain-Boutique.jpg"
            alt={t('aboutUsPage.imageAlt')}
            fluid
            rounded
            className="shadow-sm"
          />
            <Image
            src="https://avatars.mds.yandex.net/get-altay/906486/2a00000163cb3228bad7ebf644608e8dab8a/L_height"
            alt={t('aboutUsPage.imageAlt')}
            fluid
            rounded
            className="shadow-sm"
          />
        </Col>
      </Row>
      {/* Optional: Add team members, company history, etc. */}
    </Container>
  );
};

export default AboutUsPage;
