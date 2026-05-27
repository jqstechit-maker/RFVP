import React, { useState, useEffect } from 'react';
import { Rifa, Pagamento, Cliente, LogSistema, PlataformaConfig } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp, Users, Ticket, Award,
  Plus, Edit, Trash2, CheckCircle, HelpCircle,
  FileSpreadsheet, ShieldCheck, ShieldAlert, Key, Clipboard, Trash, AlertTriangle, Settings, RefreshCw, FileText, Upload
} from 'lucide-react';

interface AdminAreaProps {
  rifas: Rifa[];
  pagamentos: Pagamento[];
  clientes: Cliente[];
  logs: LogSistema[];
  config: PlataformaConfig;
  onUpdateConfig: (config: PlataformaConfig) => void;
  onAddRifa: (rifa: Rifa) => void;
  onUpdateRifa: (rifa: Rifa) => void;
  onDeleteRifa: (id: string) => void;
  onAddLog: (mensagem: string, tipo: 'sucesso' | 'info' | 'erro' | 'alerta') => void;
  onUpdatePagamentoStatus: (txid: string, status: 'pago' | 'conflito' | 'reembolsado') => void;
  onClearTransactions: () => void;
  onAddCliente: (cliente: Cliente) => void;
  onAddPagamento: (pagamento: Pagamento) => void;
}

export default function AdminArea({
  rifas,
  pagamentos,
  clientes,
  logs,
  config,
  onUpdateConfig,
  onAddRifa,
  onUpdateRifa,
  onDeleteRifa,
  onAddLog,
  onUpdatePagamentoStatus,
  onClearTransactions,
  onAddCliente,
  onAddPagamento
}: AdminAreaProps) {
  const [adminTab, setAdminTab] = useState<'dashboard' | 'rifas' | 'numeros' | 'pagamentos' | 'clientes' | 'sorteio' | 'relatorios' | 'configuracoes' | 'logs'>('dashboard');

  // Filtros de pagamentos
  const [paymentFilter, setPaymentFilter] = useState<'todos' | 'pago' | 'pendente' | 'conflito'>('todos');

  // Gestão de Números individual
  const [numRifaId, setNumRifaId] = useState<string>('');
  const [searchCotaNum, setSearchCotaNum] = useState<string>('');

  // Formulário de Configurações Administrativas
  const [settingsForm, setSettingsForm] = useState<PlataformaConfig>({ ...config });

  // Sincronizar quando as configurações externas atualizarem
  useEffect(() => {
    setSettingsForm({ ...config });
  }, [config]);

  // State para Criar Rifa
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRifa, setNewRifa] = useState({
    titulo: '',
    descricao: '',
    valorPorNumero: 2.0,
    dataSorteio: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    imagemUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop',
    imagens: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621768216002-5ac171876725?w=800&auto=format&fit=crop'
    ] as string[],
    status: 'ativa' as 'ativa' | 'inativa'
  });

  const [uploadingIndex, setUploadingIndex] = useState<{ type: 'new' | 'edit'; index: number } | null>(null);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'new' | 'edit', index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex({ type, index });
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/upload.php', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        onAddLog(`Upload realizado com sucesso: ${data.url}`, 'sucesso');
        if (type === 'new') {
          const newImgs = [...(newRifa.imagens || [])];
          newImgs[index] = data.url;
          if (index === 0) {
            setNewRifa({ ...newRifa, imagemUrl: data.url, imagens: newImgs });
          } else {
            setNewRifa({ ...newRifa, imagens: newImgs });
          }
        } else if (editingRifa) {
          const newImgs = [...(editingRifa.imagens || [])];
          newImgs[index] = data.url;
          if (index === 0) {
            setEditingRifa({ ...editingRifa, imagemUrl: data.url, imagens: newImgs });
          } else {
            setEditingRifa({ ...editingRifa, imagens: newImgs });
          }
        }
      } else {
        alert(data.error || 'Erro desconhecido ao realizar upload.');
        onAddLog(`Falha no upload de imagem: ${data.error}`, 'erro');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao conectar com o servidor e realizar o upload. Verifique se o PHP está ativo na hospedagem.');
      onAddLog('Falha de conexão ao fazer upload para upload.php', 'erro');
    } finally {
      setUploadingIndex(null);
    }
  };

  // State para Editar Rifa
  const [editingRifa, setEditingRifa] = useState<Rifa | null>(null);

  const handleUpdateRifaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRifa || !editingRifa.titulo || !editingRifa.descricao) {
      alert("Por favor preencha todos os campos obrigatórios");
      return;
    }
    // Garanta que o array de imagens tenha pelo menos o link inicial
    const imgs = [...(editingRifa.imagens || [])];
    if (imgs.length === 0 || imgs[0] !== editingRifa.imagemUrl) {
      imgs[0] = editingRifa.imagemUrl;
    }
    onUpdateRifa({
      ...editingRifa,
      imagens: imgs
    });
    onAddLog(`Rifa "${editingRifa.titulo}" atualizada com sucesso pelo administrador.`, 'sucesso');
    setEditingRifa(null);
  };

  // State para sorteio
  const [sorteioConfig, setSorteioConfig] = useState({
    rifaId: '',
    metodo: 'federal' as 'manual' | 'federal',
    numeroFederal: '',
    numeroManual: ''
  });

  const [sorteioVencedorOutput, setSorteioVencedorOutput] = useState<any | null>(null);

  // login admin simulator
  const [isLogged, setIsLogged] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === 'admin' && loginForm.pass === 'admin123') {
      setIsLogged(true);
      onAddLog('Sessão administrativa iniciada com sucesso via login manual.', 'sucesso');
    } else {
      alert('Usuário ou senha incorretos! (Dica padrão: admin / admin123)');
    }
  };

  // Cálculos de KPIs
  const activeRafflesCount = rifas.filter(r => r.status === 'ativa').length;
  const approvedPaymentsArray = pagamentos.filter(p => p.status === 'pago');
  const grossIncome = approvedPaymentsArray.reduce((acc, current) => acc + current.valor, 0);
  const pendingPaymentsCount = pagamentos.filter(p => p.status === 'pendente').length;
  const conflictPaymentsCount = pagamentos.filter(p => p.status === 'conflito').length;

  // Organizar dados para gráficos de Recharts baseados em vendas efetivas por rifa
  const chartData = rifas.map(r => {
    const totalAprovados = pagamentos.filter(p => p.rifaId === r.id && p.status === 'pago').length;
    return {
      name: r.titulo.split(' ')[0], // Apenas a primeira palavra por espaço
      vendas: totalAprovados,
      faturamento: totalAprovados * r.valorPorNumero
    };
  });

  // Ação Criar Sorteio Rifa
  const handleCreateRifaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rifas.length >= 10) {
      alert("Limite técnico atingido!\nO sistema está configurado para gerenciar no MÁXIMO 10 rifas simultâneas.");
      return;
    }

    if (!newRifa.titulo || !newRifa.descricao) {
      alert("Por favor preencha todos os campos obrigatórios");
      return;
    }

    const rId = String(Date.now());
    onAddRifa({
      id: rId,
      titulo: newRifa.titulo,
      descricao: newRifa.descricao,
      valorPorNumero: parseFloat(String(newRifa.valorPorNumero)),
      dataSorteio: newRifa.dataSorteio,
      quantidadeNumeros: 1000,
      imagemUrl: newRifa.imagemUrl || `https://picsum.photos/seed/${rId}/800/600`,
      imagens: newRifa.imagens,
      status: newRifa.status
    });

    onAddLog(`Nova rifa cadastrada pelo administrador: "${newRifa.titulo}"`, 'sucesso');
    setShowCreateModal(false);
    setNewRifa({
      titulo: '',
      descricao: '',
      valorPorNumero: 2.0,
      dataSorteio: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      imagemUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop',
      imagens: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1621768216002-5ac171876725?w=800&auto=format&fit=crop'
      ] as string[],
      status: 'ativa'
    });
  };

  // Deletar Rifa
  const handleDeleteRifaClick = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja apagar a rifa "${name}"? Esta ação removerá todos os pagamentos vinculados a ela.`)) {
      onDeleteRifa(id);
      onAddLog(`Rifa removida pelo administrador: "${name}"`, 'alerta');
    }
  };

  // Alterar Status Rifa Ativa/Inativa
  const handleToggleRifaStatus = (rifaObj: Rifa) => {
    const nextStatus = rifaObj.status === 'ativa' ? 'inativa' : 'ativa';
    onUpdateRifa({
      ...rifaObj,
      status: nextStatus
    });
    onAddLog(`Status da rifa "${rifaObj.titulo}" modificado para ${nextStatus.toUpperCase()}`, 'info');
  };

  // Forçar Ação manual de aprovação PIX
  const handleManualApprovePayment = (txid: string, number: string, clientName: string) => {
    if (confirm(`Deseja aprovar manualmente o Pix de ${clientName} para o número ${number}?`)) {
      onUpdatePagamentoStatus(txid, 'pago');
      onAddLog(`Aprovação manual efetuada pelo Administrador para o número ${number} (TXID: ${txid})`, 'sucesso');
    }
  };

  // Cancelar faturamento pendente
  const handleCancelPayment = (txid: string, number: string) => {
    if (confirm(`Deseja desativar a pendência do número ${number}?`)) {
      onUpdatePagamentoStatus(txid, 'reembolsado');
      onAddLog(`Reserva de número ${number} (TXID: ${txid}) cancelada pelo Administrador.`, 'info');
    }
  };

  // Executar Calculadora de Sorteio
  const handleExecuteSorteio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sorteioConfig.rifaId) {
      alert("Selecione a rifa para rodar o sorteio");
      return;
    }

    const targetRifa = rifas.find(r => r.id === sorteioConfig.rifaId);
    if (!targetRifa) return;

    const pagos = pagamentos.filter(p => p.rifaId === targetRifa.id && p.status === 'pago');
    if (pagos.length === 0) {
      alert("Impossível prosseguir:\nNenhuma cota foi paga nesta rifa até o momento.");
      return;
    }

    let numeroVencedor = '';
    let correspondenteGanhador: any = null;

    if (sorteioConfig.metodo === 'manual') {
      const numInput = String(sorteioConfig.numeroManual).padStart(3, '0');
      // No modo manual, obrigatoriamente deve ser um número já pago
      const findPaid = pagos.find(p => p.numero === numInput);
      if (!findPaid) {
        alert(`O número ${numInput} não foi pago nesta rifa! Por favor digite um número que conste como PAGO.`);
        return;
      }
      numeroVencedor = numInput;
      correspondenteGanhador = findPaid;
    } else {
      // Modo Federal: pega ultimos 3 digitos da extracao federal
      const federalStr = sorteioConfig.numeroFederal.replace(/[^0-9]/g, '');
      if (federalStr.length < 3) {
        alert("Digite um número com pelo menos 3 dígitos da Loteria Federal.");
        return;
      }
      const sorteadoDezena = federalStr.slice(-3); // Ultimos 3 numeros
      const numGols = parseInt(sorteadoDezena);

      // Algoritmo Fallback: Se não comprado, busca subsequente maior em ordem crescente
      // 042 -> 043 -> 044...999 -> 000 -> 001
      const ticketMap = new Map();
      pagos.forEach(p => ticketMap.set(p.numero, p));

      for (let i = 0; i < 1000; i++) {
        const buscado = String((numGols + i) % 1000).padStart(3, '0');
        if (ticketMap.has(buscado)) {
          numeroVencedor = buscado;
          correspondenteGanhador = ticketMap.get(buscado);
          break;
        }
      }
    }

    const clInfo = clientes.find(c => c.id === correspondenteGanhador.clienteId);

    // Salvar estado da rifa sorteada
    onUpdateRifa({
      ...targetRifa,
      status: 'sorteada',
      ganhadorNumero: numeroVencedor,
      ganhadorNome: clInfo?.nome || 'Comprador Desconhecido',
      ganhadorTelefone: clInfo?.telefone || '(00) 00000-0000',
      metodoSorteio: sorteioConfig.metodo,
      numeroFederalOriginal: sorteioConfig.metodo === 'federal' ? sorteioConfig.numeroFederal : undefined
    });

    onAddLog(`[SORTEIO EXECUTADO] Rifa "${targetRifa.titulo}" sorteada! Número Vencedor: ${numeroVencedor}. Ganhador: ${clInfo?.nome || 'Comprador'} (Metodo: ${sorteioConfig.metodo.toUpperCase()})`, 'sucesso');
    
    setSorteioVencedorOutput({
      rifa: targetRifa.titulo,
      numero: numeroVencedor,
      metodo: sorteioConfig.metodo,
      nome: clInfo?.nome,
      telefone: clInfo?.telefone,
      cpf: clInfo?.cpf
    });

    setSorteioConfig({
      rifaId: '',
      metodo: 'federal',
      numeroFederal: '',
      numeroManual: ''
    });
  };

  // Exportar dados CSV simulado
  const handleExportCSV = (tipo: string) => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    if (tipo === 'pagamentos') {
      csvContent += "ID,Rifa,Cliente,CPF,Dezena,Valor,Status,Data\n";
      pagamentos.forEach(p => {
        const rf = rifas.find(r => r.id === p.rifaId);
        const cl = clientes.find(c => c.id === p.clienteId);
        csvContent += `${p.id},"${rf?.titulo || ''}","${cl?.nome || ''}",${cl?.cpf || ''},${p.numero},${p.valor},${p.status},${p.createdAt}\n`;
      });
    } else {
      csvContent += "ID Rifa,Titulo,Preco Cota,Total Cotas Pagas,Total Faturamento\n";
      rifas.forEach(r => {
        const pagos = pagamentos.filter(p => p.rifaId === r.id && p.status === 'pago').length;
        csvContent += `${r.id},"${r.titulo}",${r.valorPorNumero},${pagos},${pagos * r.valorPorNumero}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_rifas_${tipo}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPagamentos = pagamentos.filter(p => {
    if (paymentFilter === 'todos') return true;
    return p.status === paymentFilter;
  });

  // Renderiza tela de login se desconectado
  if (!isLogged) {
    return (
      <div id="admin_login_container" className="min-h-[500px] flex items-center justify-center p-4">
        <div className="bg-surface-dark border border-border-dim rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
          <Key className="w-10 h-10 text-primary-neon mx-auto mb-4 glow-primary" />
          <h3 className="text-lg font-bold text-white font-display">Login Administrativo</h3>
          <p className="text-text-dim text-xs mt-1 mb-6">Autenticação central do servidor de rifas</p>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Usuário</label>
              <input
                type="text"
                required
                value={loginForm.user}
                placeholder=""
                onChange={(e) => setLoginForm({ ...loginForm, user: e.target.value })}
                className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Senha de Acesso</label>
              <input
                type="password"
                required
                value={loginForm.pass}
                placeholder=""
                onChange={(e) => setLoginForm({ ...loginForm, pass: e.target.value })}
                className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary-neon hover:opacity-90 text-bg-dark font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all glow-btn-primary cursor-pointer mt-1"
            >
              Acessar Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="admin_workspace" className="max-w-7xl mx-auto px-4 py-4">
      {/* Admin Top Menu Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-border-dim">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
            <ShieldCheck className="w-5 h-5 text-primary-neon font-bold" />
            Painel Central {config.nomePlataforma}
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Gestão de Campanhas, Faturamento, Parâmetros e Banco de Dados</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1.5 scrollbar-thin">
          <button
            onClick={() => setAdminTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex-shrink-0 cursor-pointer ${
              adminTab === 'dashboard' 
                ? 'bg-primary-neon text-bg-dark font-bold hover:opacity-95' 
                : 'bg-bg-dark text-text-dim hover:text-white border border-border-dim'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setAdminTab('rifas')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex-shrink-0 cursor-pointer ${
              adminTab === 'rifas' 
                ? 'bg-primary-neon text-bg-dark font-bold hover:opacity-95' 
                : 'bg-bg-dark text-text-dim hover:text-white border border-border-dim'
            }`}
          >
            Rifas
          </button>
          <button
            onClick={() => {
              setAdminTab('numeros');
              if (rifas.length > 0 && !numRifaId) {
                setNumRifaId(rifas[0].id);
              }
            }}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex-shrink-0 cursor-pointer ${
              adminTab === 'numeros' 
                ? 'bg-primary-neon text-bg-dark font-bold hover:opacity-95' 
                : 'bg-bg-dark text-text-dim hover:text-white border border-border-dim'
            }`}
          >
            Números
          </button>
          <button
            onClick={() => setAdminTab('pagamentos')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex-shrink-0 cursor-pointer ${
              adminTab === 'pagamentos' 
                ? 'bg-primary-neon text-bg-dark font-bold hover:opacity-95' 
                : 'bg-bg-dark text-text-dim hover:text-white border border-border-dim'
            }`}
          >
            Pagamentos
          </button>
          <button
            onClick={() => setAdminTab('clientes')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex-shrink-0 cursor-pointer ${
              adminTab === 'clientes' 
                ? 'bg-primary-neon text-bg-dark font-bold hover:opacity-95' 
                : 'bg-bg-dark text-text-dim hover:text-white border border-border-dim'
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => setAdminTab('sorteio')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex-shrink-0 cursor-pointer ${
              adminTab === 'sorteio' 
                ? 'bg-primary-neon text-bg-dark font-bold hover:opacity-95' 
                : 'bg-bg-dark text-text-dim hover:text-white border border-border-dim'
            }`}
          >
            Sorteios
          </button>
          <button
            onClick={() => setAdminTab('relatorios')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex-shrink-0 cursor-pointer ${
              adminTab === 'relatorios' 
                ? 'bg-primary-neon text-bg-dark font-bold hover:opacity-95' 
                : 'bg-bg-dark text-text-dim hover:text-white border border-border-dim'
            }`}
          >
            Relatórios & SQL
          </button>
          <button
            onClick={() => setAdminTab('configuracoes')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex-shrink-0 cursor-pointer ${
              adminTab === 'configuracoes' 
                ? 'bg-primary-neon text-bg-dark font-bold hover:opacity-95' 
                : 'bg-bg-dark text-text-dim hover:text-white border border-border-dim'
            }`}
          >
            Configurações
          </button>
          <button
            onClick={() => setAdminTab('logs')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex-shrink-0 cursor-pointer ${
              adminTab === 'logs' 
                ? 'bg-primary-neon text-bg-dark font-bold hover:opacity-95' 
                : 'bg-bg-dark text-text-dim hover:text-white border border-border-dim'
            }`}
          >
            Console Logs
          </button>
          
          <button
            onClick={() => {
              setIsLogged(false);
              onAddLog('Sessão administrativa encerrada pelo usuário.', 'info');
            }}
            className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/20 transition-all flex-shrink-0 cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>

      {/* ADMIN TAB: DASHBOARD */}
      {adminTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Bento Grid KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-dark border border-border-dim p-4 rounded-2xl relative overflow-hidden">
              <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold font-mono">Rifas Simultâneas</span>
              <div className="h3 font-bold text-white flex items-center gap-2 mt-1.5 font-display text-xl">
                <Ticket className="w-5 h-5 text-primary-neon glow-primary" />
                {activeRafflesCount} <span className="text-text-dim font-mono text-sm">/ 10</span>
              </div>
            </div>

            <div className="bg-surface-dark border border-border-dim p-4 rounded-2xl relative overflow-hidden">
              <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold font-mono">Arrecadação Bruta</span>
              <div className="h3 font-bold text-primary-neon flex items-center gap-2 mt-1.5 font-display text-xl">
                <TrendingUp className="w-5 h-5" />
                R$ {grossIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-surface-dark border border-border-dim p-4 rounded-2xl relative overflow-hidden">
              <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold font-mono">Pendências Pix</span>
              <div className="h3 font-bold text-secondary-gold flex items-center gap-2 mt-1.5 font-display text-xl">
                <Users className="w-5 h-5 glow-secondary" />
                {pendingPaymentsCount} <span className="text-text-dim font-mono text-xs">ativos</span>
              </div>
            </div>

            <div className="bg-surface-dark border border-border-dim p-4 rounded-2xl relative overflow-hidden">
              <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold font-mono">Estornos Pendentes</span>
              <div className="h3 font-bold text-rose-400 flex items-center gap-2 mt-1.5 font-display text-xl">
                <ShieldAlert className="w-5 h-5 text-rose-450" />
                {conflictPaymentsCount} <span className="text-text-dim font-mono text-xs">conflitos</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Recharts Bar Map */}
            <div className="lg:col-span-2 bg-surface-dark border border-border-dim rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 font-display">Consolidação de Arrecadações por Bilhetes Ativos</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d2026" />
                    <XAxis dataKey="name" stroke="#888ea0" fontSize={10} />
                    <YAxis stroke="#888ea0" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121418', border: '1px solid rgba(255,255,255,0.1)' }}
                      labelStyle={{ color: '#fff', fontSize: '11px' }}
                      itemStyle={{ color: '#2563eb', fontSize: '11px' }}
                    />
                    <Bar dataKey="faturamento" name="Faturamento (R$)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Configuração de Banco e Testes Rápidos */}
            <div className="bg-surface-dark border border-border-dim rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-2 font-display">
                  <ShieldCheck className="w-4 h-4 text-primary-neon glow-primary" />
                  Estado da Infraestrutura
                </h4>
                <p className="text-[11px] text-text-dim leading-relaxed mb-4">
                  O banco de dados centralizado está operando em memória local síncrona no navegador. Você pode selecionar dezenas livres na aba de sorteios ativos para testar o faturamento e os gráficos de arrecadação em tempo real!
                </p>

                <div className="space-y-2">
                  <div className="flex gap-2 text-xs">
                    <span className="font-semibold text-text-dim w-24">Banco de Dados:</span>
                    <span className="text-primary-neon font-mono font-medium">Ativo (Segurança Local)</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="font-semibold text-text-dim w-24">Certificado SSL:</span>
                    <span className="text-primary-neon font-mono font-medium">TLS v1.3 Ativado</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="font-semibold text-text-dim w-24">Motor Sorteador:</span>
                    <span className="text-primary-neon font-mono font-medium">Loteria Federal Ativa</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border-dim mt-4">
                <button
                  onClick={() => {
                    onClearTransactions();
                    onAddLog("O administrador resetou todas as transações acumuladas para limpeza na semente inicial.", "alerta");
                    alert("Todas as simulações e transações foram limpas!");
                  }}
                  className="w-full py-2 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash className="w-3.5 h-3.5" /> Limpar Dados de Vendas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN TAB: GESTÃO DE RIFAS */}
      {adminTab === 'rifas' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white font-display">Listagem de Prêmios (Máximo 4 ativos)</h3>
            <button
              onClick={() => {
                if (rifas.length >= 4) {
                  alert("Impossível prosseguir:\nHaveria sobrecarga de dezenas adicionais. Limite máximo configurado de 4 rifas simultâneas.");
                  return;
                }
                setShowCreateModal(true);
              }}
              className="px-3 py-1.5 bg-primary-neon hover:opacity-90 text-bg-dark font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all glow-btn-primary cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3px]" /> Nova Rifa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rifas.map(r => (
              <div key={r.id} className="bg-surface-dark border border-border-dim rounded-2xl overflow-hidden p-4 flex gap-4 shadow-lg">
                <img src={r.imagemUrl} alt="image" className="w-24 h-24 rounded-lg object-cover bg-bg-dark border border-border-dim" referrerPolicy="no-referrer" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight font-display">{r.titulo}</h4>
                    <span className="text-[11px] font-mono text-primary-neon mt-1 block">R$ {r.valorPorNumero.toFixed(2)} por bilhete</span>
                    <span className={`text-[10px] inline-block font-mono tracking-wider font-extrabold px-2 py-0.5 rounded mt-2 uppercase ${
                      r.status === 'ativa'
                        ? 'bg-primary-neon/10 text-primary-neon border border-primary-neon/20'
                        : r.status === 'sorteada'
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20'
                        : 'bg-bg-dark text-text-dim border border-border-dim'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border-dim mt-2">
                    <button
                      onClick={() => handleToggleRifaStatus(r)}
                      className="px-2 py-1 text-[10px] font-bold bg-bg-dark hover:text-white text-text-dim border border-border-dim rounded transition-all cursor-pointer"
                    >
                      {r.status === 'ativa' ? 'Pausar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => setEditingRifa(r)}
                      className="px-2 py-1 text-[10px] font-bold bg-primary-neon/10 hover:bg-primary-neon/25 text-primary-neon border border-primary-neon/20 rounded transition-all cursor-pointer"
                    >
                      Editar Fotos
                    </button>
                    <button
                      onClick={() => handleDeleteRifaClick(r.id, r.titulo)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-505/10 rounded-md transition-all ms-auto cursor-pointer"
                      title="Deletar Rifa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showCreateModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-surface-dark border border-border-dim rounded-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 shadow-2xl relative">
                <h3 className="text-base font-bold text-white mb-4 font-display">Adicionar Nova Rifa</h3>
                <form onSubmit={handleCreateRifaSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Título do Prêmio Principal</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: PlayStation 5 Slim 1TB + Jogo"
                      value={newRifa.titulo}
                      onChange={(e) => setNewRifa({ ...newRifa, titulo: e.target.value })}
                      className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Regulamento / Descrição Detalhada</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Insira detalhes adicionais do prêmio, frete e loteria aqui."
                      value={newRifa.descricao}
                      onChange={(e) => setNewRifa({ ...newRifa, descricao: e.target.value })}
                      className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Preço do Bilhete (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newRifa.valorPorNumero}
                        onChange={(e) => setNewRifa({ ...newRifa, valorPorNumero: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Cotas Registradas</label>
                      <input
                        type="text"
                        disabled
                        value="1000 (000-999)"
                        className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-text-dim focus:outline-none cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Data / Hora Limite</label>
                    <input
                      type="datetime-local"
                      required
                      value={newRifa.dataSorteio}
                      onChange={(e) => setNewRifa({ ...newRifa, dataSorteio: e.target.value })}
                      className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-3 p-4 bg-bg-dark/40 border border-border-dim rounded-2xl">
                    <span className="text-[10px] text-primary-neon uppercase tracking-wider font-extrabold font-mono block">Galeria Premium do Produto (Até 5 Fotos)</span>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] text-text-dim uppercase font-mono">1. Foto de Destaque (Principal) *</label>
                        <span className="text-[9px] text-text-dim lowercase">ou cole uma URL de imagem externa</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="URL da Imagem de Destaque"
                          required
                          value={newRifa.imagemUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newImgs = [...(newRifa.imagens || [])];
                            newImgs[0] = val;
                            setNewRifa({ ...newRifa, imagemUrl: val, imagens: newImgs });
                          }}
                          className="flex-1 px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/55 transition-all font-sans"
                        />
                        <label className={`px-3 py-2 border border-border-dim bg-surface-dark hover:border-primary-neon/40 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${uploadingIndex?.type === 'new' && uploadingIndex?.index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingIndex?.type === 'new' && uploadingIndex?.index === 0 ? 'Enviando...' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingIndex !== null}
                            onChange={(e) => handleUploadFile(e, 'new', 0)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-1.5">
                        <label className="block text-[10px] text-text-dim uppercase font-mono">{i + 1}. Foto Adicional {i}</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`URL da Imagem Adicional ${i}`}
                            value={newRifa.imagens?.[i] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newImgs = [...(newRifa.imagens || [])];
                              newImgs[i] = val;
                              setNewRifa({ ...newRifa, imagens: newImgs });
                            }}
                            className="flex-1 px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/55 transition-all font-sans"
                          />
                          <label className={`px-3 py-2 border border-border-dim bg-surface-dark hover:border-primary-neon/40 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${uploadingIndex?.type === 'new' && uploadingIndex?.index === i ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload className="w-3.5 h-3.5" />
                            {uploadingIndex?.type === 'new' && uploadingIndex?.index === i ? 'Enviando...' : 'Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingIndex !== null}
                              onChange={(e) => handleUploadFile(e, 'new', i)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border-dim flex justify-end gap-3 font-mono">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-bg-dark hover:text-white border border-border-dim text-text-dim text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-neon hover:opacity-90 text-bg-dark text-xs font-extrabold rounded-xl transition-all glow-btn-primary cursor-pointer"
                    >
                      Cadastrar Sorteio
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {editingRifa && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-surface-dark border border-border-dim rounded-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                <h3 className="text-base font-bold text-white mb-4 font-display gap-1.5 flex items-center">
                  <span>Editar Rifa & Galeria de Fotos</span>
                </h3>
                
                <form onSubmit={handleUpdateRifaSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Título do Prêmio Principal</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: PlayStation 5 Slim 1TB + Jogo"
                      value={editingRifa.titulo}
                      onChange={(e) => setEditingRifa({ ...editingRifa, titulo: e.target.value })}
                      className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Regulamento / Descrição Detalhada</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Insira detalhes adicionais do prêmio, frete e loteria aqui."
                      value={editingRifa.descricao}
                      onChange={(e) => setEditingRifa({ ...editingRifa, descricao: e.target.value })}
                      className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Preço do Bilhete (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingRifa.valorPorNumero}
                        onChange={(e) => setEditingRifa({ ...editingRifa, valorPorNumero: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Data / Hora Limite</label>
                      <input
                        type="datetime-local"
                        required
                        value={editingRifa.dataSorteio}
                        onChange={(e) => setEditingRifa({ ...editingRifa, dataSorteio: e.target.value })}
                        className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-bg-dark/40 border border-border-dim rounded-2xl">
                    <span className="text-[10px] text-primary-neon uppercase tracking-wider font-extrabold font-mono block">Galeria Premium do Produto (Até 5 Fotos)</span>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] text-text-dim uppercase font-mono">1. Foto de Destaque (Principal) *</label>
                        <span className="text-[9px] text-text-dim lowercase">ou cole uma URL de imagem externa</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="URL da Imagem de Destaque"
                          required
                          value={editingRifa.imagemUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newImgs = [...(editingRifa.imagens || [])];
                            newImgs[0] = val;
                            setEditingRifa({ ...editingRifa, imagemUrl: val, imagens: newImgs });
                          }}
                          className="flex-1 px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/55 transition-all font-sans"
                        />
                        <label className={`px-3 py-2 border border-border-dim bg-surface-dark hover:border-primary-neon/40 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${uploadingIndex?.type === 'edit' && uploadingIndex?.index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingIndex?.type === 'edit' && uploadingIndex?.index === 0 ? 'Enviando...' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingIndex !== null}
                            onChange={(e) => handleUploadFile(e, 'edit', 0)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-1.5">
                        <label className="block text-[10px] text-text-dim uppercase font-mono">{i + 1}. Foto Adicional {i}</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`URL da Imagem Adicional ${i}`}
                            value={editingRifa.imagens?.[i] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newImgs = [...(editingRifa.imagens || [])];
                              newImgs[i] = val;
                              setEditingRifa({ ...editingRifa, imagens: newImgs });
                            }}
                            className="flex-1 px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/55 transition-all font-sans"
                          />
                          <label className={`px-3 py-2 border border-border-dim bg-surface-dark hover:border-primary-neon/40 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${uploadingIndex?.type === 'edit' && uploadingIndex?.index === i ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload className="w-3.5 h-3.5" />
                            {uploadingIndex?.type === 'edit' && uploadingIndex?.index === i ? 'Enviando...' : 'Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingIndex !== null}
                              onChange={(e) => handleUploadFile(e, 'edit', i)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border-dim flex justify-end gap-3 font-mono">
                    <button
                      type="button"
                      onClick={() => setEditingRifa(null)}
                      className="px-4 py-2 bg-bg-dark hover:text-white border border-border-dim text-text-dim text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-neon hover:opacity-90 text-bg-dark text-xs font-extrabold rounded-xl transition-all glow-btn-primary cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN TAB: CAPITAL / FATURAMENTO */}
      {adminTab === 'pagamentos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setPaymentFilter('todos')}
                className={`px-3 py-1 bg-bg-dark border border-border-dim text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  paymentFilter === 'todos' ? 'text-primary-neon bg-primary-neon/10 border-primary-neon/20 font-bold' : 'text-text-dim hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setPaymentFilter('pago')}
                className={`px-3 py-1 bg-bg-dark border border-border-dim text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  paymentFilter === 'pago' ? 'text-primary-neon bg-primary-neon/10 border-primary-neon/20 font-bold' : 'text-text-dim hover:text-white'
                }`}
              >
                Pagos (Baixados)
              </button>
              <button
                onClick={() => setPaymentFilter('pendente')}
                className={`px-3 py-1 bg-bg-dark border border-border-dim text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  paymentFilter === 'pendente' ? 'text-primary-neon bg-primary-neon/10 border-primary-neon/20 font-bold' : 'text-text-dim hover:text-white'
                }`}
              >
                Pendentes (Gerados)
              </button>
              <button
                onClick={() => setPaymentFilter('conflito')}
                className={`px-3 py-1 bg-bg-dark border border-border-dim text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  paymentFilter === 'conflito' ? 'text-primary-neon bg-primary-neon/10 border-primary-neon/20 font-bold' : 'text-text-dim hover:text-white'
                }`}
              >
                Conflitos Duplicados
              </button>
            </div>

            <button
              onClick={() => handleExportCSV('pagamentos')}
              className="px-3.5 py-1.5 bg-bg-dark hover:text-white border border-border-dim text-text-dim text-xs rounded-lg inline-flex items-center gap-1.5 self-start sm:self-center font-bold font-mono transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary-neon glow-primary" /> Exportar CSV
            </button>
          </div>

          <div className="bg-surface-dark border border-border-dim rounded-2xl overflow-hidden shadow-lg">
            <div className="table-responsive">
              <table className="w-full text-left align-middle border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-bg-dark border-b border-border-dim text-text-dim uppercase tracking-wider text-[10px] font-bold font-mono">
                    <th className="p-4">Rifa</th>
                    <th className="p-4">Cliente / Contato</th>
                    <th className="p-4 font-mono">Cota</th>
                    <th className="p-4">Gateway TXID</th>
                    <th className="p-4">Preço</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {filteredPagamentos.map(p => {
                    const rf = rifas.find(r => r.id === p.rifaId);
                    const cl = clientes.find(c => c.id === p.clienteId);

                    return (
                      <tr key={p.id} className="hover:bg-bg-dark/40 transition-colors">
                        <td className="p-4 font-semibold text-white truncate max-w-[120px]">
                          {rf?.titulo || 'Rifa Excluída'}
                        </td>
                        <td className="p-4 text-xs font-medium">
                          <strong>{cl?.nome || 'Comprador Desconhecido'}</strong>
                          <div className="text-[10px] text-text-dim font-mono mt-0.5">{cl?.telefone} · {cl?.cpf}</div>
                        </td>
                        <td className="p-4 font-mono font-bold text-center">
                          <span className="bg-bg-dark px-2 py-0.5 rounded border border-border-dim text-primary-neon">{p.numero}</span>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-text-dim break-all truncate max-w-[150px]">
                          {p.txid}
                        </td>
                        <td className="p-4 font-sans font-semibold text-white">
                          R$ {p.valor.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                            p.status === 'pago'
                              ? 'bg-primary-neon/15 text-primary-neon border border-primary-neon/20'
                              : p.status === 'pendente'
                              ? 'bg-secondary-gold/15 text-secondary-gold border border-secondary-gold/20'
                              : p.status === 'conflito'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                              : 'bg-bg-dark text-text-dim border border-border-dim'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1 font-mono">
                          {p.status === 'pendente' && (
                            <>
                              <button
                                onClick={() => handleManualApprovePayment(p.txid, p.numero, cl?.nome || '')}
                                className="px-2 py-1 bg-primary-neon hover:opacity-90 text-bg-dark font-extrabold text-[10px] rounded transition-all cursor-pointer uppercase"
                              >
                                Baixa
                              </button>
                              <button
                                onClick={() => handleCancelPayment(p.txid, p.numero)}
                                className="px-2 py-1 bg-bg-dark hover:text-white border border-border-dim text-text-dim text-[10px] rounded transition-all cursor-pointer uppercase"
                              >
                                Desistir
                              </button>
                            </>
                          )}
                          {p.status === 'conflito' && (
                            <button
                              onClick={() => {
                                alert(`A dezena ${p.numero} já possui um legítimo comprador de prioridade aprovado.\nFavor providenciar a devolução de R$ ${p.valor.toFixed(2)} ao CPF ${cl?.cpf || ''} e marcar o status como Reembolsado manualmente.`);
                              }}
                              className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px] rounded hover:bg-rose-500/20 transition-all cursor-pointer"
                            >
                              Estornar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPagamentos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-text-dim text-xs font-mono">
                        Nenhum registro de faturamento localizado nos parâmetros de filtragem ativos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN TAB: CENTRAL DE SORTEIOS */}
      {adminTab === 'sorteio' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4 font-display">
                <Award className="w-5 h-5 text-primary-neon glow-primary" />
                Extrair Dezena Vencedora
              </h3>

              <form onSubmit={handleExecuteSorteio} className="space-y-4 font-mono">
                <div>
                  <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Selecione Rifa Ativa para Sorteio</label>
                  <select
                    required
                    value={sorteioConfig.rifaId}
                    onChange={(e) => setSorteioConfig({ ...sorteioConfig, rifaId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none focus:border-primary-neon/50 transition-all font-sans cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    {rifas.filter(r => r.status === 'ativa').map(r => (
                      <option key={r.id} value={r.id}>
                        {r.titulo} (R$ {r.valorPorNumero.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Método de Sorteio</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`block p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      sorteioConfig.metodo === 'federal'
                        ? 'bg-primary-neon/5 border-primary-neon text-primary-neon font-bold'
                        : 'bg-bg-dark border border-border-dim text-text-dim'
                    }`}>
                      <input
                        type="radio"
                        name="metodo"
                        value="federal"
                        checked={sorteioConfig.metodo === 'federal'}
                        onChange={() => setSorteioConfig({ ...sorteioConfig, metodo: 'federal' })}
                        className="sr-only"
                      />
                      <span className="text-xs">Loteria Federal</span>
                    </label>

                    <label className={`block p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      sorteioConfig.metodo === 'manual'
                        ? 'bg-primary-neon/5 border-primary-neon text-primary-neon font-bold'
                        : 'bg-bg-dark border-border-dim text-text-dim'
                    }`}>
                      <input
                        type="radio"
                        name="metodo"
                        value="manual"
                        checked={sorteioConfig.metodo === 'manual'}
                        onChange={() => setSorteioConfig({ ...sorteioConfig, metodo: 'manual' })}
                        className="sr-only"
                      />
                      <span className="text-xs font-mono">Forçar Manual</span>
                    </label>
                  </div>
                </div>

                {sorteioConfig.metodo === 'federal' ? (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Número Extraído da Loteria Federal (1° Prêmio)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 84210"
                      maxLength={6}
                      value={sorteioConfig.numeroFederal}
                      onChange={(e) => setSorteioConfig({ ...sorteioConfig, numeroFederal: e.target.value })}
                      className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary-neon/50 transition-all font-sans"
                    />
                    <p className="text-[10px] text-text-dim mt-2 leading-relaxed font-mono">
                      Algoritmo Fallback de Produção: o motor extrairá os 3 últimos dígitos ("210"). Se a cota correspondente não estiver paga, ele buscará o próximo maior número que conste como PAGO (ex: 211, 212... dar a volta) em conformidade técnica.
                    </p>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="block text-xs font-semibold text-text-dim mb-1 font-mono">Dezena Conquistada (000-999)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 312"
                      maxLength={3}
                      value={sorteioConfig.numeroManual}
                      onChange={(e) => setSorteioConfig({ ...sorteioConfig, numeroManual: e.target.value.replace(/[^0-9]/g, '') })}
                      className="w-full px-3 py-2.5 bg-bg-dark border border-border-dim rounded-xl text-xs font-mono text-white focus:outline-none focus:border-primary-neon/50 transition-all font-sans"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-secondary-gold hover:opacity-90 font-bold text-bg-dark text-xs rounded-xl transition-all glow-secondary cursor-pointer font-mono uppercase tracking-wider"
                >
                  Computar Sorteio e Divulgar Ganhador
                </button>
              </form>
            </div>

            <div className="flex flex-col gap-6">
              {sorteioVencedorOutput && (
                <div className="bg-surface-dark border border-secondary-gold/50 shadow-xl shadow-secondary-gold/10 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-secondary-gold/20 rounded-bl-full flex items-center justify-center pl-4 pb-4 text-secondary-gold font-mono font-black text-xs">
                    WIN
                  </div>
                  
                  <span className="text-[10px] text-secondary-gold font-bold uppercase tracking-widest font-mono">Resultado Apurado</span>
                  <h3 className="text-base font-bold text-white mt-1 font-display">Ganhador Registrado com Sucesso!</h3>
                  
                  <div className="mt-4 p-4 bg-bg-dark rounded-xl border border-border-dim space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-text-dim">Rifa:</span>
                      <span className="text-white font-sans max-w-[180px] truncate font-semibold">{sorteioVencedorOutput.rifa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Nº Ganhador:</span>
                      <span className="text-primary-neon font-black text-sm">{sorteioVencedorOutput.numero}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Cliente:</span>
                      <span className="text-white text-right">{sorteioVencedorOutput.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">WhatsApp:</span>
                      <span className="text-white">{sorteioVencedorOutput.telefone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Identificação (CPF):</span>
                      <span className="text-white">{sorteioVencedorOutput.cpf}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-text-dim mt-4 leading-relaxed font-mono text-center">
                    Ganhador divulgado automaticamente na página inicial do site público!
                  </p>
                </div>
              )}

              <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-lg">
                <h4 className="text-xs font-bold text-white mb-3 font-display">Histórico de Premiações</h4>
                <div className="space-y-3">
                  {rifas.filter(r => r.status === 'sorteada').map(rs => (
                    <div key={rs.id} className="p-3 bg-bg-dark rounded-xl border border-border-dim flex items-center justify-between text-xs font-mono">
                      <div>
                        <strong className="text-white font-sans">{rs.titulo}</strong>
                        <div className="text-[10px] text-text-dim mt-0.5">Vencedor: {rs.ganhadorNome} · {rs.ganhadorTelefone}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-primary-neon font-black font-mono text-sm block">Cota {rs.ganhadorNumero}</span>
                        <span className="text-[9px] bg-bg-dark border border-border-dim text-text-dim px-1.5 py-0.5 rounded font-mono uppercase mt-1 inline-block">{rs.metodoSorteio}</span>
                      </div>
                    </div>
                  ))}
                  {rifas.filter(r => r.status === 'sorteada').length === 0 && (
                    <p className="text-xs text-text-dim font-mono text-center py-6">Nenhum sorteio catalogado.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN TAB: SYSTEM LOGS & WEBHOCKS */}
      {adminTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white font-display">Eventos Técnicos & Atividade do Servidor MySQL</h3>
            <button
              onClick={() => {
                onClearTransactions();
                onAddLog("Console limpo pelo administrador.", "info");
              }}
              className="px-2.5 py-1 text-[11px] font-bold bg-bg-dark text-text-dim hover:text-white border border-border-dim rounded cursor-pointer font-mono"
            >
              Resetar Console
            </button>
          </div>

          <div className="bg-bg-dark rounded-xl border border-border-dim p-4 font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto space-y-2 select-text shadow-inner">
            {logs.map(log => (
              <div key={log.id} className="pb-2 border-b border-border-dim/25 flex items-start gap-2">
                <span className="text-text-dim flex-shrink-0 font-bold">[{log.dataHora.slice(11, 19)}]</span>
                {log.tipo === 'sucesso' && <span className="text-primary-neon flex-shrink-0 glow-primary">[SUCESSO]</span>}
                {log.tipo === 'info' && <span className="text-cyan-400 flex-shrink-0">[INFO]</span>}
                {log.tipo === 'alerta' && <span className="text-secondary-gold flex-shrink-0 glow-secondary">[MERCADO_PAGO]</span>}
                {log.tipo === 'erro' && <span className="text-rose-400 flex-shrink-0">[EXCECAO_PHP]</span>}
                <span className="text-slate-300 break-words">{log.mensagem}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN TAB: MANAGEMENT OF COTAS / GERENCIAMENTO DE NÚMEROS */}
      {adminTab === 'numeros' && (
        <div className="space-y-6">
          <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary-neon font-bold" />
              Gestão Individual de Cotas e Reserva Manual
            </h3>
            <p className="text-xs text-text-dim leading-relaxed">
              Consulte faturas de dezenas específicas do sorteio selecionado. Como administrador premium, você pode forçar pagamentos, fazer reservas nominais ou liberar números instantaneamente cancelando transações anteriores.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3">
                <label className="text-[10px] text-text-dim uppercase font-black font-mono block">1. Campanhas Simultâneas</label>
                <select
                  value={numRifaId}
                  onChange={(e) => {
                    setNumRifaId(e.target.value);
                    setSearchCotaNum('');
                  }}
                  className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">Selecione uma campanha ativa...</option>
                  {rifas.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.titulo} ({1000 - pagamentos.filter(p => p.rifaId === r.id && (p.status === 'pago' || p.status === 'pendente')).length} livres / cota R$ {r.valorPorNumero.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-text-dim uppercase font-black font-mono block">2. Cota Digital (Dígito 000-999)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="Ex: 052"
                    value={searchCotaNum}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setSearchCotaNum(v);
                    }}
                    className="flex-1 px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {numRifaId && searchCotaNum.length === 3 && (() => {
            const currentRifaSelected = rifas.find(r => r.id === numRifaId);
            const activePayment = pagamentos.find(p => p.rifaId === numRifaId && p.numero === searchCotaNum && p.status !== 'reembolsado');
            const associatedClient = activePayment ? clientes.find(c => c.id === activePayment.clienteId) : null;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {/* Status Indicator Screen */}
                <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-text-dim uppercase font-black font-mono block mb-2">Estado Atual</span>
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-bg-dark border border-border-dim flex items-center justify-center font-mono font-black text-sm text-primary-neon">
                        {searchCotaNum}
                      </span>
                      <div>
                        {!activePayment && <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-slate-500/10 border border-slate-500/20 text-slate-300 rounded uppercase">LIVRE / DISPONÍVEL</span>}
                        {activePayment?.status === 'pendente' && <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-secondary-gold rounded uppercase">RESERVA PENDENTE (AGUARDANDO PIX)</span>}
                        {activePayment?.status === 'pago' && <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-primary-neon rounded uppercase">APROVADA E PAGA</span>}
                        {activePayment?.status === 'conflito' && <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded uppercase">CONFLITO DE COMPRA</span>}
                        <p className="text-[10px] text-text-dim mt-1">Cota {searchCotaNum} na campanha: {currentRifaSelected?.titulo}</p>
                      </div>
                    </div>
                  </div>

                  {activePayment && (
                    <div className="pt-6 border-t border-border-dim/50 mt-6 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-text-dim uppercase font-black font-mono block">Dados de Transação</span>
                        <p className="text-xs text-slate-300 font-mono">TXID: {activePayment.txid}</p>
                        <p className="text-xs text-slate-300 font-mono">Processamento: {new Date(activePayment.createdAt).toLocaleString('pt-BR')}</p>
                      </div>

                      <button
                        onClick={() => {
                          onUpdatePagamentoStatus(activePayment.txid, 'reembolsado');
                          onAddLog(`Cota ${searchCotaNum} foi redefinida. Transação ${activePayment.txid} cancelada.`, 'info');
                          setSearchCotaNum('');
                          alert(`Sucesso! A cota ${searchCotaNum} foi liberada no banco de dados e está disponível para compra.`);
                        }}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Liberar Número (Disponibilizar)
                      </button>
                    </div>
                  )}
                </div>

                {/* Reservation Detail or Creator Block */}
                <div className="lg:col-span-2 bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-lg">
                  {activePayment ? (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase font-display border-b border-border-dim pb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary-neon" />
                        Comprador Associado
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-bg-dark rounded-xl border border-border-dim space-y-1">
                          <span className="text-[9px] text-text-dim font-mono font-black uppercase">Nome Completo</span>
                          <p className="text-xs text-white font-bold">{associatedClient?.nome || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-bg-dark rounded-xl border border-border-dim space-y-1">
                          <span className="text-[9px] text-text-dim font-mono font-black uppercase">WhatsApp</span>
                          <p className="text-xs text-white font-bold">{associatedClient?.telefone || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-bg-dark rounded-xl border border-border-dim space-y-1">
                          <span className="text-[9px] text-text-dim font-mono font-black uppercase">CPF</span>
                          <p className="text-xs text-white font-bold">{associatedClient?.cpf || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-bg-dark rounded-xl border border-border-dim space-y-1">
                          <span className="text-[9px] text-text-dim font-mono font-black uppercase">Identificador ID</span>
                          <p className="text-xs text-white font-mono font-bold">CLI-{associatedClient?.id || 'N/A'}</p>
                        </div>
                      </div>

                      {activePayment.status === 'pendente' && (
                        <div className="pt-2 flex gap-3">
                          <button
                            onClick={() => {
                              onUpdatePagamentoStatus(activePayment.txid, 'pago');
                              onAddLog(`Cota ${searchCotaNum} aprovada manualmente pelo administrador.`, 'sucesso');
                              setSearchCotaNum('');
                              alert('Cota Aprovada com Sucesso!');
                            }}
                            className="bg-emerald-500 text-bg-dark text-xs py-2 px-4 rounded-xl font-bold cursor-pointer hover:opacity-90 transition-all flex-1"
                          >
                            Forçar Confirmação (Baixa Pago)
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const fd = new FormData(form);
                        const nome = String(fd.get('nome') || '');
                        const tel = String(fd.get('telefone') || '');
                        const cpf = String(fd.get('cpf') || '');
                        const t = String(fd.get('tipo') || 'pago');

                        if (!nome || !tel || !cpf) {
                          alert('Por favor, preencha nome, celular e CPF para prosseguir');
                          return;
                        }

                        // Registrar cliente
                        const cId = 'cli_' + Date.now();
                        onAddCliente({
                          id: cId,
                          nome,
                          telefone: tel,
                          cpf,
                          createdAt: new Date().toISOString()
                        });

                        // Registrar pagamento
                        const txid = 'TXADMIN' + Math.random().toString(36).substring(2, 10).toUpperCase();
                        onAddPagamento({
                          id: 'pag_' + Date.now(),
                          clienteId: cId,
                          rifaId: numRifaId,
                          numero: searchCotaNum,
                          valor: currentRifaSelected?.valorPorNumero || 0,
                          txid,
                          status: t as 'pago' | 'pendente',
                          createdAt: new Date().toISOString()
                        });

                        onAddLog(`Cota ${searchCotaNum} foi reservada manualmente pelo admin (${t === 'pago' ? 'Pago' : 'Reservado'}).`, 'sucesso');
                        alert('Número registrado com sucesso!');
                        setSearchCotaNum('');
                      }}
                      className="space-y-4"
                    >
                      <h4 className="text-xs font-bold text-white uppercase font-display border-b border-border-dim pb-2 text-primary-neon">
                        Efetuar Reserva ou Baixa Direta
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-text-dim uppercase font-mono block">Nome Comprador</label>
                          <input
                            required
                            name="nome"
                            type="text"
                            placeholder="Nome Completo"
                            className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-text-dim uppercase font-mono block">Celular / WhatsApp</label>
                          <input
                            required
                            name="telefone"
                            type="text"
                            placeholder="WhatsApp"
                            className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-text-dim uppercase font-mono block">CPF Comprador</label>
                          <input
                            required
                            name="cpf"
                            type="text"
                            placeholder="CPF"
                            className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2">
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 font-mono cursor-pointer">
                            <input defaultChecked type="radio" value="pago" name="tipo" className="accent-primary-neon" />
                            Preencher Pago (Marcar Pago)
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 font-mono cursor-pointer">
                            <input type="radio" value="pendente" name="tipo" className="accent-primary-neon" />
                            Preencher Reservado (Bloquear Manual)
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 bg-primary-neon text-bg-dark font-mono font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer"
                        >
                          Salvar Registro
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ADMIN TAB: CLIENTES / VISUALIZAR CLIENTES */}
      {adminTab === 'clientes' && (
        <div className="space-y-6">
          <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white font-display mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-neon font-bold" />
              Gestão de Clientes e Dezenas Adquiridas
            </h3>
            <p className="text-xs text-text-dim mb-4">
              Base corporativa de compradores cadastrados na plataforma. Veja o celular, CPF e a listagem total de números ativos de cada cliente.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border-dim">
              <table className="w-full text-left text-xs text-slate-350">
                <thead className="text-[10px] uppercase bg-bg-dark border-b border-border-dim text-text-dim font-mono">
                  <tr>
                    <th className="p-4 font-bold">Identidade ID</th>
                    <th className="p-4 font-bold">Nome</th>
                    <th className="p-4 font-bold">Celular / WhatsApp</th>
                    <th className="p-4 font-bold">CPF</th>
                    <th className="p-4 font-bold">Números Comprados</th>
                    <th className="p-4 font-bold text-right">Cadastrado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim/50 bg-surface-dark/40 font-mono">
                  {clientes.map(c => {
                    // Buscar pagamentos ativos do cliente
                    const activeNumbersList = pagamentos.filter(p => p.clienteId === c.id && (p.status === 'pago' || p.status === 'pendente'));

                    return (
                      <tr key={c.id} className="hover:bg-bg-dark/20">
                        <td className="p-4 font-bold text-primary-neon">CLI-{c.id.substring(4, 9).toUpperCase()}</td>
                        <td className="p-4 font-sans font-bold text-white">{c.nome}</td>
                        <td className="p-4 text-slate-300">{c.telefone}</td>
                        <td className="p-4 text-slate-300">{c.cpf}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {activeNumbersList.map(n => {
                              const r = rifas.find(x => x.id === n.rifaId);
                              return (
                                <span
                                  key={n.id}
                                  title={r?.titulo}
                                  className={`px-1.5 py-0.5 text-[9px] rounded font-mono font-bold capitalize flex items-center gap-0.5 ${
                                    n.status === 'pago' 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}
                                >
                                  {n.numero}
                                </span>
                              );
                            })}
                            {activeNumbersList.length === 0 && (
                              <span className="text-text-dim italic text-[10px]">Sem cotas registradas</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right text-text-dim">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    );
                  })}
                  {clientes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-text-dim font-mono italic">
                        Nenhum pagador ou comprador registrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN TAB: REPORTS & PRODUCTION MySQL SCHEMA */}
      {adminTab === 'relatorios' && (() => {
        const uniqueCompradores = new Set(clientes.map(c => c.id)).size;
        const totalPagamentosConfirmados = pagamentos.filter(p => p.status === 'pago').length;
        const totalPagamentosProcessados = pagamentos.length;
        const conversionRate = totalPagamentosProcessados > 0 
          ? ((totalPagamentosConfirmados / totalPagamentosProcessados) * 100).toFixed(1) 
          : '0.0';

        const mysqlSchema = `
-- =====================================================================
-- SCHEMA DE BANCO DE DADOS RELACIONAL DE RIFAS PREMIUM (COMPATÍVEL CPANEL)
-- TECNOLOGIA: MYSQL 5.7+ / MARIA DB (CONECTIVIDADE PDO PHP 8.2+)
-- INDICES COMPLEMENTARES E CHAVES ESTRANGEIRAS INTACTAS E NORMATIZADAS
-- =====================================================================

CREATE TABLE IF NOT EXISTS \`admins\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`usuario\` VARCHAR(50) NOT NULL UNIQUE,
  \`senha\` VARCHAR(255) NOT NULL, -- ARMAZENAR GERADO VIA BCRYPT hash()
  \`nome\` VARCHAR(100) NOT NULL,
  \`token_sessao\` VARCHAR(100) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`configuracoes\` (
  \`chave\` VARCHAR(50) PRIMARY KEY,
  \`valor\` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`rifas\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`titulo\` VARCHAR(255) NOT NULL,
  \`descricao\` TEXT NOT NULL,
  \`valor_por_numero\` DECIMAL(10, 2) NOT NULL DEFAULT 2.00,
  \`quantidade_numeros\` INT NOT NULL DEFAULT 1000, -- MÁXIMO 1000 NÚMEROS
  \`imagem_url\` VARCHAR(255) DEFAULT NULL,
  \`data_sorteio\` DATETIME NOT NULL,
  \`status\` ENUM('ativa', 'inativa', 'sorteada') NOT NULL DEFAULT 'ativa',
  \`ganhador_nome\` VARCHAR(100) DEFAULT NULL,
  \`ganhador_telefone\` VARCHAR(30) DEFAULT NULL,
  \`ganhador_numero\` VARCHAR(5) DEFAULT NULL,
  \`metodo_sorteio\` VARCHAR(50) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`clientes\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(150) NOT NULL,
  \`telefone\` VARCHAR(30) NOT NULL,
  \`cpf\` VARCHAR(20) NOT NULL UNIQUE,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cliente_cpf (\`cpf\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`pagamentos\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`cliente_id\` INT NOT NULL,
  \`rifa_id\` INT NOT NULL,
  \`numero_cota\` VARCHAR(5) NOT NULL, -- COBIÇA ENTRADAS 000-999
  \`valor\` DECIMAL(10,2) NOT NULL,
  \`txid\` VARCHAR(100) NOT NULL UNIQUE, -- TRANSATION IDENTIFIER PIX/MERCADO PAGO
  \`copia_cola\` TEXT DEFAULT NULL,
  \`status\` ENUM('pendente', 'pago', 'conflito', 'reembolsado') NOT NULL DEFAULT 'pendente',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`cliente_id\`) REFERENCES \`clientes\`(\`id\`) ON DELETE RESTRICT,
  FOREIGN KEY (\`rifa_id\`) REFERENCES \`rifas\`(\`id\`) ON DELETE CASCADE,
  UNIQUE KEY \`uq_rifa_numero\` (\`rifa_id\`, \`numero_cota\`), -- ANTIDUPLICIDADE ABSOLUTA
  INDEX idx_pag_status (\`status\`),
  INDEX idx_pag_txid (\`txid\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `.trim();

        return (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-dark border border-border-dim p-4 rounded-2xl relative">
                <span className="text-[10px] text-text-dim uppercase tracking-widest font-black font-mono">Clientes Únicos</span>
                <div className="h3 font-bold text-white mt-1.5 font-display text-xl">{uniqueCompradores} cadastrados</div>
              </div>
              <div className="bg-surface-dark border border-border-dim p-4 rounded-2xl relative">
                <span className="text-[10px] text-text-dim uppercase tracking-widest font-black font-mono">Eficiência Pix (Taxa)</span>
                <div className="h3 font-bold text-emerald-400 mt-1.5 font-display text-xl">{conversionRate}% sucesso</div>
              </div>
              <div className="bg-surface-dark border border-border-dim p-4 rounded-2xl relative">
                <span className="text-[10px] text-text-dim uppercase tracking-widest font-black font-mono">Total Transações</span>
                <div className="h3 font-bold text-white mt-1.5 font-display text-xl">{totalPagamentosProcessados} faturas</div>
              </div>
              <div className="bg-surface-dark border border-border-dim p-4 rounded-2xl relative">
                <span className="text-[10px] text-text-dim uppercase tracking-widest font-black font-mono">Cotação Média</span>
                <div className="h3 font-bold text-primary-neon mt-1.5 font-display text-xl">
                  R$ {grossIncome.toFixed(2)} total
                </div>
              </div>
            </div>

            {/* CSV Exporter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-xl space-y-3">
                <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Relatório Financeiro de Vendas
                </h4>
                <p className="text-xs text-text-dim">
                  Gere e faça download imediato do arquivo em lote .CSV contendo a listagem minuciosa de faturas Pix processadas pelo gateway, com nome de compradores, contatos e carimbos de data/hora oficiais.
                </p>
                <button
                  onClick={() => {
                    // Executa download real no navegador
                    let csv = "ID_FATURA,CAMPANHA,COTA,VALOR_PAGO,STATUS,CLIENTE,WHATSAPP,CPF,HORARIO\n" + 
                      pagamentos.map(p => {
                        const r = rifas.find(x => x.id === p.rifaId);
                        const c = clientes.find(x => x.id === p.clienteId);
                        return `"${p.id}","${r?.titulo || 'Desconhecida'}",${p.numero},${p.valor},"${p.status}","${c?.nome || 'Admin'}","${c?.telefone || ''}","${c?.cpf || ''}","${p.createdAt}"`;
                      }).join("\n");
                    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", `comprovante_rifas_vendas_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    onAddLog("Exportado financeiro de vendas completo para .CSV.", "sucesso");
                  }}
                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Baixar CSV de Vendas
                </button>
              </div>

              <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-xl space-y-3">
                <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-5 h-5 text-primary-neon" /> Relatório de Mailing Clientes
                </h4>
                <p className="text-xs text-text-dim">
                  Gere e exporte a base total de dados pessoais contidos no banco de dados para marketing, promoções no WhatsApp em massa ou auditorias de CPF.
                </p>
                <button
                  onClick={() => {
                    let csv = "ID,NOME,WHATSAPP,CPF,DATA_CADASTRO\n" + 
                      clientes.map(c => `"${c.id}","${c.nome}","${c.telefone}","${c.cpf}","${c.createdAt}"`).join("\n");
                    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", `comunicacao_clientes_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    onAddLog("Exportado carteira de clientes para .CSV.", "sucesso");
                  }}
                  className="px-4 py-2 bg-primary-neon/10 hover:bg-primary-neon/20 border border-primary-neon/20 text-primary-neon rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Baixar CSV de Clientes
                </button>
              </div>
            </div>

            {/* MySQL Copy block for Production setup */}
            <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-5 h-5 text-primary-neon" /> Scripts de Produção SQL MySQL (cPanel)
                </h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mysqlSchema);
                    alert("Esquema MySQL copiado para a área de transferência!");
                    onAddLog("Esquema SQL copiado para transferência pelo administrador.", 'info');
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold bg-bg-dark border border-border-dim text-white hover:border-primary-neon rounded transition-all cursor-pointer font-mono"
                >
                  Copiar Código SQL
                </button>
              </div>
              <p className="text-xs text-text-dim">
                Esses scripts SQL criam as tabelas normalizadas com suporte a chaves estrangeiras, tratamento rígido antiduplicidade e indexações de alta performance no PHPMyAdmin da Hospedagem Compartilhada.
              </p>
              <pre className="p-4 bg-bg-dark border border-border-dim rounded-xl font-mono text-[10px] text-slate-350 overflow-x-auto max-h-[220px] leading-relaxed select-all">
                {mysqlSchema}
              </pre>
            </div>
          </div>
        );
      })()}

      {/* ADMIN TAB: CONFIGURAÇÕES DIRETAS DA PLATAFORMA */}
      {adminTab === 'configuracoes' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateConfig({ ...settingsForm });
            onAddLog("Definições visuais e institucionais do SaaS salvas com sucesso no banco local.", "sucesso");
            alert("Configurações atualizadas com sucesso!");
          }}
          className="space-y-6 animate-in fade-in duration-200"
        >
          <div className="bg-surface-dark border border-border-dim rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-border-dim pb-4">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-neon" />
                Painel de Parâmetros Visuais & Customização do SaaS
              </h3>
              <p className="text-xs text-text-dim mt-0.5">
                Altere toda a identidade visual, logos, canais de contato, banner promocional e o esquema de cor principal da sua marca sem mexer no código-fonte.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Branding Section */}
              <div className="space-y-4">
                <h4 className="text-[11px] text-primary-neon uppercase tracking-widest font-black font-mono border-b border-border-dim/50 pb-1">1. Identidade de Marca</h4>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-mono font-medium block">Nome da Plataforma</label>
                  <input
                    required
                    type="text"
                    value={settingsForm.nomePlataforma}
                    onChange={(e) => setSettingsForm({ ...settingsForm, nomePlataforma: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-mono font-medium block">Texto Abreviação do Logo</label>
                  <input
                    required
                    type="text"
                    value={settingsForm.logoTexto}
                    onChange={(e) => setSettingsForm({ ...settingsForm, logoTexto: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-mono font-medium block font-mono">Ícone / Emoticon Favicon</label>
                  <input
                    required
                    type="text"
                    value={settingsForm.faviconUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, faviconUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white"
                    placeholder="Ex: 💎 ou url de imagem"
                  />
                </div>
              </div>

              {/* Contacts & Support */}
              <div className="space-y-4">
                <h4 className="text-[11px] text-primary-neon uppercase tracking-widest font-black font-mono border-b border-border-dim/50 pb-1">2. Canais de Comunicação</h4>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-mono font-medium block">Celular Suporte WhatsApp (Apenas Números)</label>
                  <input
                    required
                    type="text"
                    value={settingsForm.whatsappSuporte}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappSuporte: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs font-mono text-white"
                    placeholder="Ex: 5511999999999"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-mono font-medium block">Link Instagram Oficial (Opcional)</label>
                  <input
                    type="text"
                    value={settingsForm.instagram}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      instagram: e.target.value
                    })}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white"
                    placeholder="https://instagram.com/usuario"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-mono font-medium block">Link Facebook Oficial (Opcional)</label>
                  <input
                    type="text"
                    value={settingsForm.facebook}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      facebook: e.target.value
                    })}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white"
                    placeholder="https://facebook.com/pagina"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Banner and texts */}
            <div className="space-y-4">
              <h4 className="text-[11px] text-primary-neon uppercase tracking-widest font-black font-mono border-b border-border-dim/50 pb-1">3. Textos do Billboard Banner e Institucional</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-mono font-medium block">Título do Banner Principal</label>
                  <input
                    required
                    type="text"
                    value={settingsForm.bannerTitulo}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bannerTitulo: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-mono font-medium block">Subtítulo do Banner Principal</label>
                  <input
                    required
                    type="text"
                    value={settingsForm.bannerSubtitulo}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bannerSubtitulo: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-mono font-medium block">História / Textos Quem Somos</label>
                <textarea
                  required
                  rows={4}
                  value={settingsForm.textosInstitucionais}
                  onChange={(e) => setSettingsForm({ ...settingsForm, textosInstitucionais: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-dark border border-border-dim rounded-xl text-xs text-white leading-relaxed focus:outline-none"
                />
              </div>
            </div>

            {/* Accent Theme Color Selector */}
            <div className="space-y-3">
              <h4 className="text-[11px] text-primary-neon uppercase tracking-widest font-black font-mono border-b border-border-dim/50 pb-1">4. Esquema Visual Temático (Paleta Neon Principal)</h4>
              <p className="text-xs text-text-dim">Selecione uma cor para atualizar imediatamente toda a marca visual, botões hover, dezenas ativas e luzes glow do site.</p>
              
              <div className="flex gap-4 pt-2">
                {[
                  { name: 'Royal Slate (Azul Escuro)', value: '#2563eb' },
                  { name: 'Power Sun (Amarelo)', value: '#f59e0b' },
                  { name: 'Cyan Tech (Ciano)', value: '#06b6d4' },
                  { name: 'Royal Magenta (Magenta)', value: '#d946ef' },
                  { name: 'Velvet Rose (Vermelho)', value: '#f43f5e' }
                ].map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, corPrimaria: color.value })}
                    className={`px-3 py-2 rounded-xl text-xs font-mono border hover:scale-105 transition-all cursor-pointer flex items-center gap-2 ${
                      settingsForm.corPrimaria === color.value 
                        ? 'bg-primary-neon text-bg-dark font-bold border-primary-neon shadow-lg' 
                        : 'bg-bg-dark text-slate-300 border-border-dim'
                    }`}
                    style={{
                      borderColor: settingsForm.corPrimaria === color.value ? undefined : color.value
                    }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.value }} />
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit settings button */}
            <div className="pt-4 border-t border-border-dim/50 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-primary-neon text-bg-dark font-sans font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-xl font-bold border cursor-pointer"
              >
                Salvar Configurações Gerais
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
