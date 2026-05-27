# Manual Completo de Instalação na Hostinger (Hospedagem Compartilhada)
Este guia detalha o processo passo a passo para colocar a sua plataforma de Rifa VIP em produção utilizando a sua conta de hospedagem compartilhada na Hostinger.

---

## 🚀 Visão Geral do Sistema na Hospedagem
Como a Hostinger utiliza servidores baseados em **Apache + PHP + MySQL**, adaptamos a plataforma para tirar o melhor proveito natural desse ambiente:
- **Frontend**: Compilado em HTML5/React de alto desempenho (SPA).
- **Upload de Imagens**: Processado diretamente pelo script inteligente `upload.php` na sua hospedagem em tempo real, sem utilizar codificação pesada html/base64 de forma local. Múltiplos uploads suportados na administração.
- **Roteamento**: Controlado de forma invisível pelo arquivo `.htaccess` garantindo que as páginas internas recarreguem sem erros (404).
- **Webhooks**: Integrado via `webhook_pix.php`.

---

## 📋 Pré-requisitos
1. Um domínio ativo (ex: `seusite.com.br`) conectado à sua conta Hostinger.
2. Acesso ao painel da Hostinger (**hPanel**).
3. Uma versão recente do [Node.js](https://nodejs.org/) instalada em seu computador (caso queira compilar localmente).

---

## 🛠️ Passo a Passo da Instalação

### Opção A: Compilar Automaticamente pelo GitHub Actions (Mais Prático!)
Se você enviou ou integrou o seu projeto ao **GitHub**, nós configuramos pra você uma automação completa! Sempre que você atualizar o código (fazer um push), o GitHub vai compilar a aplicação e gerar o arquivo ZIP prontinho para você de forma 100% online.
1. Acesse o seu repositório no **GitHub**.
2. Clique na aba **Actions** na barra de menu superior.
3. Você verá o fluxo chamado `Compilar Rifa VIP para Produção (Hostinger)`.
4. Uma vez que o fluxo terminar de rodar (indicado por um check verde):
   - Clique na execução correspondente ao seu último envio.
   - Role a página até o final na seção **Artifacts** (Artefatos) e clique para baixar o arquivo **`plataforma_rifa_pronta`**.
5. Salve o arquivo ZIP baixado. Ele já contém todos os arquivos React e PHP unificados na estrutura ideal para colocar direto na Hostinger (pule para o **Passo 3**)!

---

### Opção B: Construir o Projeto Localmente
Se prefere compilar no seu computador antes de subir:
1. Em seu computador local, abra o terminal na pasta raiz do projeto e execute os seguintes comandos:
   ```bash
   # Instalar as dependências do projeto
   npm install

   # Compilar e gerar a build de produção otimizada
   npm run build
   ```
2. Este comando criará uma pasta chamada `dist` na raiz do seu projeto. A pasta `dist` conterá toda a aplicação pronta para rodar na web, incluindo:
   - Os arquivos estáticos otimizados (HTML, CSS e JS reunidos na pasta `assets`).
   - Seu arquivo PHP utilitário de upload (`upload.php`).
   - Seu arquivo `.htaccess` para roteamento limpo de páginas.
   - Seu arquivo Webhook do pix (`webhook_pix.php`).
   - As subpastas do backend PHP (`admin/`, `app/` e `config/`) que o nosso script de pós-processamento copiou automaticamente para lá para que o PHP também funcione em produção!

---

### Passo 2: Compactar os Arquivos para Envio (Caso tenha compilado pela Opção B)
1. Entre na pasta `dist` gerada em seu computador.
2. Selecione **todos** os arquivos e pastas de dentro dela (incluindo a pasta `assets`, `public`, `index.html`, `upload.php`, `.htaccess`, etc).
3. Compacte tudo em um arquivo `.zip` (por exemplo, `site_rifa.zip`). 
   *Nota: Certifique-se de compactar os arquivos diretamente, e não a pasta "dist" inteira.*

---

### Passo 3: Criar o Banco de Dados MySQL na Hostinger
1. Acesse o **hPanel** da Hostinger.
2. No menu lateral ou na barra de busca superior do hPanel, clique em **Bancos de Dados MySQL**.
3. Em "Criar Novo Banco de Dados MySQL", preencha:
   - **Nome do Banco de Dados**: ex. `rifa_banco`
   - **Usuário do MySQL**: ex. `rifa_usuario`
   - **Senha**: Crie uma senha forte e anote-a.
4. Clique em **Criar**.

---

### Passo 4: Importar o SQL do Banco de Dados
1. No painel dos Bancos de Dados criados, clique no botão **Enter phpMyAdmin** ao lado do banco de dados recém-criado.
2. No phpMyAdmin, clique na aba **Importar** (Import) localizada na barra superior.
3. Clique em "Escolher arquivo" e selecione o arquivo SQL que fornecemos para você (localizado em `src/utils/database.sql` ou `rifa_banco.sql` na raiz do seu projeto).
4. Clique no botão **Executar** (Go) no canto inferior. O banco de dados e as tabelas serão estruturados em instantes.

---

### Passo 4.5: Configurar as Credenciais do Banco no PHP
Como a sua hospedagem Hostinger roda PHP para o painel de Administração, consulta de sorteios e para o processamento do Webhook Pix, você precisa informar a ela quais são as credenciais do banco MySQL que você acabou de criar no **Passo 3**:
1. Pelo **Gerenciador de Arquivos** da Hostinger, navegue até a pasta `config/` (que deve estar um nível abaixo de onde você extraiu, ou dentro dela se carregou o projeto inteiro).
2. Dê um duplo-clique no arquivo `database.php` para editá-lo direto pela Hospedagem Hostinger.
3. Altere as seguintes diretrizes preenchendo as suas credenciais reais criadas na Hostinger:
   ```php
   define('DB_HOST', 'localhost'); // Mantenha localhost para Hostinger
   define('DB_NAME', 'insira_nome_do_seu_banco_aqui');
   define('DB_USER', 'insira_usuario_do_seu_banco_aqui');
   define('DB_PASS', 'insira_senha_forte_do_seu_banco_aqui');
   ```
4. Aproveite para atualizar o token do Mercado Pago na mesma tela se tiver:
   ```php
   define('MERCADO_PAGO_TOKEN', 'APP_USR-SEU-ACCESS-TOKEN-AQUI');
   ```
5. Clique em **Salvar (Save)** e feche o arquivo.

---

### Passo 5: Fazer o Upload dos Arquivos com o File Manager do hPanel
1. Volte ao painel principal do hPanel e clique em **Gerenciador de Arquivos** (File Manager) do seu domínio.
2. Acesse a pasta raiz pública, geralmente chamada de `public_html`.
3. Certifique-se de que a pasta está vazia (caso tenha um arquivo default `default.html` da Hostinger, apague-o para não conflitar).
4. Clique no botão de **Upload** (ícone de seta no canto superior direito) e envie seu arquivo `site_rifa.zip`.
5. Clique com o botão direito no arquivo `site_rifa.zip` carregado e selecione **Extrair** (Extract). Indique para extrair no diretório atual (escreva `.` ou deixe em branco).
6. Depois de extrair, você pode apagar o arquivo `site_rifa.zip` da hospedagem para manter sua pasta organizada.

---

### Passo 6: Ajustar Permissões para Imagens de Upload
1. O script `upload.php` criará automaticamente uma pasta chamada `uploads` no servidor assim que o primeiro upload for acionado.
2. Para que o servidor Hostinger possa gravar as fotos nela, navegue no Gerenciador de Arquivos, sinta-se livre para criar manualmente uma pasta chamada `uploads` na própria raiz de `public_html`.
3. Clique com o botão direito na pasta `uploads`, vá em **Instruções de Acesso / Permissões** (Permissions).
4. Verifique e marque as permissões como **755** (Leitura e Execução para todos, Escrita para o Dono) ou **777** (se houver restrições estritas de hosts) e aplique. Isso habilita o salvamento nativo e seguro de fotos!

---

### Passo 7: Testar a Plataforma
Agora tudo está pronto! Acesse seu domínio no navegador (ex: `https://seusite.com.br`):
- O site do comprador carregará instantaneamente com todas as configurações.
- A navegação pelas páginas e abas funcionará com perfeita transição.
- Acesse a área administrativa em `/admin` e use as opções de criar ou editar rifas/sorteios para carregar diretamente novas imagens do seu celular ou PC. A plataforma aceita carregamento instantâneo via botão de **Upload** integrado sob medida!

---

💡 **Para suporte rápido ou dúvidas**: Nos contate através do nosso portal de desenvolvedor oficial! Prêmios e campanhas gerenciados de forma fácil, segura e com baixas automáticas de bilhetes.
