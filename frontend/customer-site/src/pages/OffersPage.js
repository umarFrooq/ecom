import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container } from 'react-bootstrap';

const OffersPage = () => {
  const { t } = useTranslation();
  return (
    <Container className="my-5">
      <Helmet>
        <title>{t('pageTitles.offers', 'العروض')}</title>
      </Helmet>
      <h2>{t('offersPage.title', 'العروض الحالية')}</h2>
      <p>{t('offersPage.placeholder', 'Special offers and promotions will be listed here.')}</p>
      {/* TODO: Fetch and display products that are on offer */}
    </Container>
  );
};

export default OffersPage;
