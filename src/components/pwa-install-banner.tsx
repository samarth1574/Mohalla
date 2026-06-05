'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

/**
 * PWA Install Banner Component
 * Task 9.3: Create PWA install banner component
 * 
 * Features:
 * - Listens for beforeinstallprompt event
 * - Stores deferred prompt in component state
 * - Renders dismissible install banner
 * - Calls prompt() on install button click
 * - Sets sessionStorage flag on dismiss
 */
export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was already dismissed in this session
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      return;
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA Install] User response: ${outcome}`);

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Download className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm mb-1">Install Mohalla App</h3>
          <p className="text-xs text-white/90">Get quick access from your home screen</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-white text-emerald-600 rounded-xl font-bold text-xs hover:bg-white/90 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
