import React, { useState, useEffect } from 'react';
import { Rifa, Pagamento, Cliente, LogSistema, PlataformaConfig } from './types';
import PublicArea from './components/PublicArea';
import AdminArea from './components/AdminArea';
import QuemSomos from './components/QuemSomos';
import Contato from './components/Contato';
import { Layers, ShieldCheck, FileCode, Landmark, AppWindow, ExternalLink, Award, Users, MessageSquare } from 'lucide-react';

const INITIAL_CONFIG: PlataformaConfig = {
  nomePlataforma: 'Rifa VIP',
  logoTexto: 'RV',
  bannerTitulo: 'Concorra aos Melhores premios',
  bannerSubtitulo: 'Escolha dezenas da sua sorte no grid! Processador de pagamentos certificado com baixa instantânea e regulamento auditado em conformidade total.',
  corPrimaria: 'cyan',
  whatsappSuporte: '5511999999999',
  instagram: 'https://instagram.com/rifavip',
  facebook: 'https://facebook.com/rifavip',
  textosInstitucionais: 'A Rifa VIP nasceu com a missão de transformar o cenário de campanhas promocionais de sorteios no Brasil, trazendo tecnologia de ponta, processos auditáveis e transparência impecável de ponta a ponta.',
  faviconUrl: '⚡'
};

const THEME_COLORS = {
  emerald: '#2563eb',
  amber: '#f2a60c',
  cyan: '#2563eb',
  purple: '#aa33ff',
  rose: '#ff3366',
};

// Seeder Dados de Sorteio Inicial
const INITIAL_RIFAS: Rifa[] = [
  {
    id: '1',
    titulo: 'iPhone 15 Pro Max 256GB Platinum',
    descricao: 'Sorteio de 1 iPhone 15 Pro Max lacrado, cor Titânio por apenas R$ 2,50 por número! Entrega segura com nota fiscal e garantia oficial inclusa.',
    valorPorNumero: 2.50,
    dataSorteio: '2026-06-15T20:00',
    quantidadeNumeros: 1000,
    imagemUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop',
    imagens: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621768216002-5ac171876725?w=800&auto=format&fit=crop'
    ],
    status: 'ativa'
  },
  {
    id: '2',
    titulo: 'Playstation 5 Slim + 2 Controles DualSense',
    descricao: 'Participe do sorteio deste super setup gamer de Playstation 5 Slim, incluindo 2 controles originais e o jogo EA Sports FC 24.',
    valorPorNumero: 1.50,
    dataSorteio: '2026-06-20T20:00',
    quantidadeNumeros: 1000,
    imagemUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop',
    imagens: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop'
    ],
    status: 'ativa'
  },
  {
    id: '3',
    titulo: 'PC Gamer Ryzen 7 + RTX 4070 Mastertech',
    descricao: 'Super máquina gamer equipada com AMD Ryzen 7, RTX 4070, 32GB RAM DDR5, SSD NVMe de 1TB e Watercooler RGB de alto desempenho.',
    valorPorNumero: 3.00,
    dataSorteio: '2026-06-30T21:00',
    quantidadeNumeros: 1000,
    imagemUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop',
    imagens: [
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop'
    ],
    status: 'ativa'
  },
  {
    id: '4',
    titulo: 'Scooter Elétrica Watts WASC 3000w',
    descricao: 'Economia e agilidade na sua rotina diária com a belíssima Scooter Elétrica Watts 3000w. Não consome combustível, recarregável em qualquer tomada.',
    valorPorNumero: 5.00,
    dataSorteio: '2026-07-10T20:30',
    quantidadeNumeros: 1000,
    imagemUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop',
    imagens: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&auto=format&fit=crop'
    ],
    status: 'ativa'
  }
];

// Seeder Clientes Iniciais para povoamento do Dashboard
const INITIAL_CLIENTES: Cliente[] = [
  { id: 'cl_1', nome: 'Rodrigo Medeiros', telefone: '(11) 98888-1234', cpf: '123.456.789-01', createdAt: '2026-05-26T10:00:00Z' },
  { id: 'cl_2', nome: 'Mariana Azevedo', telefone: '(21) 97777-4321', cpf: '987.654.321-02', createdAt: '2026-05-26T11:30:00Z' },
  { id: 'cl_3', nome: 'Felipe Sales', telefone: '(31) 99123-4567', cpf: '456.789.012-03', createdAt: '2026-05-26T12:00:00Z' },
  { id: 'cl_4', nome: 'Danielle Schorr', telefone: '(41) 98111-2222', cpf: '321.654.987-04', email: 'dani@gmail.com', createdAt: '2026-05-26T14:15:00Z' }
];

// Seeder de Vendas Iniciais (pago/pendente)
const INITIAL_PAGAMENTOS: Pagamento[] = [
  { id: 'pag_1', rifaId: '1', clienteId: 'cl_1', numero: '042', txid: 'TXID_MOCK_1', valor: 2.50, status: 'pago', createdAt: '2026-05-26T10:05:00Z', pagadoAt: '2026-05-26T10:06:00Z' },
  { id: 'pag_2', rifaId: '1', clienteId: 'cl_2', numero: '111', txid: 'TXID_MOCK_2', valor: 2.50, status: 'pago', createdAt: '2026-05-26T11:35:00Z', pagadoAt: '2026-05-26T11:36:00Z' },
  { id: 'pag_3', rifaId: '1', clienteId: 'cl_3', numero: '999', txid: 'TXID_MOCK_3', valor: 2.50, status: 'pendente', createdAt: '2026-05-26T12:05:00Z' },
  { id: 'pag_4', rifaId: '2', clienteId: 'cl_4', numero: '312', txid: 'TXID_MOCK_4', valor: 1.50, status: 'pago', createdAt: '2026-05-26T14:18:00Z', pagadoAt: '2026-05-26T14:19:00Z' },
  { id: 'pag_5', rifaId: '3', clienteId: 'cl_1', numero: '007', txid: 'TXID_MOCK_5', valor: 3.00, status: 'pago', createdAt: '2026-05-26T15:00:00Z', pagadoAt: '2026-05-26T15:01:00Z' },
  { id: 'pag_6', rifaId: '4', clienteId: 'cl_2', numero: '777', txid: 'TXID_MOCK_6', valor: 5.00, status: 'pago', createdAt: '2026-05-26T16:00:00Z', pagadoAt: '2026-05-26T16:02:00Z' }
];

const INITIAL_LOGS: LogSistema[] = [
  { id: 'log_1', tipo: 'info', mensagem: 'Banco de dados central de alta performance sintonizado com sementes de segurança.', dataHora: '2026-05-26T23:53:25Z' },
  { id: 'log_2', tipo: 'sucesso', mensagem: 'Webhook secundário de confirmação Pix ativo e sintonizado com Certificado SSL.', dataHora: '2026-05-26T23:53:26Z' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'rifas' | 'quemsomos' | 'contato' | 'admin'>('rifas');

  const [config, setConfig] = useState<PlataformaConfig>(() => {
    const saved = localStorage.getItem('rifa_vip_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.corPrimaria === 'emerald') {
          parsed.corPrimaria = 'cyan';
        }
        if (parsed.bannerTitulo === 'Concorra aos Melhores Setups por Centavos') {
          parsed.bannerTitulo = 'Concorra aos Melhores premios';
        }
        return parsed;
      } catch (e) {
        return INITIAL_CONFIG;
      }
    }
    return INITIAL_CONFIG;
  });

  // Carregar dados de localStorage com fallbacks sementeados
  const [rifas, setRifas] = useState<Rifa[]>(() => {
    const saved = localStorage.getItem('rifa_vip_rifas');
    return saved ? JSON.parse(saved) : INITIAL_RIFAS;
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('rifa_vip_clientes');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTES;
  });

  const [pagamentos, setPagamentos] = useState<Pagamento[]>(() => {
    const saved = localStorage.getItem('rifa_vip_pagamentos');
    return saved ? JSON.parse(saved) : INITIAL_PAGAMENTOS;
  });

  const [logs, setLogs] = useState<LogSistema[]>(() => {
    const saved = localStorage.getItem('rifa_vip_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  // Persistir em cada alteração
  useEffect(() => {
    localStorage.setItem('rifa_vip_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('rifa_vip_rifas', JSON.stringify(rifas));
  }, [rifas]);

  useEffect(() => {
    localStorage.setItem('rifa_vip_clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('rifa_vip_pagamentos', JSON.stringify(pagamentos));
  }, [pagamentos]);

  useEffect(() => {
    localStorage.setItem('rifa_vip_logs', JSON.stringify(logs));
  }, [logs]);

  // Auxiliares de Modificação de Estado Central
  const handleAddCliente = (newCliente: Cliente) => {
    setClientes(prev => [newCliente, ...prev]);
  };

  const handleAddPagamento = (newPagamento: Pagamento) => {
    setPagamentos(prev => [newPagamento, ...prev]);
  };

  const handleUpdatePagamentoStatus = (txid: string, status: 'pago' | 'conflito' | 'reembolsado') => {
    setPagamentos(prev => prev.map(p => {
      if (p.txid === txid) {
        return {
          ...p,
          status,
          pagadoAt: status === 'pago' ? new Date().toISOString() : p.pagadoAt
        };
      }
      return p;
    }));
  };

  const handleAddLog = (mensagem: string, tipo: 'sucesso' | 'info' | 'erro' | 'alerta') => {
    const newLog: LogSistema = {
      id: 'log_' + Date.now(),
      tipo,
      mensagem,
      dataHora: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Mutações Administrativas de Rifas
  const handleAddRifa = (rifa: Rifa) => {
    setRifas(prev => [rifa, ...prev]);
  };

  const handleUpdateRifa = (updated: Rifa) => {
    setRifas(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleDeleteRifa = (id: string) => {
    setRifas(prev => prev.filter(r => r.id !== id));
    setPagamentos(prev => prev.filter(p => p.rifaId !== id)); // Remove vendas vinculadas
  };

  // Desfazer todas as compras para relatórios limpos
  const handleClearTransactions = () => {
    setPagamentos([]);
    setClientes([]);
    setLogs([]);
  };

  const currentThemeColor = THEME_COLORS[config.corPrimaria] || '#2563eb';
  const primaryRGB = config.corPrimaria === 'emerald' ? '37, 99, 235' :
                     config.corPrimaria === 'amber' ? '242, 166, 12' :
                     config.corPrimaria === 'cyan' ? '37, 99, 235' :
                     config.corPrimaria === 'purple' ? '170, 51, 255' :
                     '255, 51, 102'; // rose

  return (
    <div 
      className="min-h-screen text-white flex flex-col justify-between selection:bg-primary-neon selection:text-bg-dark"
      style={{ 
        '--color-primary-neon': currentThemeColor,
        background: `radial-gradient(circle at top right, rgba(${primaryRGB}, 0.12), transparent 45%), 
                     radial-gradient(circle at bottom left, rgba(255, 204, 0, 0.03), transparent 35%),
                     #08090a`
      } as React.CSSProperties}
    >
      
      {/* SaaS Top Header Navbar */}
      <header className="border-b border-border-dim bg-surface-dark/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="px-3.5 py-1.5 bg-primary-neon text-bg-dark rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary-neon/20 tracking-tighter">
              {config.logoTexto}
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1">
                {config.nomePlataforma}
                <span className="text-[10px] bg-bg-dark text-text-dim font-mono py-0.5 px-2 rounded-full border border-border-dim">
                  {config.faviconUrl || '⚡'}
                </span>
              </h1>
              <p className="text-[10px] text-text-dim font-medium">Plataforma Certificada de Sorteios</p>
            </div>
          </div>

          {/* Tab Selection Navigation */}
          <nav className="flex items-center gap-1 bg-bg-dark p-1.5 rounded-xl border border-border-dim">
            <button
              onClick={() => setActiveTab('rifas')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'rifas'
                   ? 'bg-primary-neon text-bg-dark shadow-md shadow-primary-neon/20'
                  : 'text-text-dim hover:text-white'
              }`}
            >
              <AppWindow className="w-3.5 h-3.5" />
              Rifas em Andamento
            </button>

            <button
              onClick={() => setActiveTab('quemsomos')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'quemsomos'
                   ? 'bg-primary-neon text-bg-dark shadow-md shadow-primary-neon/20'
                  : 'text-text-dim hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Quem Somos
            </button>

            <button
              onClick={() => setActiveTab('contato')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'contato'
                   ? 'bg-primary-neon text-bg-dark shadow-md shadow-primary-neon/20'
                  : 'text-text-dim hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Contato
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                   ? 'bg-primary-neon text-bg-dark shadow-md shadow-primary-neon/20'
                  : 'text-text-dim hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel Administrativo
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-grow">
        {activeTab === 'rifas' && (
          <div className="animate-in fade-in duration-200">
            {/* Banner Decorativo */}
            <div className="max-w-7xl mx-auto px-4 pt-6">
              <div 
                className="bg-surface-dark/90 border border-border-dim p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden"
                style={{
                  background: `radial-gradient(circle at top right, rgba(${primaryRGB}, 0.12), transparent45%), #121418`
                }}
              >
                <div className="relative z-10">
                  <span className="text-xs text-primary-neon uppercase tracking-widest font-black font-mono">Prêmios Exclusivos</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight leading-tight mt-2 pb-0.5">{config.bannerTitulo}</h2>
                  <p className="text-xs text-text-dim mt-2.5 max-w-xl leading-relaxed">
                    {config.bannerSubtitulo}
                  </p>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="text-center">
                    <span className="text-[10px] text-text-dim block uppercase font-mono">Campanhas</span>
                    <strong className="text-3xl text-white font-black font-display font-mono">{rifas.length}</strong>
                  </div>
                  <div className="h-8 w-px bg-border-dim" />
                  <div className="text-center">
                    <span className="text-[10px] text-text-dim block uppercase font-mono">Cotas / Rifa</span>
                    <strong className="text-3xl text-white font-black font-display font-mono">1.000</strong>
                  </div>
                  <div className="h-8 w-px bg-border-dim" />
                  <div className="text-center">
                    <span className="text-[10px] text-text-dim block uppercase font-mono">PIX</span>
                    <strong className="text-3xl text-primary-neon font-black font-display font-mono">100%</strong>
                  </div>
                </div>
              </div>
            </div>

            <PublicArea
              rifas={rifas}
              pagamentos={pagamentos}
              clientes={clientes}
              logs={logs}
              config={config}
              onAddCliente={handleAddCliente}
              onAddPagamento={handleAddPagamento}
              onUpdatePagamentoStatus={handleUpdatePagamentoStatus}
              onAddLog={handleAddLog}
            />
          </div>
        )}

        {activeTab === 'quemsomos' && (
          <div className="animate-in fade-in duration-200">
            <QuemSomos config={config} />
          </div>
        )}

        {activeTab === 'contato' && (
          <div className="animate-in fade-in duration-200">
            <Contato config={config} />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="animate-in fade-in duration-200">
            <AdminArea
              rifas={rifas}
              pagamentos={pagamentos}
              clientes={clientes}
              logs={logs}
              config={config}
              onUpdateConfig={setConfig}
              onAddRifa={handleAddRifa}
              onUpdateRifa={handleUpdateRifa}
              onDeleteRifa={handleDeleteRifa}
              onAddLog={handleAddLog}
              onUpdatePagamentoStatus={handleUpdatePagamentoStatus}
              onClearTransactions={handleClearTransactions}
              onAddCliente={handleAddCliente}
              onAddPagamento={handleAddPagamento}
            />
          </div>
        )}
      </main>

      {/* Footer Branding Area */}
      <footer className="border-t border-border-dim bg-bg-dark py-6 text-center text-text-dim">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs">
            © Desenvolvido por <strong>JqsTech-it Soluções em Tecnologia</strong>.
          </p>
          <div className="flex gap-4 text-[11px] font-mono">
            <span className="text-primary-neon/75 select-none font-bold">Tecnologia Segura & Auditada</span>
            <span>·</span>
            <span>Gateway de Pagamentos Integrado</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
