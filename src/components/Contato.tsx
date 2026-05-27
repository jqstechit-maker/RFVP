import React, { useState } from 'react';
import { MessageSquare, PhoneCall, Mail, Sparkles } from 'lucide-react';
import { PlataformaConfig } from '../types';

interface ContatoProps {
  config: PlataformaConfig;
}

export default function Contato({ config }: ContatoProps) {
  const [contatoAssunto, setContatoAssunto] = useState<string>('Dúvida Geral');
  const [contatoMensagem, setContatoMensagem] = useState<string>('');

  const handleWhatsAppRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    const baseText = `Olá Suporte ${config.nomePlataforma}!\n*Assunto:* ${contatoAssunto}\n*Mensagem:* ${contatoMensagem || 'Gostaria de falar com o suporte.'}`;
    const encodedText = encodeURIComponent(baseText);
    const cleanPhone = config.whatsappSuporte.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
  };

  return (
    <div id="contato_section" className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-200">
      
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs text-primary-neon uppercase tracking-widest font-black font-mono px-3 py-1 bg-primary-neon/10 rounded-full border border-primary-neon/20">
          Atendimento Oficial
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight leading-tight mt-2 pb-1">
          Central de <span className="text-primary-neon glow-primary">Ajuda & Contato Direto</span>
        </h2>
        <p className="text-sm text-text-dim leading-relaxed">
          Tem dúvidas sobre compras de cotas, validação de transações ou deseja falar com a nossa equipe? Escolha o melhor canal ou utilize o assistente automatizado de WhatsApp.
        </p>
      </div>

      {/* Central de Contato e Suporte Integrado */}
      <div id="central_contato_section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-surface-dark border border-border-dim rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle glowing effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-[10px] text-primary-neon font-black uppercase font-mono tracking-widest px-2.5 py-1 bg-primary-neon/10 rounded-md border border-primary-neon/15 inline-block">
              Fale Conosco
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white font-display mt-2">
              Suporte Integrado no WhatsApp
            </h3>
            <p className="text-xs text-text-dim mt-1.5 leading-relaxed max-w-lg">
              Escolha o setor correspondente e digite sua dúvida. Nosso assistente irá preparar seu atendimento automático para iniciar no aplicativo com um só clique!
            </p>
          </div>

          <form onSubmit={handleWhatsAppRedirect} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] text-text-dim uppercase tracking-wider font-extrabold font-mono">Setor / Assunto *</label>
                <select
                  value={contatoAssunto}
                  onChange={(e) => setContatoAssunto(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 focus:ring-1 focus:ring-primary-neon/20 transition-all font-sans cursor-pointer"
                >
                  <option value="Dúvida Geral">Dúvida Geral</option>
                  <option value="Suporte de Pagamentos">Suporte de Pagamentos (Pix)</option>
                  <option value="Ajuda com Minhas Cotas">Ajuda com Minhas Cotas</option>
                  <option value="Retirada de Prêmios">Retirada de Prêmios</option>
                  <option value="Parceria comercial">Parceria Comercial / Outros</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-text-dim uppercase tracking-wider font-extrabold font-mono">Número de Suporte</label>
                <div className="w-full px-3 py-2.5 bg-bg-dark/50 border border-border-dim/50 rounded-xl text-xs text-slate-400 font-mono flex items-center gap-1.5 select-all">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  {config.whatsappSuporte}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] text-text-dim uppercase tracking-wider font-extrabold font-mono">Sua Dúvida ou Mensagem *</label>
              <textarea
                required
                rows={4}
                value={contatoMensagem}
                onChange={(e) => setContatoMensagem(e.target.value)}
                placeholder="Por favor, digite os detalhes da sua dúvida (ex: número da cota, CPF, ou data de transmissão do Pix)..."
                className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-neon/50 focus:ring-1 focus:ring-primary-neon/20 transition-all font-sans resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-bg-dark font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-mono uppercase tracking-wide duration-200 active:scale-95 shadow-lg shadow-emerald-500/10"
            >
              <MessageSquare className="w-4 h-4" /> Iniciar Conversa no WhatsApp
            </button>
          </form>
        </div>

        {/* Quick Contacts Column */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 bg-bg-dark/50 border border-border-dim/60 rounded-2xl space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-primary-neon">Canais de Contato Adicionais</h4>
            
            <div className="space-y-3.5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 rounded-xl">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[9px] text-text-dim uppercase font-mono">WhatsApp Oficial</span>
                  <a
                    href={`https://wa.me/${config.whatsappSuporte.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-primary-neon font-mono font-bold text-xs transition-colors"
                  >
                    {config.whatsappSuporte}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/15 rounded-xl">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[9px] text-text-dim uppercase font-mono">E-mail Corporativo</span>
                  <a
                    href={`mailto:suporte@${config.nomePlataforma.toLowerCase().replace(/[^a-z0-9]/g, '') || 'sorteios'}.com`}
                    className="text-white hover:text-primary-neon font-mono text-xs transition-colors"
                  >
                    suporte@{config.nomePlataforma.toLowerCase().replace(/[^a-z0-9]/g, '') || 'sorteios'}.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/15 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[9px] text-text-dim uppercase font-mono">Horário de Atendimento</span>
                  <span className="text-white font-sans text-xs font-semibold">
                    Segunda a Sábado — 08:00 às 22:00
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border-dim/40 pt-4 mt-2">
            <p className="text-[10px] text-text-dim leading-relaxed mb-3">
              Caso prefira abrir a conversa de suporte livre imediatamente sem preencher de antemão os campos de assunto:
            </p>
            <a
              href={`https://wa.me/${config.whatsappSuporte.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2 bg-bg-dark border border-border-dim text-slate-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer font-mono"
            >
              Suporte WhatsApp Direto ↗
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
