import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    // Check if already running as standalone PWA
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Check if device is iOS (Safari doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt (Android / Chrome / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setJustInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => setJustInstalled(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // If already running inside installed app or dismissed, don't show the floating prompt
  if (isStandalone || dismissed) {
    return null;
  }

  // Only show if we either have the native install event or it's iOS
  if (!deferredPrompt && !isIOS && !justInstalled) {
    return null;
  }

  if (justInstalled) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">App instalado com sucesso! Acesse direto pela sua tela inicial.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Install Prompt Banner */}
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 animate-in fade-in slide-in-from-bottom duration-300 max-w-sm ml-auto">
        <div className="bg-[#141712]/95 border border-[#e2725b]/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff7b54] to-[#e2725b] p-0.5 flex items-center justify-center shadow-lg shadow-[#e2725b]/20 shrink-0">
              <div className="w-full h-full bg-[#0d0f0c] rounded-[10px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[#ff7b54]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide">App Da Quebrada</span>
                <span className="text-[9px] bg-[#e2725b]/20 text-[#ff7b54] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> PWA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Instale no celular para pedir mais rápido!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-[#ff7b54] to-[#e2725b] hover:opacity-90 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tutorial for iOS / iPhone Users */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#141712] border border-white/10 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#e2725b] flex items-center justify-center font-black text-sm">
                  DQ
                </div>
                <h3 className="font-bold text-base">Instalar no iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-zinc-300 text-xs leading-relaxed mb-4">
              Para instalar o aplicativo no seu iPhone sem precisar da App Store:
            </p>

            <div className="space-y-3 mb-6 bg-black/30 p-3.5 rounded-2xl border border-white/5 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#e2725b]/20 text-[#ff7b54] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="flex items-center gap-1.5 text-zinc-200">
                  Toque no botão de <strong>Compartilhar</strong> <Share className="w-4 h-4 text-sky-400 inline" /> na barra do Safari.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#e2725b]/20 text-[#ff7b54] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="flex items-center gap-1.5 text-zinc-200">
                  Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-4 h-4 text-emerald-400 inline" />.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#e2725b]/20 text-[#ff7b54] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="text-zinc-200">
                  Toque em <strong>Adicionar</strong> no canto superior direito. Pronto! 🎉
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-[#e2725b] hover:bg-[#d65a40] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
