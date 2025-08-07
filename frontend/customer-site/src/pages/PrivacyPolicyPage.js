import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container } from 'react-bootstrap';

const PrivacyPolicyPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // Placeholder content - this should be replaced with actual legal text
  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "July 10, 2025",
      sections: [
        { title: "1. Introduction", text: "Welcome to Mafrushat Eurubat Almanar. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website." },
        { title: "2. Information We Collect", text: "We may collect personal information such as your name, email address, shipping address, billing address, phone number, and payment information when you register, place an order, or subscribe to our newsletter." },
        { title: "3. How We Use Your Information", text: "We use the information we collect to process your orders, manage your account, communicate with you, improve our services, and send you promotional materials if you opt-in." },
        { title: "4. Disclosure of Your Information", text: "We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential." },
        { title: "5. Security of Your Information", text: "We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information." },
        { title: "6. Cookies", text: "Our website may use cookies to enhance your experience. You can choose to disable cookies through your browser settings." },
        { title: "7. Your Rights", text: "You have the right to access, correct, or delete your personal information. Please contact us to make such requests." },
        { title: "8. Changes to This Privacy Policy", text: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page." },
        { title: "9. Contact Us", text: "If you have any questions about this Privacy Policy, please contact us at [Your Contact Email/Phone]." }
      ]
    },
    ar: {
      title: "سياسة الخصوصية",
      lastUpdated: "١٠ يوليو ٢٠٢٥",
      sections: [
        { title: "١. مقدمة", text: "مرحبًا بكم في مفروشات عروبة المنار. نحن ملتزمون بحماية خصوصيتكم. توضح سياسة الخصوصية هذه كيف نجمع معلوماتك ونستخدمها ونكشف عنها ونحميها عند زيارتك لموقعنا الإلكتروني." },
        { title: "٢. المعلومات التي نجمعها", text: "قد نجمع معلومات شخصية مثل اسمك وعنوان بريدك الإلكتروني وعنوان الشحن وعنوان إرسال الفواتير ورقم الهاتف ومعلومات الدفع عند التسجيل أو تقديم طلب أو الاشتراك في نشرتنا الإخبارية." },
        { title: "٣. كيف نستخدم معلوماتك", text: "نستخدم المعلومات التي نجمعها لمعالجة طلباتك وإدارة حسابك والتواصل معك وتحسين خدماتنا وإرسال مواد ترويجية لك إذا اخترت ذلك." },
        { title: "٤. الكشف عن معلوماتك", text: "نحن لا نبيع معلومات التعريف الشخصية الخاصة بك أو نتاجر بها أو ننقلها بأي طريقة أخرى إلى أطراف خارجية ما لم نوفر للمستخدمين إشعارًا مسبقًا. لا يشمل ذلك شركاء استضافة مواقع الويب والأطراف الأخرى التي تساعدنا في تشغيل موقعنا الإلكتروني أو إدارة أعمالنا أو خدمة مستخدمينا، طالما وافقت تلك الأطراف على الحفاظ على سرية هذه المعلومات." },
        { title: "٥. أمن معلوماتك", text: "ننفذ مجموعة متنوعة من الإجراءات الأمنية للحفاظ على سلامة معلوماتك الشخصية عند تقديم طلب أو إدخال معلوماتك الشخصية أو إرسالها أو الوصول إليها." },
        { title: "٦. ملفات تعريف الارتباط (الكوكيز)", text: "قد يستخدم موقعنا ملفات تعريف الارتباط لتحسين تجربتك. يمكنك اختيار تعطيل ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك." },
        { title: "٧. حقوقك", text: "لديك الحق في الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها. يرجى الاتصال بنا لتقديم مثل هذه الطلبات." },
        { title: "٨. التغييرات على سياسة الخصوصية هذه", text: "قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات عن طريق نشر سياسة الخصوصية الجديدة على هذه الصفحة." },
        { title: "٩. اتصل بنا", text: "إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، فيرجى الاتصال بنا على [بريدك الإلكتروني/رقم هاتفك]." }
      ]
    }
  };

  const pageContent = currentLang === 'ar' ? content.ar : content.en;

  return (
    <Container className="my-5">
      <Helmet>
        <title>{t('pageTitles.privacyPolicy', pageContent.title)}</title>
      </Helmet>
      <h1 className="mb-4">{pageContent.title}</h1>
      <p><em>{t('privacyPolicy.lastUpdated', 'Last updated')}: {pageContent.lastUpdated}</em></p>

      {pageContent.sections.map((section, index) => (
        <div key={index} className="mb-4">
          <h3>{section.title}</h3>
          <p>{section.text}</p>
        </div>
      ))}
    </Container>
  );
};

export default PrivacyPolicyPage;
