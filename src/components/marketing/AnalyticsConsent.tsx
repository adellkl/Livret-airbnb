'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

const MEASUREMENT_ID = 'G-TJHX69ZCM4';
const CONSENT_COOKIE = 'monlivret_analytics_consent';
const CONSENT_EVENT = 'monlivret:analytics-consent';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;
const TRACKED_PATHS = new Set([
  '/',
  '/fonctionnalites',
  '/tarifs',
  '/mentions-legales',
  '/confidentialite',
  '/conditions-utilisation',
]);

type AnalyticsConsent = 'accepted' | 'rejected';
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function readConsent(): AnalyticsConsent | null {
  const match = document.cookie.match(/(?:^|;\s*)monlivret_analytics_consent=(accepted|rejected)(?:;|$)/);
  return match?.[1] === 'accepted' || match?.[1] === 'rejected' ? match[1] : null;
}

function saveConsent(consent: AnalyticsConsent) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${consent}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function subscribeToConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}

function subscribeToHydration() {
  return () => undefined;
}

function clearAnalyticsCookies() {
  for (const item of document.cookie.split(';')) {
    const name = item.trim().split('=')[0];
    if (name === '_ga' || name.startsWith('_ga_')) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
    }
  }
}

function updateGoogleConsent(consent: AnalyticsConsent) {
  const browser = window as unknown as AnalyticsWindow & Record<string, unknown>;
  const analyticsAllowed = consent === 'accepted';
  browser[`ga-disable-${MEASUREMENT_ID}`] = !analyticsAllowed;

  if (!analyticsAllowed) {
    browser.gtag?.('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    clearAnalyticsCookies();
  }
}

function pauseGoogleAnalytics() {
  const browser = window as unknown as AnalyticsWindow & Record<string, unknown>;
  browser[`ga-disable-${MEASUREMENT_ID}`] = true;
  browser.gtag?.('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

function loadGoogleAnalytics() {
  const browser = window as unknown as AnalyticsWindow & Record<string, unknown>;
  browser[`ga-disable-${MEASUREMENT_ID}`] = false;

  if (browser.gtag) {
    browser.gtag('consent', 'update', { analytics_storage: 'granted' });
    return;
  }

  browser.dataLayer = browser.dataLayer || [];
  browser.gtag = (...args: unknown[]) => browser.dataLayer?.push(args);
  browser.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  browser.gtag('consent', 'update', { analytics_storage: 'granted' });
  browser.gtag('js', new Date());
  browser.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  if (!document.querySelector('script[data-monlivret-analytics]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    script.dataset.monlivretAnalytics = 'true';
    document.head.appendChild(script);
  }
}

export default function AnalyticsConsent() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, () => null);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (consent === 'accepted' && pathname && TRACKED_PATHS.has(pathname)) {
      loadGoogleAnalytics();
      return;
    }
    if (consent === 'rejected') updateGoogleConsent('rejected');
    else pauseGoogleAnalytics();
  }, [consent, pathname, hydrated]);

  useEffect(() => {
    if (consent !== 'accepted' || !pathname || !TRACKED_PATHS.has(pathname)) return;
    const browser = window as AnalyticsWindow;
    browser.gtag?.('event', 'page_view', {
      page_path: pathname,
      page_title: document.title,
    });
  }, [consent, pathname]);

  const chooseConsent = (nextConsent: AnalyticsConsent) => {
    saveConsent(nextConsent);
    setPreferencesOpen(false);
    if (nextConsent === 'rejected') updateGoogleConsent(nextConsent);
  };

  return (
    <>
      {hydrated && consent !== null && !preferencesOpen && (
        <button
          type="button"
          onClick={() => setPreferencesOpen(true)}
          className="fixed bottom-4 left-4 z-[60] rounded-full border border-[#d9e3dc] bg-white px-4 py-2.5 text-xs font-semibold text-[#244b40] shadow-lg transition hover:bg-[#f2f7f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#367566]"
        >
          Préférences cookies
        </button>
      )}

      {hydrated && (consent === null || preferencesOpen) && (
        <section
          aria-labelledby="analytics-consent-title"
          aria-describedby="analytics-consent-description"
          className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-[#d9e3dc] bg-white p-5 shadow-[0_18px_60px_rgba(20,44,63,.2)] sm:inset-x-6 sm:bottom-6 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <h2 id="analytics-consent-title" className="text-base font-semibold text-[#142c3f]">
                Préférences cookies
              </h2>
              <p id="analytics-consent-description" className="mt-2 text-sm leading-6 text-[#56656e]">
                Google Analytics mesure la fréquentation des pages publiques. Il ne se lance qu’après ton accord. Tu peux refuser ou modifier ton choix à tout moment.
              </p>
              <Link href="/confidentialite" className="mt-2 inline-block text-sm font-semibold text-[#367566] underline underline-offset-2">
                Politique de confidentialité
              </Link>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => chooseConsent('rejected')}
                className="min-h-11 flex-1 rounded-xl border border-[#cdd8d2] px-4 text-sm font-semibold text-[#244b40] transition hover:bg-[#f2f7f4] sm:flex-none"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={() => chooseConsent('accepted')}
                className="min-h-11 flex-1 rounded-xl border border-[#367566] bg-[#367566] px-4 text-sm font-semibold text-white transition hover:bg-[#2f6659] sm:flex-none"
              >
                Accepter
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
