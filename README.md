Darvin MVP
O Projeto
O Darvin MVP (Minimum Viable Product) é uma plataforma de business intelligence e ponto de venda (PDV) desenvolvida como solução para o Challenge 2025 da FIAP, em parceria com a empresa Astéria. A aplicação foi projetada para resolver um dos grandes desafios enfrentados pela indústria e pelo pequeno varejo: a coleta e análise de dados de sell-out.



A plataforma simula um ecossistema onde varejistas podem gerenciar suas vendas e estoque de forma simplificada, enquanto a indústria obtém acesso a dados estruturados e insights valiosos sobre a performance de seus produtos no ponto de venda. O projeto foi construído inteiramente em front-end com React e Vite, utilizando o localStorage do navegador para simular um banco de dados, tornando-o funcional sem a necessidade de um back-end.

O Desafio Astéria
A indústria e o varejo enfrentam dificuldades para obter dados de venda ao consumidor final (sell-out), essenciais para criar campanhas estratégicas, gerenciar estoques e aumentar o market share. As soluções existentes são, em geral, de alto custo, complexas e não atendem o pequeno varejo, que não possui sistemas de ERP ou frentes de caixa integrados.



O desafio proposto pela Astéria foi criar uma solução inovadora que fosse:


Acessível e Eficiente: Para coletar dados sem depender de integrações complexas.


Inteligente: Com um BI que entregue insights relevantes para a tomada de decisão.


Escalável: Com aplicabilidade em diversos setores do comércio.


Viável: Com um modelo de monetização sustentável e que gere valor tanto para a indústria quanto para o varejo.

Funcionalidades
A plataforma é dividida em dois portais principais: Varejista e Indústria.

Para o Varejista (Retail)
Dashboard Analítico: Visualização de KPIs (Key Performance Indicators) como receita total, número de vendas e ticket médio, com filtros por período. Apresenta gráficos de receita por dia e por categoria, além de uma lista dos produtos mais vendidos.

Assistente de Performance: Uma área que fornece insights e recomendações acionáveis, como alertas de estoque baixo para produtos populares, itens perto da validade e produtos com baixo giro.

Múltiplos Pontos de Venda (PDV):

PDV Tradicional: Interface visual para selecionar produtos e registrar vendas em tempo real, ideal para o dia a dia da loja.

Anota Aí: Uma planilha online para registrar rapidamente múltiplas vendas que ocorreram ao longo do dia, de forma consolidada.

Upload de Planilha: Permite o registro de múltiplas vendas em lote através do upload de um arquivo .xlsx ou .csv.

Gestão de Estoque: Tabela completa para visualização e gerenciamento do inventário, com detalhes por lote, data de validade, custo, preço de venda e margem.

Programas de Incentivo: Área para visualizar e participar de campanhas de incentivo oferecidas pelas indústrias, com acompanhamento de progresso.

Configurações da Loja: Formulário para visualizar e editar as informações cadastrais do estabelecimento.

Para a Indústria (Industry)
Dashboard: Visão geral da performance dos seus produtos nos varejos parceiros, com KPIs de receita, unidades vendidas e varejistas ativos.

Gestão de Programas: Ferramenta para criar, editar e acompanhar o desempenho dos programas de incentivo oferecidos aos varejistas.

Darvin Vision: Módulo de advanced analytics que oferece insights sobre:

Comportamento de Compra: Análise de cestas de produtos (combos mais vendidos) e padrões de venda por dia da semana e região.

Perfil Demográfico: Entendimento do perfil dos consumidores (gênero, faixa etária) que compram seus produtos.

Oportunidades de Mercado: Identificação de segmentos de alto valor e potencial de cross-selling.

Tecnologias Utilizadas
<p align="center">
<a href="https://react.dev/" target="_blank" rel="noreferrer">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="React" width="40" height="40"/>
</a>
<a href="https://vitejs.dev/" target="_blank" rel="noreferrer">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/vitejs/vitejs-original.svg" alt="Vite" width="40" height="40"/>
</a>
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noreferrer">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="JavaScript" width="40" height="40"/>
</a>
<a href="https://reactrouter.com/" target="_blank" rel="noreferrer">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/reactrouter/reactrouter-original.svg" alt="React Router" width="40" height="40"/>
</a>
<a href="https://react-bootstrap.github.io/" target="_blank" rel="noreferrer">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/bootstrap/bootstrap-plain.svg" alt="React Bootstrap" width="40" height="40"/>
</a>
<a href="https://recharts.org/" target="_blank" rel="noreferrer">
<img src="https://raw.githubusercontent.com/recharts/recharts/master/logo.png" alt="Recharts" width="120" height="40"/>
</a>
<a href="https://eslint.org/" target="_blank" rel="noreferrer">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/eslint/eslint-original.svg" alt="ESLint" width="40" height="40"/>
</a>
<a href="https://www.w3.org/html/" target="_blank" rel="noreferrer">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original.svg" alt="HTML5" width="40" height="40"/>
</a>
<a href="https://www.w3.org/Style/CSS/specs.en.html" target="_blank" rel="noreferrer">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" alt="CSS3" width="40" height="40"/>
</a>
</p>

React: Biblioteca principal para a construção da interface de usuário.

Vite: Ferramenta de build e desenvolvimento rápido para projetos web modernos.

React Router: Para o gerenciamento das rotas e navegação da aplicação.

React Bootstrap: Biblioteca de componentes de UI baseada no Bootstrap para agilizar o desenvolvimento do layout.

Recharts: Biblioteca para a criação de gráficos e visualizações de dados.

date-fns: Para manipulação e formatação de datas.

xlsx: Para a leitura e processamento de arquivos de planilhas.

ESLint: Para a análise estática do código, garantindo a qualidade e a padronização.

Como Executar o Projeto
Clone o repositório:

Bash

git clone https://github.com/seu-usuario/darvin-mvp.git
cd darvin-mvp
Instale as dependências:

Bash

npm install
Execute o projeto em modo de desenvolvimento:

Bash

npm run dev
A aplicação estará disponível em http://localhost:5173.



Estrutura de Arquivos

/src
|-- /assets
|   |-- /css
|   |-- /images
|-- /components
|   |-- ProtectedRoute.jsx
|   |-- Sidebar.jsx
|-- /hooks
|   |-- useAuth.js
|-- /layouts
|   |-- AppLayout.jsx
|-- /pages
|   |-- /auth
|   |   |-- Login.jsx
|   |-- /industry
|   |   |-- DarvinVision.jsx
|   |   |-- DashboardIndustry.jsx
|   |   |-- ProgramsIndustry.jsx
|   |-- /retail
|   |   |-- /pos
|   |   |   |-- OnlineSheetPOS.jsx
|   |   |   |-- SalesHistory.jsx
|   |   |   |-- TraditionalPOS.jsx
|   |   |   |-- UploadPOS.jsx
|   |   |-- Assistant.jsx
|   |   |-- DashboardRetail.jsx
|   |   |-- Inventory.jsx
|   |   |-- Programs.jsx
|   |   |-- SettingsRetail.jsx
|-- /state
|   |-- seed.js
|   |-- selectors.js
|   |-- storage.js
|-- /utils
|   |-- ids.js
|   |-- rating.js
|-- App.jsx
|-- main.jsx