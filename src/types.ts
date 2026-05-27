/**
 * Types definition for the Raffle Web Application Simulator and PHP MVC Code View
 */

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  cpf: string;
  email?: string;
  createdAt: string;
}

export interface Rifa {
  id: string; // "1", "2", "3", "4" Max 4
  titulo: string;
  descricao: string;
  valorPorNumero: number;
  dataSorteio: string;
  quantidadeNumeros: number; // 1000 (000-999)
  imagemUrl: string;
  imagens?: string[];
  status: 'ativa' | 'inativa' | 'sorteada';
  ganhadorNumero?: string;
  ganhadorNome?: string;
  ganhadorTelefone?: string;
  metodoSorteio?: 'manual' | 'federal';
  numeroFederalOriginal?: string;
}

export interface Pagamento {
  id: string;
  rifaId: string;
  clienteId: string;
  numero: string; // "042", "391", etc.
  txid: string;
  valor: number;
  status: 'pendente' | 'pago' | 'conflito' | 'reembolsado';
  createdAt: string;
  pagadoAt?: string;
}

export interface LogSistema {
  id: string;
  tipo: 'sucesso' | 'info' | 'erro' | 'alerta';
  mensagem: string;
  dataHora: string;
}

export interface PlataformaConfig {
  nomePlataforma: string;
  logoTexto: string;
  bannerTitulo: string;
  bannerSubtitulo: string;
  corPrimaria: 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose';
  whatsappSuporte: string;
  instagram: string;
  facebook: string;
  textosInstitucionais: string;
  faviconUrl: string;
}

export interface ViewFilePHP {
  path: string;
  title: string;
  content: string;
  language: string;
}
