Darvin MVP
Introdução
O Darvin MVP (Minimum Viable Product) é uma aplicação web desenvolvida para ser uma plataforma de business intelligence e ponto de venda (PDV) para o pequeno varejo, conectando-o com a indústria. A aplicação simula um ambiente onde varejistas podem gerenciar suas vendas, estoque e obter insights sobre seu negócio, enquanto a indústria pode ter acesso a dados de vendas e performance de seus produtos.

Este projeto foi construído com React e Vite, e utiliza o localStorage do navegador para simular um banco de dados, tornando-o uma aplicação totalmente front-end e funcional sem a necessidade de um back-end.

Funcionalidades
Para o Varejista (Retail)
Dashboard Analítico: Visualização de KPIs (Key Performance Indicators) como receita total, número de vendas e ticket médio, com filtros por período (7, 30 e 90 dias). Gráficos de receita por dia e por categoria, além de uma lista dos produtos mais vendidos.

Assistente de Performance: Uma área que fornece insights e recomendações acionáveis com base nos dados de vendas e estoque, como alertas de estoque baixo para produtos populares, produtos perto da validade e itens com baixo giro.

Múltiplos Pontos de Venda (PDV):

PDV Tradicional: Uma interface visual para selecionar produtos e registrar vendas, ideal para o dia a dia da loja.

"Anota Aí" (Chatbot POS): Uma forma rápida de registrar vendas através de uma frase, como "Vendi 2 Coca-Cola por 10 reais a unidade".

Upload de Planilha: Permite o registro de múltiplas vendas em lote através do upload de um arquivo .xlsx ou .csv.

Gestão de Estoque: Tabela para visualização e gerenciamento do inventário, com funcionalidades para registrar entradas de produtos e ajustar os níveis de estoque.

Programas de Incentivo: Uma área para visualizar campanhas e programas oferecidos pelas indústrias parceiras.

Configurações da Loja: Formulário para visualizar e editar as informações do estabelecimento.

Para a Indústria (Industry)
Dashboard (Em Construção): Uma página inicial para a visualização de dados agregados de vendas dos produtos da indústria nos varejos cadastrados.

Tecnologias Utilizadas
O projeto foi construído com as seguintes tecnologias e bibliotecas:

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

Recharts: Biblioteca para a criação de gráficos e visualizações de dados no dashboard.

date-fns: Para manipulação e formatação de datas.

xlsx: Para a leitura e processamento de arquivos de planilhas Excel e CSV na funcionalidade de upload.

ESLint: Para a análise estática do código, garantindo a qualidade e a padronização.

Estrutura de Arquivos
A estrutura de arquivos do projeto está organizada da seguinte forma:

/src
|-- /assets
|   |-- /css
|       |-- custom.css       # Estilos personalizados da aplicação
|-- /components
|   |-- ProtectedRoute.jsx   # Componente para proteger rotas
|   |-- Sidebar.jsx          # Barra de navegação lateral
|-- /hooks
|   |-- useAuth.js           # Hook para gerenciamento de autenticação
|-- /layouts
|   |-- AppLayout.jsx        # Layout principal da aplicação (com sidebar)
|-- /pages
|   |-- /auth
|   |   |-- Login.jsx        # Página de login
|   |-- /retail
|   |   |-- /pos
|   |   |   |-- ChatbotPOS.jsx
|   |   |   |-- TraditionalPOS.jsx
|   |   |   |-- UploadPOS.jsx
|   |   |-- Assistant.jsx
|   |   |-- DashboardRetail.jsx
|   |   |-- Inventory.jsx
|   |   |-- Programs.jsx
|   |   |-- SettingsRetail.jsx
|-- /state
|   |-- seed.js              # Dados iniciais para popular o localStorage
|   |-- selectors.js         # Funções para buscar e processar dados do estado
|   |-- storage.js           # Funções para interagir com o localStorage
|-- /utils
|   |-- ids.js               # Função para gerar IDs únicos
|-- App.jsx                  # Componente principal que define as rotas
|-- main.jsx                 # Ponto de entrada da aplicação