import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Award, HelpCircle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { PlataformaConfig } from '../types';

interface QuemSomosProps {
  config: PlataformaConfig;
}

export default function QuemSomos({ config }: QuemSomosProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      pergunta: `Como funcionam os sorteios da ${config.nomePlataforma}?`,
      resposta: "Nossos sorteios utilizam como base os resultados oficiais da Loteria Federal. O participante escolhe sua dezena no grid ativo, realiza o pagamento via Pix e a cota é reservada em seu nome com segurança instantaneamente."
    },
    {
      pergunta: "É realmente seguro participar?",
      resposta: "Sim, absolutamente! Construímos nossa plataforma com regras estritas antiduplicidade. Isso significa que é tecnicamente impossível duas pessoas receberem o mesmo número do sorteio ativo. Além disso, utilizamos criptografia para proteger os dados pessoais de nossos clientes."
    },
    {
      pergunta: "O que acontece se houver um empate ou pagamento duplo?",
      resposta: "Se duas pessoas tentarem finalizar a mesma dezena exatamente no mesmo microssegundo, nossa infraestrutura processa o primeiro pagamento aprovado como o legítimo comprador. O segundo pagamento entra em estado de 'conflito' e o valor pago é avisado no painel administrativo para estorno manual imediato pelo suporte ao cliente."
    },
    {
      pergunta: "Como posso entrar em contato com o suporte oficial?",
      resposta: `Temos suporte prioritário via WhatsApp (${config.whatsappSuporte}) e e-mail disponível de segunda a sábado. Nossa equipe está pronta para esclarecer dúvidas sobre faturas, cotas pendentes ou regulamento geral.`
    }
  ];

  return (
    <div id="quem_somos_section" className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-200">
      
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs text-primary-neon uppercase tracking-widest font-black font-mono px-3 py-1 bg-primary-neon/10 rounded-full border border-primary-neon/20">
          Nossa História & Transparência
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight leading-tight mt-2 pb-1">
          O Jeito Moderno e Seguro de <br/>
          <span className="text-primary-neon glow-primary">Concorrer a Grandes Prêmios</span>
        </h2>
        <p className="text-sm text-text-dim leading-relaxed">
          {config.textosInstitucionais}
        </p>
      </div>

      {/* Pillars Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary-neon/30 transition-all duration-300">
          <div className="absolute top-0 right-0 h-2 bg-gradient-to-r from-primary-neon to-emerald-500 w-full" />
          <div className="p-3 bg-bg-dark rounded-xl border border-border-dim inline-block mb-4 text-primary-neon">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2 font-display">Segurança Blindada</h3>
          <p className="text-xs text-text-dim leading-relaxed">
            Eliminamos fraudes e duplicidades. Nossos servidores previnem colisões de compras, garantindo que o número escolhido seja exclusivamente seu com confirmação criptográfica.
          </p>
        </div>

        <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary-neon/30 transition-all duration-300">
          <div className="absolute top-0 right-0 h-2 bg-gradient-to-r from-primary-neon to-purple-500 w-full" />
          <div className="p-3 bg-bg-dark rounded-xl border border-border-dim inline-block mb-4 text-primary-neon">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2 font-display">Resultados da Federal</h3>
          <p className="text-xs text-text-dim leading-relaxed">
            Zero manipulações. Todos os sorteios são computados estritamente com base na extração oficial de quarta-feira ou sábado da Loteria Federal da Caixa Econômica.
          </p>
        </div>

        <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary-neon/30 transition-all duration-300">
          <div className="absolute top-0 right-0 h-2 bg-gradient-to-r from-primary-neon to-pink-500 w-full" />
          <div className="p-3 bg-bg-dark rounded-xl border border-border-dim inline-block mb-4 text-primary-neon">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2 font-display">Baixa Automática no Pix</h3>
          <p className="text-xs text-text-dim leading-relaxed">
            Nosso sistema é totalmente integrado. Realizou o Pix? Garanta sua cota com verificação em tempo real e numeração reservada na hora, de forma 100% automatizada.
          </p>
        </div>
      </div>

      {/* Delivered Gallery Section */}
      <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <span className="text-[10px] text-primary-neon font-black uppercase font-mono tracking-widest">Entrega e Satisfação</span>
            <h3 className="text-xl font-bold text-white font-display mt-0.5">Depoimentos & Prêmios Entregues</h3>
          </div>
          <span className="text-xs bg-bg-dark text-text-dim border border-border-dim py-1 px-3 rounded-xl font-mono">
            4 Grandes Projetos Concluídos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Winner 1 */}
          <div className="bg-bg-dark/60 border border-border-dim rounded-xl p-4 flex gap-4 items-center">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop" 
              alt="Ganhadora iPhone" 
              className="w-16 h-16 rounded-full object-cover border-2 border-primary-neon/30"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <strong className="text-xs text-white">Juliana M. de Campinas</strong>
                <CheckCircle className="w-3.5 h-3.5 text-primary-neon" />
              </div>
              <p className="text-[10px] text-text-dim mt-0.5 italic">"Ganhei o iPhone 15 Pro Max na cota 498. Chegou tudo em 3 dias lacrado!"</p>
              <span className="text-[9px] font-mono text-primary-neon mt-1 block">Rifa nº 1 · Sorteio Federal</span>
            </div>
          </div>

          {/* Winner 2 */}
          <div className="bg-bg-dark/60 border border-border-dim rounded-xl p-4 flex gap-4 items-center">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop" 
              alt="Ganhador PS5" 
              className="w-16 h-16 rounded-full object-cover border-2 border-primary-neon/30"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <strong className="text-xs text-white">Mateus Barbosa de SP</strong>
                <CheckCircle className="w-3.5 h-3.5 text-primary-neon" />
              </div>
              <p className="text-[10px] text-text-dim mt-0.5 italic">"Escolhi a cota 312 do Playstation 5 por apenas R$ 1,50. Sensacional!"</p>
              <span className="text-[9px] font-mono text-primary-neon mt-1 block">Rifa nº 2 · Sorteio Federal</span>
            </div>
          </div>

          {/* Winner 3 */}
          <div className="bg-bg-dark/60 border border-border-dim rounded-xl p-4 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-primary-neon/10 flex items-center justify-center border-2 border-primary-neon/30 text-primary-neon text-lg font-black font-mono">
              +1
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <strong className="text-xs text-white">Próximo Ganhador</strong>
                <Sparkles className="w-3.5 h-3.5 text-secondary-gold" />
              </div>
              <p className="text-[10px] text-text-dim mt-0.5 italic">"Você pode ser o próximo a receber o prêmio direto na sua residência."</p>
              <span className="text-[9px] font-mono text-secondary-gold mt-1 block">Inscreva-se no grid ativo!</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordions */}
      <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white mb-6 font-display flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary-neon" /> Perguntas Frequentes (F.A.Q.)
        </h3>
        
        <div className="divide-y divide-border-dim/40 space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="pt-3">
              <button
                onClick={() => toggleFaq(i)}
                className="w-full text-left py-2 flex justify-between items-center text-xs font-semibold text-white focus:outline-none cursor-pointer hover:text-primary-neon transition-colors"
              >
                <span>{faq.pergunta}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-primary-neon" /> : <ChevronDown className="w-4 h-4 text-text-dim" />}
              </button>
              {openFaq === i && (
                <div className="py-2.5 pb-4 text-xs text-text-dim leading-relaxed font-sans mt-1 animate-in slide-in-from-top-1 duration-150">
                  {faq.resposta}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
