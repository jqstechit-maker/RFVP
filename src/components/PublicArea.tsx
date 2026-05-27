import React, { useState, useEffect } from 'react';
import { Rifa, Pagamento, Cliente, LogSistema, PlataformaConfig } from '../types';
import { Smartphone, Shield, QrCode, ClipboardCheck, Timer, AlertTriangle, Check, RefreshCw, Layers, User, Phone, FileText } from 'lucide-react';

interface PublicAreaProps {
  rifas: Rifa[];
  pagamentos: Pagamento[];
  clientes: Cliente[];
  logs: LogSistema[];
  config: PlataformaConfig;
  onAddCliente: (cliente: Cliente) => void;
  onAddPagamento: (pagamento: Pagamento) => void;
  onUpdatePagamentoStatus: (txid: string, status: 'pago' | 'conflito' | 'reembolsado') => void;
  onAddLog: (mensagem: string, tipo: 'sucesso' | 'info' | 'erro' | 'alerta') => void;
}

export default function PublicArea({
  rifas,
  pagamentos,
  clientes,
  logs,
  config,
  onAddCliente,
  onAddPagamento,
  onUpdatePagamentoStatus,
  onAddLog
}: PublicAreaProps) {
  const [selectedRifaId, setSelectedRifaId] = useState<string | null>(null);
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [selectedCotas, setSelectedCotas] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'individual' | 'aleatoria'>('individual');
  const [customRandomInput, setCustomRandomInput] = useState<number | ''>('');
  const [cotaFilterRange, setCotaFilterRange] = useState<number>(0); // 0 = 000-099, 100 = 100-199, etc.
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Reset active image index and selected cotas on campaign switch
  useEffect(() => {
    setActiveImgIndex(0);
    setSelectedCotas([]);
  }, [selectedRifaId]);

  // Formular checkout
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutInput, setCheckoutInput] = useState({
    nome: '',
    telefone: '',
    cpf: '',
    email: ''
  });

  // Fatura Ativa (PIX Gerado)
  const [activeInvoice, setActiveInvoice] = useState<{
    pagamentoId: string;
    numero: string;
    txid: string;
    copiaCola: string;
    vencimentoSeconds: number;
    valor: number;
  } | null>(null);

  const [copiedTxt, setCopiedTxt] = useState(false);

  // Selecionar Rifa Inicial se houver
  useEffect(() => {
    const activeOnes = rifas.filter(r => r.status === 'ativa');
    if (activeOnes.length > 0 && !selectedRifaId) {
      setSelectedRifaId(activeOnes[0].id);
    }
  }, [rifas, selectedRifaId]);

  const currentRifa = rifas.find(r => r.id === selectedRifaId) || null;

  // Estatísticas calculadas desta rifa
  const getRifaStats = (rId: string) => {
    const pagos = pagamentos.filter(p => p.rifaId === rId && p.status === 'pago').length;
    const pendentes = pagamentos.filter(p => p.rifaId === rId && p.status === 'pendente').length;
    const porcentagem = Math.min(100, parseFloat(((pagos / 1000) * 100).toFixed(1)));
    return { pagos, pendentes, disponivel: Math.max(0, 1000 - pagos - pendentes), porcentagem };
  };

  // Simular Polling AJAX de 5 Segundos
  // Para mostrar a reatividade dos números de 000-999, vamos periodicamente "reservar" ou "pagar" números de forma simulada
  useEffect(() => {
    const interval = setInterval(() => {
      if (!currentRifa || currentRifa.status !== 'ativa') return;

      // Sorteia um número aleatório (de forma realista entre 000 e 999) com formato padding
      const randNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      
      // Verifica se o número já está preenchido
      const existente = pagamentos.find(p => p.rifaId === currentRifa.id && p.numero === randNum);
      if (existente) return; // Se já existe, pula este ciclo

      // Simular um terceiro de forma saudável
      const nomes = ['Marcos Antunes', 'Ana Julia Pinheiro', 'Ricardo Goulart', 'Sabrina Costa', 'Thiago Mendes', 'Larissa Freitas', 'Bruno Diniz', 'Patrícia Albuquerque'];
      const cpfs = ['12345678909', '98765432101', '45678912344', '32165498700'];
      const fakeNome = nomes[Math.floor(Math.random() * nomes.length)];
      const fakeCpf = cpfs[Math.floor(Math.random() * cpfs.length)];

      // 10% chance de pagar direto, 90% chance de criar pendente comercial
      const statusSimulado = Math.random() > 0.4 ? 'pendente' : 'pago';
      
      const newCl: Cliente = {
        id: 'cl_' + Math.random().toString(36).substr(2, 9),
        nome: fakeNome,
        telefone: `(11) 9${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
        cpf: fakeCpf,
        createdAt: new Date().toISOString()
      };

      onAddCliente(newCl);

      const newPag: Pagamento = {
        id: 'pag_' + Math.random().toString(36).substr(2, 9),
        rifaId: currentRifa.id,
        clienteId: newCl.id,
        numero: randNum,
        txid: 'TXID_' + statusSimulado.toUpperCase() + '_' + Math.random().toString(36).substr(2, 12).toUpperCase(),
        valor: currentRifa.valorPorNumero,
        status: statusSimulado,
        createdAt: new Date().toISOString()
      };

      onAddPagamento(newPag);
      onAddLog(
        `[Compra Simulada Web] Outro cliente (${fakeNome.split(' ')[0]}) reservou o numero ${randNum} (${statusSimulado.toUpperCase()})`,
        statusSimulado === 'pago' ? 'sucesso' : 'info'
      );
    }, 8000); // Executa a cada 8 segundos simulados para manter equilibrado e realista

    return () => clearInterval(interval);
  }, [currentRifa, pagamentos]);

  // Contagem regressiva do PIX
  useEffect(() => {
    if (!activeInvoice) return;
    const timer = setInterval(() => {
      setActiveInvoice(prev => {
        if (!prev) return null;
        if (prev.vencimentoSeconds <= 1) {
          // Expirou
          onAddLog(`Cobrança PIX para o número ${prev.numero} expirou por falta de pagamento.`, 'alerta');
          onUpdatePagamentoStatus(prev.txid, 'reembolsado');
          return null;
        }
        return { ...prev, vencimentoSeconds: prev.vencimentoSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeInvoice]);

  const handleCotaClick = (numStr: string) => {
    if (!currentRifa || currentRifa.status !== 'ativa') return;
    
    // Checar se já está pago ou em andamento
    const tStats = pagamentos.find(p => p.rifaId === currentRifa.id && p.numero === numStr && (p.status === 'pago' || p.status === 'pendente'));
    if (tStats) {
      if (tStats.status === 'pago') {
        const cl = clientes.find(c => c.id === tStats.clienteId);
        alert(`O número ${numStr} já está pago por ${cl?.nome || 'outro comprador'}.`);
      } else {
        alert(`O número ${numStr} está aguardando confirmação de PIX (Pendente). Se o pagamento não for realizado em 5 minutos, ele voltará a ficar disponível.`);
      }
      return;
    }

    if (selectedCotas.includes(numStr)) {
      setSelectedCotas(prev => prev.filter(c => c !== numStr));
    } else {
      setSelectedCotas(prev => [...prev, numStr].sort());
    }
  };

  const handleRemoveCota = (numStr: string) => {
    setSelectedCotas(prev => prev.filter(c => c !== numStr));
  };

  const handleAddRandomCotas = (count: number) => {
    if (!currentRifa) return;
    
    // Get all free cotas (not paid, not pending, and not already selected by user)
    const takenNumbers = new Set(
      pagamentos
        .filter(p => p.rifaId === currentRifa.id && (p.status === 'pago' || p.status === 'pendente'))
        .map(p => p.numero)
    );
    
    const userSelected = new Set(selectedCotas);
    const available = [];
    for (let i = 0; i < 1000; i++) {
      const numStr = String(i).padStart(3, '0');
      if (!takenNumbers.has(numStr) && !userSelected.has(numStr)) {
        available.push(numStr);
      }
    }
    
    if (available.length === 0) {
      alert("Não há mais cotas disponíveis para seleção.");
      return;
    }
    
    const chosen: string[] = [];
    const chooseCount = Math.min(count, available.length);
    for (let i = 0; i < chooseCount; i++) {
      const randIdx = Math.floor(Math.random() * available.length);
      chosen.push(available.splice(randIdx, 1)[0]);
    }
    
    setSelectedCotas(prev => [...prev, ...chosen].sort());
    onAddLog(`Selecionados +${chooseCount} números aleatórios pelo comprador no assistente de cotas.`, 'info');
  };

  const handleSelectRandomOnly = (count: number) => {
    if (!currentRifa) return;
    
    const takenNumbers = new Set(
      pagamentos
        .filter(p => p.rifaId === currentRifa.id && (p.status === 'pago' || p.status === 'pendente'))
        .map(p => p.numero)
    );
    
    const available = [];
    for (let i = 0; i < 1000; i++) {
      const numStr = String(i).padStart(3, '0');
      if (!takenNumbers.has(numStr)) {
        available.push(numStr);
      }
    }
    
    if (available.length === 0) {
      alert("Não há cotas disponíveis para seleção.");
      return;
    }
    
    const chosen: string[] = [];
    const chooseCount = Math.min(count, available.length);
    for (let i = 0; i < chooseCount; i++) {
      const randIdx = Math.floor(Math.random() * available.length);
      chosen.push(available.splice(randIdx, 1)[0]);
    }
    
    setSelectedCotas(chosen.sort());
    onAddLog(`O comprador escolheu a modalidade aleatória para ${chooseCount} cotas.`, 'info');
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRifa || selectedCotas.length === 0) return;

    if (!checkoutInput.nome || !checkoutInput.telefone || !checkoutInput.cpf) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    // Criar cliente e pagamento pendente
    const clId = 'cl_' + Math.random().toString(36).substr(2, 9);
    const newCliente: Cliente = {
      id: clId,
      nome: checkoutInput.nome,
      telefone: checkoutInput.telefone,
      cpf: checkoutInput.cpf,
      email: checkoutInput.email || undefined,
      createdAt: new Date().toISOString()
    };

    onAddCliente(newCliente);

    const txidUnico = 'TXID_PIX_' + Math.random().toString(36).substr(2, 12).toUpperCase();
    
    // Adicionar todos os pagamentos da seleção de cotas
    selectedCotas.forEach(cota => {
      const newPagamento: Pagamento = {
        id: 'pag_' + Math.random().toString(36).substr(2, 9),
        rifaId: currentRifa.id,
        clienteId: clId,
        numero: cota,
        txid: txidUnico,
        valor: currentRifa.valorPorNumero,
        status: 'pendente',
        createdAt: new Date().toISOString()
      };
      onAddPagamento(newPagamento);
    });

    const totalValor = currentRifa.valorPorNumero * selectedCotas.length;
    onAddLog(`Gerada cobrança PIX para ${checkoutInput.nome} - ${selectedCotas.length} Cotas: ${selectedCotas.join(', ')}`, 'info');

    const pixName = config.nomePlataforma.toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, '').substring(0, 15) || 'RIFAVIP';
    // Montar fatura ativa
    setActiveInvoice({
      pagamentoId: 'comb_' + Math.random().toString(36).substr(2, 9),
      numero: selectedCotas.join(', '),
      txid: txidUnico,
      copiaCola: `00020101021226830014br.gov.bcb.pix25610014br.gov.bcb.pix0139+${config.whatsappSuporte.replace(/[^0-9]/g, '')}5204000053039865404${totalValor.toFixed(2)}5802BR5913${pixName.padEnd(5, 'X')}6009SAO PAULO62070503${txidUnico}6304`,
      vencimentoSeconds: 300, // 5 minutos
      valor: totalValor
    });

    setShowCheckoutModal(false);
    setSelectedCotas([]);
  };

  // -------------------------------------------------------------
  // SIMULADORES DE WEBHOOK (PAINEL INTERATIVO DE TESTE DE API)
  // -------------------------------------------------------------
  const handleSimulateWebhookSuccess = () => {
    if (!activeInvoice) return;
    onUpdatePagamentoStatus(activeInvoice.txid, 'pago');
    onAddLog(`[Simulador Webhook API] Recebido retorno aprovado para TXID: ${activeInvoice.txid}. Baixa do número ${activeInvoice.numero} efetuada automaticamente pelo servidor central.`, 'sucesso');
    alert(`PIX Confirmado! O seu número ${activeInvoice.numero} foi adquirido e pago com sucesso. Parabéns!`);
    setActiveInvoice(null);
  };

  // Simular Concorrência Concorrente (Race Condition)
  // Outro comprador paga o mesmo número mais rápido que você, gerando um conflito de transação
  const handleSimulateWebhookConflict = () => {
    if (!activeInvoice) return;
    
    // Criamos outro pagamento aprovado antes do atual concluir
    const clId = 'cl_' + Math.random().toString(36).substr(2, 9);
    const concurrentCliente: Cliente = {
      id: clId,
      nome: 'Carlos Eduardo Ganhador Rápido',
      telefone: '(11) 98888-7777',
      cpf: '555.444.333-22',
      createdAt: new Date().toISOString()
    };
    onAddCliente(concurrentCliente);

    // Registra o outro como PAGO primeiro
    const concurrentPagamento: Pagamento = {
      id: 'pag_' + Math.random().toString(36).substr(2, 9),
      rifaId: currentRifa!.id,
      clienteId: clId,
      numero: activeInvoice.numero,
      txid: 'CONCURRENT_' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      valor: activeInvoice.valor,
      status: 'pago',
      createdAt: new Date().toISOString()
    };
    onAddPagamento(concurrentPagamento);

    // Agora processa o seu pagamento. Por já existir um PAGO, o seu cai em CONFLITO
    onUpdatePagamentoStatus(activeInvoice.txid, 'conflito');
    onAddLog(`[Simulador Concorrência] CONFLITO! O cliente Carlos Eduardo pagou o número ${activeInvoice.numero} milissegundos antes de seu pagamento. O TXID ${activeInvoice.txid} foi classificado como CONFLITO no banco.`, 'alerta');
    
    alert(`CONFLITO DE COMPRA DE ÚLTIMA HORA!\n\nAlguém pagou o número ${activeInvoice.numero} enquanto você preenchia a fatura.\nO sistema identificou o conflito (duplicidade) com sucesso. O administrador foi alertado de que há necessidade de reembolso manual.`);
    setActiveInvoice(null);
  };

  // Listagem de números gerados para o grid: 000 até 999
  const gridNumbers = Array.from({ length: 1000 }, (_, i) => String(i).padStart(3, '0'));

  // Aplicar filtros de pesquisa e o intervalo das centenas selecionado
  const filteredGridNumbers = gridNumbers.filter(num => {
    // 1. Filtrar pela centena ativa (000-099, 100-199, etc) se não tiver pesquisa por texto
    if (!searchTerm) {
      const numVal = parseInt(num);
      if (numVal < cotaFilterRange || numVal >= cotaFilterRange + 100) {
        return false;
      }
    } else {
      // Se tiver pesquisa, busca em todo o range de 1000 números
      if (!num.includes(searchTerm)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div id="public_area_wrapper" className="max-w-7xl mx-auto px-4 py-6">
      {/* 4 Active Raffles Section */}
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 font-display">
        <Layers className="w-5 h-5 text-primary-neon" />
        Sorteios VIP Disponíveis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {rifas.map(r => {
          const stats = getRifaStats(r.id);
          const isSelected = r.id === selectedRifaId;
          const isSorteada = r.status === 'sorteada';
          
          return (
            <div
              key={r.id}
              onClick={() => setSelectedRifaId(r.id)}
              className={`cursor-pointer group flex flex-col h-full rounded-2xl overflow-hidden border transition-all ${
                isSelected
                  ? 'bg-surface-dark border-primary-neon ring-1 ring-primary-neon/30 shadow-lg shadow-primary-neon/10'
                  : 'bg-surface-dark/40 border-border-dim hover:border-white/20'
              }`}
            >
              <div className="relative h-44 bg-bg-dark overflow-hidden">
                <img
                  src={r.imagemUrl}
                  alt={r.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                  {isSorteada ? (
                    <span className="bg-purple-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      Concluído
                    </span>
                  ) : (
                    <span className="bg-primary-neon text-bg-dark text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      Ativo
                    </span>
                  )}
                  <span className="bg-bg-dark/80 backdrop-blur-md text-primary-neon text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-border-dim font-bold">
                    R$ {r.valorPorNumero.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {isSorteada && (
                  <div className="absolute inset-0 bg-bg-dark/80 flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-purple-400 text-xs font-bold uppercase tracking-widest font-display">Ganhador</span>
                    <span className="text-white text-base font-bold truncate max-w-full">{r.ganhadorNome}</span>
                    <span className="text-primary-neon text-xl font-mono font-black mt-1">Cota {r.ganhadorNumero}</span>
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary-neon transition-colors font-display">
                    {r.titulo}
                  </h4>
                  <p className="text-xs text-text-dim line-clamp-2 mt-1.5 min-h-[32px]">
                    {r.descricao}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-border-dim">
                  <div className="flex justify-between items-center text-xs text-text-dim mb-1">
                    <span>Progresso de Vendas</span>
                    <span className="text-primary-neon font-bold font-mono">{stats.porcentagem}%</span>
                  </div>
                  <div className="h-2 w-full bg-bg-dark rounded-full overflow-hidden">
                    <div
                      className="bg-primary-neon h-full rounded-full transition-all duration-500 glow-primary"
                      style={{ width: `${stats.porcentagem}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-dim mt-1.5 font-mono">
                    <span>{stats.pagos} de 1000 cotas</span>
                    <span>{stats.disponivel} livres</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {currentRifa && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Raffle Detailed Grid Area */}
          <div className="lg:col-span-2 bg-surface-dark border border-border-dim rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-dim pb-5 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white font-display">{currentRifa.titulo}</h2>
                <div className="flex items-center gap-3 text-xs text-text-dim mt-1">
                  <span>Data do Sorteio: <strong className="text-slate-300">{new Date(currentRifa.dataSorteio).toLocaleDateString('pt-BR')}</strong></span>
                  <span>•</span>
                  <span className="text-primary-neon font-bold">R$ {currentRifa.valorPorNumero.toFixed(2)} por número</span>
                </div>
              </div>

              {/* Status Map Indicator bar */}
              <div className="flex items-center gap-3 text-xs bg-bg-dark px-3.5 py-1.5 rounded-lg border border-border-dim font-mono">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-border-dim border border-white/15" /> Livre
                </span>
                <span className="flex items-center gap-1.5 text-secondary-gold font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-gold glow-secondary" /> Pendente
                </span>
                <span className="flex items-center gap-1.5 text-primary-neon font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-neon glow-primary" /> Pago
                </span>
              </div>
            </div>

            {/* Interactive Image Gallery Selector - 5 photos per product */}
            {(() => {
              const currentRifaImages = [
                currentRifa.imagemUrl,
                ...(currentRifa.imagens && currentRifa.imagens.length > 0 ? currentRifa.imagens : [])
              ].filter(img => typeof img === 'string' && img.trim() !== '');

              // Build unique array and pad to 5
              const finalRifaImages = Array.from(new Set(currentRifaImages)).slice(0, 5);
              while (finalRifaImages.length < 5) {
                if (finalRifaImages.length === 0) {
                  finalRifaImages.push('https://images.unsplash.com/photo-1621768216002-5ac171876725?w=800&auto=format&fit=crop');
                } else {
                  finalRifaImages.push(finalRifaImages[0]);
                }
              }

              return (
                <div className="mb-6 space-y-3">
                  <span className="text-[10px] text-text-dim uppercase tracking-wider font-extrabold font-mono block">Galeria de Fotos do Prêmio (Até 5 Fotos)</span>
                  <div className="relative h-64 sm:h-80 bg-bg-dark rounded-2xl overflow-hidden border border-border-dim shadow-xl group/gallery">
                    <img
                      src={finalRifaImages[activeImgIndex]}
                      alt={`${currentRifa.titulo} - Foto ${activeImgIndex + 1}`}
                      className="w-full h-full object-cover transition-all duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Image indicator badges */}
                    <div className="absolute top-4 right-4 bg-bg-dark/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-white border border-border-dim shadow-lg">
                      {activeImgIndex + 1} / 5
                    </div>

                    {/* Navigation Arrows */}
                    <button
                      type="button"
                      onClick={() => setActiveImgIndex((prev) => (prev === 0 ? 4 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg-dark/80 hover:bg-bg-dark text-white rounded-full flex items-center justify-center border border-border-dim cursor-pointer transition-all opacity-0 group-hover/gallery:opacity-100 font-bold select-none text-lg"
                      title="Foto Anterior"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImgIndex((prev) => (prev === 4 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg-dark/80 hover:bg-bg-dark text-white rounded-full flex items-center justify-center border border-border-dim cursor-pointer transition-all opacity-0 group-hover/gallery:opacity-100 font-bold select-none text-lg"
                      title="Próxima Foto"
                    >
                      ›
                    </button>
                  </div>

                  {/* Thumbnail row */}
                  <div className="grid grid-cols-5 gap-3">
                    {finalRifaImages.map((img, idx) => {
                      const isActive = idx === activeImgIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImgIndex(idx)}
                          className={`relative aspect-video rounded-xl overflow-hidden bg-bg-dark border cursor-pointer transition-all duration-200 ${
                            isActive 
                              ? 'border-primary-neon ring-2 ring-primary-neon/25 scale-[1.03] shadow-lg shadow-primary-neon/10' 
                              : 'border-border-dim hover:border-slate-400 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Miniatura ${idx + 1}`}
                            className="w-full h-full object-cover absolute inset-0 w-full h-full"
                            referrerPolicy="no-referrer"
                          />
                          <div className={`absolute inset-0 bg-primary-neon/10 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* MULTIPLE SELECTION CONTROL MODULE */}
            <div className="mb-6 bg-bg-dark/65 border border-border-dim rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-dim/40 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-primary-neon flex items-center gap-1.5">
                    Método de Escolha de Números
                  </h4>
                  <p className="text-[11px] text-text-dim mt-0.5 font-sans leading-relaxed">
                    Compre mais cotas de uma vez! Escolha manualmente no grid abaixo ou use opções aleatórias rápidas.
                  </p>
                </div>

                {/* Toggle button tabs between modes */}
                <div className="flex bg-surface-dark p-1 rounded-xl border border-border-dim/85 text-[11px] font-mono flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMode('individual');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectionMode === 'individual'
                        ? 'bg-primary-neon text-bg-dark font-black'
                        : 'text-text-dim hover:text-white'
                    }`}
                  >
                    Individual / Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMode('aleatoria');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectionMode === 'aleatoria'
                        ? 'bg-primary-neon text-bg-dark font-black'
                        : 'text-text-dim hover:text-white'
                    }`}
                  >
                    Aleatória (Surpresinha)
                  </button>
                </div>
              </div>

              {/* Render Controls Based on Mode */}
              {selectionMode === 'individual' ? (
                <div className="pt-1">
                  <div className="bg-surface-dark/40 border border-border-dim/40 rounded-xl p-3 flex flex-wrap justify-between items-center gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-text-dim font-bold uppercase font-mono block">Como selecionar:</span>
                      <p className="text-[11px] text-slate-300">
                        Clique diretamente nos números livres desejados no grid para incluí-los.
                      </p>
                    </div>
                    {/* Quick select random keys */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-text-dim font-bold uppercase font-mono mr-1">Adicionar Rápido:</span>
                      {[3, 5, 10, 20, 50].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleAddRandomCotas(num)}
                          className="px-2.5 py-1 bg-surface-dark border border-border-dim hover:border-primary-neon/50 rounded-lg text-[10px] font-mono font-bold text-slate-300 hover:text-white cursor-pointer transition-all"
                        >
                          +{num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-1 space-y-3.5">
                  <div className="bg-surface-dark/40 border border-border-dim/40 rounded-xl p-3 space-y-3">
                    <span className="text-[10px] text-text-dim font-bold uppercase font-mono block">Escolha um combo de números aleatórios garantidos:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { label: '03 Cotas', count: 3, badge: 'Standard' },
                        { label: '05 Cotas', count: 5, badge: 'Popular' },
                        { label: '10 Cotas', count: 10, badge: 'Premium' },
                        { label: '30 Cotas', count: 30, badge: 'Super VIP' },
                        { label: '50 Cotas', count: 50, badge: 'Elite' }
                      ].map((item) => (
                        <button
                          key={item.count}
                          type="button"
                          onClick={() => {
                            handleSelectRandomOnly(item.count);
                          }}
                          className="px-3 py-3 bg-bg-dark border border-border-dim hover:border-primary-neon/45 hover:bg-surface-dark rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-0.5 text-slate-200"
                        >
                          <span className="text-xs font-black font-display text-white">{item.label}</span>
                          <span className="text-[9px] text-primary-neon font-bold uppercase tracking-wider font-mono opacity-85">{item.badge}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                      <div className="w-full sm:w-auto">
                        <span className="text-[10px] text-text-dim uppercase font-mono font-bold">Ou digite uma quantidade personalizada:</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-64">
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={customRandomInput}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCustomRandomInput(isNaN(val) ? '' : Math.min(200, Math.max(1, val)));
                          }}
                          placeholder="Ex: 15"
                          className="w-full px-3 py-1.5 bg-bg-dark border border-border-dim rounded-lg text-xs font-mono text-white focus:outline-none focus:border-primary-neon/50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const num = typeof customRandomInput === 'number' ? customRandomInput : parseInt(customRandomInput);
                            if (num && num > 0) {
                              handleSelectRandomOnly(num);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-primary-neon text-bg-dark font-black rounded-lg text-xs hover:opacity-95 font-mono cursor-pointer transition-all flex-shrink-0"
                        >
                          Selecionar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active shopping cart state panel if cotas are selected */}
              {selectedCotas.length > 0 && (
                <div className="p-3.5 bg-primary-neon/5 border border-primary-neon/20 rounded-xl space-y-3 animate-in slide-in-from-top-1 duration-200">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-bg-dark/40 p-3 rounded-xl border border-border-dim/30">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase font-mono">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-neon glow-primary animate-pulse" />
                        Seus Números Selecionados — {selectedCotas.length} {selectedCotas.length === 1 ? 'Cota' : 'Cotas'}
                      </div>
                      <div className="text-[11px] text-text-dim">
                        Total a pagar: <strong className="text-primary-neon text-xs font-bold">R$ {(currentRifa.valorPorNumero * selectedCotas.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCotas([]);
                        }}
                        className="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white font-mono bg-bg-dark/40 hover:bg-bg-dark rounded-xl border border-border-dim cursor-pointer transition-colors"
                      >
                        Limpar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCheckoutModal(true);
                        }}
                        className="px-4 py-2 text-xs font-black text-bg-dark bg-primary-neon hover:bg-primary-neon/90 rounded-xl glow-primary font-mono uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1 active:scale-95 duration-200"
                      >
                        Fazer Checkout ({selectedCotas.length}) ↗
                      </button>
                    </div>
                  </div>

                  {/* Mini scrollable list badge represent */}
                  <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto bg-bg-dark/30 p-2.5 rounded-xl border border-border-dim/50">
                    {selectedCotas.map((num) => (
                      <span
                        key={num}
                        title="Clique para remover"
                        onClick={() => handleRemoveCota(num)}
                        className="group cursor-pointer bg-bg-dark border border-border-dim text-primary-neon hover:border-red-500 hover:text-red-400 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                      >
                        {num}
                        <span className="text-[9px] text-text-dim group-hover:text-red-400">×</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Hundreds System & Searching */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {Array.from({ length: 10 }, (_, i) => i * 100).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setCotaFilterRange(range);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                      cotaFilterRange === range && !searchTerm
                        ? 'bg-primary-neon text-bg-dark font-bold hover:opacity-95'
                        : 'bg-bg-dark text-text-dim hover:text-white border border-border-dim'
                    }`}
                  >
                    {String(range).padStart(3, '0')}-{String(range + 99).padStart(3, '0')}
                  </button>
                ))}
              </div>

              <div className="flex-shrink-0">
                <input
                  type="text"
                  maxLength={3}
                  value={searchTerm}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    setSearchTerm(clean);
                    setCotaFilterRange(-1); // Desativa centena ativa se estiver filtrando
                  }}
                  placeholder="Pesquisar número (Ex: 042)..."
                  className="w-full sm:w-56 px-3 py-1.5 bg-bg-dark border border-border-dim rounded-lg text-xs font-mono text-white focus:outline-none focus:border-primary-neon/50"
                />
              </div>
            </div>

            {/* LIVE Polling AJAX Indicator */}
            <div className="flex justify-between items-center bg-bg-dark/60 p-2.5 rounded-xl border border-border-dim mb-5 text-[11px] font-mono text-text-dim">
              <span className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-neon opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-neon"></span>
                </span>
                Atualização em tempo real (AJAX 5s ativo)
              </span>
              <span>Total vendido: <strong className="text-primary-neon">{pagamentos.filter(p => p.rifaId === currentRifa.id && p.status === 'pago').length} / 1000</strong></span>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[360px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-850">
              {filteredGridNumbers.map(num => {
                // Procurar se tem registro de débito ativo neste número
                const ticketReg = pagamentos.find(p => p.rifaId === currentRifa!.id && p.numero === num && (p.status === 'pago' || p.status === 'pendente'));
                const status = ticketReg ? ticketReg.status : 'disponivel';
                const isSelectedByUser = selectedCotas.includes(num);

                return (
                  <button
                    key={num}
                    onClick={() => handleCotaClick(num)}
                    disabled={currentRifa.status !== 'ativa'}
                    className={`aspect-square sm:aspect-video text-xs sm:text-sm font-bold font-mono transition-all rounded-lg border flex flex-col items-center justify-center p-1 cursor-pointer select-none ${
                        status === 'pago'
                          ? 'bg-primary-neon border-primary-neon text-bg-dark font-black shadow-sm shadow-primary-neon/10 glow-primary'
                          : status === 'pendente'
                          ? 'bg-secondary-gold border-secondary-gold text-bg-dark animate-pulse font-bold glow-secondary'
                          : isSelectedByUser
                          ? 'bg-primary-neon/15 border-primary-neon text-primary-neon font-black shadow-inner shadow-primary-neon/5 hover:bg-primary-neon/25'
                          : 'bg-bg-dark/40 border-border-dim text-text-dim hover:bg-surface-dark hover:text-white hover:border-white/20'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
              {filteredGridNumbers.length === 0 && (
                <div className="col-span-full py-10 text-center text-text-dim text-xs font-mono">
                  Nenhum número correspondente encontrado para a pesquisa.
                </div>
              )}
            </div>
          </div>

          {/* Checkout Invoice State or General Rules */}
          <div className="flex flex-col gap-6">
            {activeInvoice ? (
              <div className="bg-surface-dark border border-primary-neon/40 shadow-xl shadow-primary-neon/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-primary-neon/10 rounded-bl-full flex items-center justify-center pl-4 pb-4 text-primary-neon">
                  <Timer className="w-5 h-5 text-primary-neon" />
                </div>

                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1.5 font-display">
                  Fatura de Compra Gerada!
                </h3>
                <p className="text-xs text-text-dim mb-4 font-mono leading-relaxed">
                  Cota reservada: <strong className="text-white bg-bg-dark px-2.5 py-0.5 rounded border border-border-dim">{activeInvoice.numero}</strong>
                </p>

                {/* Simulated Payment Area Code / QR Code */}
                <div className="p-4 bg-bg-dark rounded-xl border border-border-dim text-center flex flex-col items-center gap-3">
                  <div className="p-2 bg-white rounded-lg inline-block shadow-inner">
                    <QrCode className="w-32 h-32 text-bg-dark" />
                  </div>
                  
                  <div className="w-full">
                    <span className="text-[10px] text-text-dim uppercase tracking-widest block font-mono">Código Pix Copia e Cola</span>
                    <input
                      type="text"
                      readOnly
                      value={activeInvoice.copiaCola}
                      className="w-full text-center bg-surface-dark border border-border-dim text-[10px] font-mono p-1.5 rounded mt-1.5 text-text-dim outline-none select-all"
                    />
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeInvoice.copiaCola);
                      setCopiedTxt(true);
                      setTimeout(() => setCopiedTxt(false), 2000);
                    }}
                    className="px-3.5 py-1.5 bg-surface-dark hover:bg-bg-dark text-slate-300 text-[11px] font-bold rounded-lg border border-border-dim inline-flex items-center gap-1.5 transition-all mt-1 w-full justify-center cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-primary-neon" />
                    {copiedTxt ? "Copiado!" : "Copiar Chave Pix"}
                  </button>
                </div>

                {/* Expiration Count Progress */}
                <div className="mt-4 p-3 bg-bg-dark rounded-xl border border-border-dim flex items-center justify-between text-xs font-mono text-text-dim">
                  <span>Expira em:</span>
                  <span className="text-secondary-gold font-bold">
                    {Math.floor(activeInvoice.vencimentoSeconds / 60)}:
                    {String(activeInvoice.vencimentoSeconds % 60).padStart(2, '0')}
                  </span>
                </div>

                {/* SIMULADO WEBHOOK CONTROLLER DE CONVENIÊNCIA */}
                <div className="mt-6 pt-5 border-t border-border-dim">
                  <span className="text-xs font-black text-rose-400 flex items-center gap-1.5 mb-2 font-display">
                    <Shield className="w-4 h-4" /> Simulador de Webhook de Entrada
                  </span>
                  <p className="text-[11px] text-text-dim leading-relaxed mb-3">
                    O gateway de pagamento do Mercado Pago envia a chamada de webhook para realizar a baixa instantânea. Simule este fluxo técnico abaixo:
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      onClick={handleSimulateWebhookSuccess}
                      className="w-full px-4 py-2.5 bg-primary-neon hover:opacity-90 text-bg-dark font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-neon/10 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3px]" /> Simular Pagamento Aprovado
                    </button>
                    <button
                      onClick={handleSimulateWebhookConflict}
                      className="w-full px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4" /> Simular Concorrência (Gerar Conflito)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-dark border border-border-dim rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-3 font-display">Como participar da Rifa?</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-bg-dark text-primary-neon font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-border-dim">1</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Escolha um número livre no grid</h4>
                      <p className="text-[11px] text-text-dim mt-1 leading-relaxed">Você pode escolher qualquer dezena (de 000 a 999) no grid. Os números brancos estão livres!</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-bg-dark text-primary-neon font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-border-dim">1</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Faça o Pix</h4>
                      <p className="text-[11px] text-text-dim mt-1 leading-relaxed">Insira seu nome, telefone e CPF. O sistema gerará o Pix copia e cola imediatamente.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-bg-dark text-primary-neon font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-border-dim">2</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Confirmação Instantânea</h4>
                      <p className="text-[11px] text-text-dim mt-1 leading-relaxed">Assim que o Pix for pago, o gateway envia a notificação e o sistema realiza a baixa instantânea e segura.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-bg-dark rounded-xl border border-border-dim">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5 font-display">
                    <Shield className="w-3.5 h-3.5 text-primary-neon" />
                    Regra Antiduplicidade Garantida
                  </h4>
                  <p className="text-[11px] text-text-dim leading-relaxed">
                    Nossa regra de banco inteligente previne vendas duplas no mesmo microssegundo. O primeiro a ser confirmado fica com o número; os demais que forem pagos ficam em estado de 'conflito' aguardando reembolso ou reatribuição pelo administrador!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT POPUP MODAL */}
      {showCheckoutModal && selectedCotas.length > 0 && (
        <div className="fixed inset-0 bg-bg-dark/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface-dark border border-border-dim rounded-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-border-dim pb-3 mb-4">
              <div>
                <span className="text-primary-neon text-[10px] font-bold uppercase tracking-widest font-mono">Checkout da Rifa VIP</span>
                <h3 className="text-base font-bold text-white font-display">Comprar {selectedCotas.length} {selectedCotas.length === 1 ? 'Número' : 'Números'}</h3>
              </div>
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                }}
                className="text-text-dim hover:text-white text-xs font-mono p-1 px-2.5 bg-bg-dark rounded-md border border-border-dim cursor-pointer transition-all"
              >
                Fechar
              </button>
            </div>

            {/* List of Cotas being purchased */}
            <div className="mb-4">
              <span className="block text-[10px] text-text-dim uppercase tracking-wider font-extrabold font-mono mb-1.5">Números selecionados:</span>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto bg-bg-dark/50 p-2.5 rounded-xl border border-border-dim/40 scrollbar-thin">
                {selectedCotas.map((num) => (
                  <span key={num} className="bg-primary-neon text-bg-dark px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    {num}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-dim mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-primary-neon" /> Nome Completo <span className="text-rose-450">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva Santos"
                  value={checkoutInput.nome}
                  onChange={(e) => setCheckoutInput({ ...checkoutInput, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-dim mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-primary-neon" /> WhatsApp <span className="text-rose-450">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={checkoutInput.telefone}
                    onChange={(e) => setCheckoutInput({ ...checkoutInput, telefone: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-dim mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-primary-neon" /> CPF <span className="text-rose-450">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123.456.789-00"
                    value={checkoutInput.cpf}
                    onChange={(e) => setCheckoutInput({ ...checkoutInput, cpf: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-dim mb-1">
                  E-mail <span className="text-slate-600 font-mono text-[10px]">(Opcional)</span>
                </label>
                <input
                  type="email"
                  placeholder="joao@gmail.com"
                  value={checkoutInput.email}
                  onChange={(e) => setCheckoutInput({ ...checkoutInput, email: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-border-dim flex items-center justify-between text-xs font-mono text-text-dim mb-1">
                <span>Total da Compra ({selectedCotas.length} {selectedCotas.length === 1 ? 'Cota' : 'Cotas'})</span>
                <span className="text-white font-bold font-sans text-sm">
                  R$ {(currentRifa.valorPorNumero * selectedCotas.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary-neon hover:opacity-90 text-bg-dark font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-primary-neon/25 glow-btn-primary cursor-pointer"
              >
                Gerar Pagamento Pix
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
