import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './I18nLanguageSwitcher';

// The Suspense fallback is important because i18next-http-backend
// loads translation files asynchronously (lazy loading)
export const ExampleUsage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading translations...</div>}>
      <ExampleContent />
    </Suspense>
  );
};

const ExampleContent: React.FC = () => {
  // Specify which namespaces to load. Default is 'common'.
  // We can load multiple namespaces: useTranslation(['common', 'auth', 'dashboard'])
  const { t } = useTranslation(['common', 'auth', 'dashboard']);

  return (
    <div className="p-6 max-w-lg mx-auto bg-card rounded-xl border brutal-border mt-10">
      <h1 className="text-2xl font-bold mb-4">{t('welcome')}</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Auth Namespace</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('auth:login')}</li>
          <li>{t('auth:signup')}</li>
          <li>{t('auth:email')}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Dashboard Namespace</h2>
        <p>{t('dashboard:overview')}</p>
        <p>{t('dashboard:settings')}</p>
      </div>

      <div className="mt-8 border-t pt-4">
        <p className="mb-2">{t('language')}:</p>
        <LanguageSwitcher />
      </div>
    </div>
  );
};
