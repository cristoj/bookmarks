import { useEffect, useState, useRef } from 'react';
import { RecaptchaVerifier, initializeRecaptchaConfig, getAuth } from 'firebase/auth';
import { USE_FIREBASE_EMULATORS } from '@services/firebase';

/**
 * Hook to manage reCAPTCHA verification
 * Initializes reCAPTCHA and provides the verifier instance
 */
export function useRecaptcha(containerId: string = 'recaptcha-container') {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  // Read optional site key from Vite env. If you prefer, set the key
  // in the Firebase Console (Authentication → Settings → reCAPTCHA) instead.
  const SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || null) as string | null;

  useEffect(() => {
    // Helper: wait for grecaptcha to be available on window
    const waitForGrecaptcha = async (timeout = 3000, interval = 100) => {
      const start = Date.now();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // @ts-ignore
        if (typeof window !== 'undefined' && (window as any).grecaptcha && typeof (window as any).grecaptcha.render === 'function') {
          return true;
        }
        if (Date.now() - start > timeout) {
          return false;
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => setTimeout(res, interval));
      }
    };

    // NOTE: we deliberately do NOT inject the grecaptcha script here.
    // The Firebase SDK / plugin should load it. Instead we wait for the
    // global `grecaptcha` to appear after calling `initializeRecaptchaConfig`.

    const initRecaptcha = async () => {
      // If we're running against the Auth emulator, provide a fake
      // verifier so UI flows that expect `verifier` and `verify()` to
      // exist continue to work. The Auth emulator doesn't implement the
      // recaptcha endpoints, so real initialization would fail.
      if (USE_FIREBASE_EMULATORS) {
        const fakeVerifier = {
          async verify() {
            return Promise.resolve('emulator-bypass');
          },
          clear() {
            return undefined;
          },
          // render exists in real RecaptchaVerifier; provide a noop
          async render() {
            return 0;
          },
        } as unknown as RecaptchaVerifier;

        verifierRef.current = fakeVerifier;
        // expose a widget id so code that reads `widgetId` / grecaptcha.getResponse works
        // when running against an emulator
        if (typeof window !== 'undefined') {
          // @ts-ignore
          window.recaptchaWidgetId = 0;
        }
        setIsReady(true);
        return;
      }
      try {
        const auth = getAuth();
        
        // Initialize reCAPTCHA config (keeps SDK defaults)
        await initializeRecaptchaConfig(auth);

        // Wait for the grecaptcha global to be available. We avoid injecting
        // the script because the Firebase SDK/plugin typically loads it;
        // on full page loads it may take a short moment, so wait up to 8s.
        const greReady = await waitForGrecaptcha(8000, 150);
        if (!greReady) {
          // If grecaptcha never appears, set an informative error but continue
          // so callers can fall back or surface the message.
          setError('reCAPTCHA script not available after initialization');
        }

        // Create reCAPTCHA verifier
        if (!verifierRef.current) {
          // If you want to explicitly set the site key from env, pass it
          // in the options as `siteKey`.
          const verifierOptions: Record<string, any> = {
            size: 'normal',
            callback: () => setIsReady(true),
            'expired-callback': () => setIsReady(false),
          };
          if (SITE_KEY) verifierOptions.siteKey = SITE_KEY;

          verifierRef.current = new RecaptchaVerifier(auth, containerId, verifierOptions);

          // Try to render the widget via the RecaptchaVerifier API. If it
          // fails (timing, CSP, or other issues), and a SITE_KEY is available,
          // fall back to calling the grecaptcha.render() API directly.
          // This fallback requires a site key.
          let rendered = false;
          try {
            // render() may throw if containerId is not present in the DOM yet
            const widgetId = await verifierRef.current.render();
            setIsReady(true);
            // @ts-ignore
            window.recaptchaWidgetId = widgetId;
            rendered = true;
          } catch (renderErr: any) {
            // Log FirebaseError code/message for easier debugging in Chrome
            const code = renderErr?.code || renderErr?.status || 'unknown';
            const msg = renderErr?.message || String(renderErr);
            console.warn('reCAPTCHA render warning (RecaptchaVerifier):', { code, message: msg, err: renderErr });
            setError(`${code}: ${msg}`);
            // attempt fallback if SITE_KEY is present and grecaptcha is available
            if (SITE_KEY && typeof window !== 'undefined' && (window as any).grecaptcha) {
              try {
                // @ts-ignore
                const wid = (window as any).grecaptcha.render(containerId, {
                  sitekey: SITE_KEY,
                  callback: () => setIsReady(true),
                  'expired-callback': () => setIsReady(false),
                });
                // @ts-ignore
                window.recaptchaWidgetId = wid;
                setIsReady(true);
                rendered = true;
                console.info('reCAPTCHA rendered via grecaptcha.render fallback, widgetId=', wid);
              } catch (fallbackErr: any) {
                const fcode = fallbackErr?.code || fallbackErr?.status || 'unknown';
                const fmsg = fallbackErr?.message || String(fallbackErr);
                console.warn('reCAPTCHA fallback render failed:', { code: fcode, message: fmsg, err: fallbackErr });
                // include fallback error in state to surface in UI
                setError((prev) => prev ? `${prev}; fallback:${fcode}: ${fmsg}` : `fallback:${fcode}: ${fmsg}`);
              }
            }

            if (!rendered) {
              setIsReady(false);
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize reCAPTCHA');
        console.error('reCAPTCHA initialization error:', err);
      }
    };

    initRecaptcha();

    // Cleanup
    return () => {
      if (verifierRef.current) {
        verifierRef.current.clear();
      }
    };
  }, [containerId]);
  return {
    verifier: verifierRef.current,
    isReady,
    error,
    containerId,
    // Optional: widgetId will be set on window.recaptchaWidgetId after render
    widgetId: (typeof window !== 'undefined' ? (window as any).recaptchaWidgetId : undefined) as
      | number
      | undefined,
  };

}


