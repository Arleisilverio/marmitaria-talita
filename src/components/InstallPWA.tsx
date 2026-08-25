import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, MoreVertical, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verifica se já está rodando como app instalado (PWA Standalone)
    const isRunningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isRunningStandalone);

    // Detecta se é iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Captura o evento nativo de instalação do Chrome/Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setDismissed(true);
        }
      } catch (err) {
        console.warn("Erro ao chamar prompt nativo:", err);
        setShowInstructionsModal(true);
      }
    } else {
      // Se não houver prompt nativo imediato (iOS, navegador interno ou desktop), abre as instruções
      setShowInstructionsModal(true);
    }
  };

  // Se já estiver rodando dentro do aplicativo instalado ou se o usuário fechou o banner
  if (isStandalone || dismissed) {
    return null;
  }

  return (
    <>
      {/* Banner Flutuante de Instalação */}
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 animate-in fade-in slide-in-from-bottom duration-300 max-w-sm ml-auto">
        <div className="bg-[#141712]/95 border border-[#e2725b]/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <img 
              src="/pwa-192x192.png" 
              alt="Da Quebrada" 
              className="w-10 h-10 rounded-xl object-cover border border-[#e2725b]/40 shadow-lg shrink-0" 
            />
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

      {/* Modal de Instruções de Instalação (para iOS ou Android sem prompt nativo) */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#141712] border border-white/10 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/pwa-192x192.png" 
                  alt="Da Quebrada" 
                  className="w-8 h-8 rounded-lg object-cover border border-[#e2725b]/40 shadow-sm shrink-0" 
                />
                <h3 className="font-bold text-base">Instalar App Da Quebrada</h3>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              // Guia para iPhone / iPad
              <div className="space-y-4">
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Para instalar no seu iPhone / iPad em 3 passos:
                </p>
                <div className="space-y-3 bg-black/40 p-3.5 rounded-2xl border border-white/5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#e2725b]/20 text-[#ff7b54] font-bold flex items-center justify-center shrink-0">1</span>
                    <span className="text-zinc-200">
                      Toque no botão <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 text-sky-400 inline mx-0.5" /> na barra do navegador Safari.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#e2725b]/20 text-[#ff7b54] font-bold flex items-center justify-center shrink-0">2</span>
                    <span className="text-zinc-200">
                      Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline mx-0.5" />.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#e2725b]/20 text-[#ff7b54] font-bold flex items-center justify-center shrink-0">3</span>
                    <span className="text-zinc-200">
                      Toque em <strong>Adicionar</strong> no canto superior. Pronto! 🎉
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Guia para Android / Chrome / Computador
              <div className="space-y-4">
                <p className="text-zinc-300 text-xs leading-relaxed">
                  Para instalar no seu celular Android ou computador:
                </p>
                <div className="space-y-3 bg-black/40 p-3.5 rounded-2xl border border-white/5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#e2725b]/20 text-[#ff7b54] font-bold flex items-center justify-center shrink-0">1</span>
                    <span className="text-zinc-200">
                      Toque nos <strong>três pontinhos</strong> <MoreVertical className="w-3.5 h-3.5 text-amber-400 inline mx-0.5" /> no canto superior do Chrome.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#e2725b]/20 text-[#ff7b54] font-bold flex items-center justify-center shrink-0">2</span>
                    <span className="text-zinc-200">
                      Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#e2725b]/20 text-[#ff7b54] font-bold flex items-center justify-center shrink-0">3</span>
                    <span className="text-zinc-200">
                      Confirme a instalação. O ícone <strong>Da Quebrada</strong> aparecerá no seu menu de aplicativos! 📲
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstructionsModal(false)}
              className="mt-6 w-full py-3 bg-[#e2725b] hover:bg-[#d65a40] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
