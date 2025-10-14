Darvin MVP - Business Intelligence para Indústria e Varejo
<p align="center">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="React" width="60" height="60"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/vitejs/vitejs-original.svg" alt="Vite" width="60" height="60"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/bootstrap/bootstrap-plain.svg" alt="React Bootstrap" width="60" height="60"/>
</p>

<p align="center">
<strong>Uma plataforma de BI e PDV que conecta o pequeno varejo à indústria, transformando dados de venda em insights estratégicos.</strong>
</p>
<p align="center">
Solução desenvolvida para o <strong>Challenge 2025 da FIAP</strong> em parceria com a empresa <strong>Astéria</strong>.
</p>

🚀 O Desafio
A indústria e o pequeno varejo enfrentam um grande obstáculo: a falta de visibilidade dos dados de venda ao consumidor final (sell-out). Essas informações são cruciais para criar campanhas eficientes, gerenciar estoques e entender o comportamento do consumidor. As soluções existentes são caras, complexas e inacessíveis para o pequeno comerciante, que muitas vezes não possui sistemas de gestão integrados.

O desafio proposto pela Astéria foi criar uma solução que fosse:

Acessível e Eficiente: Para coletar dados de forma simples, sem integrações complexas.

Inteligente: Com um BI que gere insights acionáveis para a tomada de decisão.

Escalável: Com potencial para ser aplicada em diversos setores do comércio.

Valiosa: Gerando benefícios claros tanto para a indústria quanto para o varejo.

✨ A Solução: Darvin MVP
O Darvin MVP é um ecossistema simulado que funciona inteiramente no navegador, sem a necessidade de um back-end. Ele oferece uma suíte de ferramentas para o varejista gerenciar suas operações diárias e, ao mesmo tempo, fornece à indústria uma visão clara e detalhada da performance de seus produtos no ponto de venda.

A plataforma é dividida em dois portais:

🏪 Para o Varejista (Retail)
Um conjunto de ferramentas para simplificar a gestão e impulsionar as vendas.

Dashboard Analítico: KPIs essenciais (receita, vendas, ticket médio), gráficos de performance por dia e categoria, e ranking de produtos mais vendidos.

Assistente de Performance: Insights proativos gerados por IA, como alertas de estoque baixo para produtos populares, itens próximos da validade e produtos com baixo giro.

Múltiplos Pontos de Venda (PDV):

PDV Tradicional: Interface visual e rápida para vendas do dia a dia.

Anota Aí: Uma "planilha online" para registrar múltiplas vendas de forma consolidada no fim do dia.

Upload de Planilha: Ferramenta para importar vendas em lote a partir de arquivos .xlsx ou .csv.

Gestão de Estoque Completa: Controle total do inventário, com detalhes por lote, data de validade, custo, preço de venda e margem de lucro calculada.

Programas de Incentivo: Participe de campanhas criadas pelas indústrias e acompanhe seu progresso para ganhar prêmios e benefícios.

🏭 Para a Indústria (Industry)
Uma visão estratégica para entender o mercado e otimizar a distribuição.

Dashboard Consolidado: KPIs de performance dos seus produtos em toda a rede de varejistas parceiros (receita, unidades vendidas, varejistas ativos).

Gestão de Programas: Crie e gerencie campanhas de incentivo para engajar os varejistas e impulsionar as vendas de produtos específicos.

Darvin Vision (Advanced Analytics):

Análise de Cesta: Descubra quais produtos são comprados juntos com mais frequência (análise de combos).

Perfil Demográfico: Entenda o perfil dos consumidores (gênero, faixa etária) que compram seus produtos.

Oportunidades de Mercado: Identifique segmentos de alto valor e potencial de cross-selling para direcionar estratégias de marketing.

🛠️ Arquitetura e Tecnologias
Este projeto foi construído com uma arquitetura 100% front-end. Para simular um ambiente real sem a necessidade de um servidor ou banco de dados, toda a persistência de dados é gerenciada através do localStorage do navegador.

seed.js: Popula o localStorage com um ecossistema completo de dados (indústrias, varejistas, produtos, clientes e um histórico de 4000 vendas) na primeira execução.

selectors.js: Atua como uma camada de business intelligence, processando e cruzando os dados brutos do localStorage para gerar os KPIs, gráficos e insights exibidos nos dashboards.

<p align="center">
<a href="https://react.dev/" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="React" width="40" height="40"/></a>
<a href="https://vitejs.dev/" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/vitejs/vitejs-original.svg" alt="Vite" width="40" height="40"/></a>
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="JavaScript" width="40" height="40"/></a>
<a href="https://reactrouter.com/" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/reactrouter/reactrouter-original.svg" alt="React Router" width="40" height="40"/></a>
<a href="https://react-bootstrap.github.io/" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/bootstrap/bootstrap-plain.svg" alt="React Bootstrap" width="40" height="40"/></a>
<a href="https://recharts.org/" target="_blank" rel="noreferrer"><img src="https://camo.githubusercontent.com/a61061730a66f7f2235c607833a69a5e8f498c4d15682c3f3f01b315629f19a0/68747470733a2f2f72656368617274732e6f72672f656e2d55532f6173736574732f6c6f676f2e737667" alt="Recharts" height="40"/></a>
<a href="https://eslint.org/" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/eslint/eslint-original.svg" alt="ESLint" width="40" height="40"/></a>
</p>

React e Vite: Para uma experiência de desenvolvimento moderna e performática.

React Router: Para o gerenciamento de rotas e navegação.

React Bootstrap: Para a construção de uma UI elegante e responsiva.

Recharts: Para a criação dos gráficos e visualizações de dados.

date-fns: Para manipulação e formatação de datas.

xlsx: Para a funcionalidade de upload de planilhas.