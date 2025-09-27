// --- ARQUIVO: src/state/seed.js ---
// --- TECNOLOGIA: JavaScript ---
// Este arquivo é o "semeador" do nosso banco de dados.
// Sua função é criar um conjunto completo de dados falsos (mock data) para que o aplicativo
// tenha informações para mostrar assim que for iniciado pela primeira vez.
// Isso é essencial para desenvolver e testar sem precisar de um banco de dados real.

// Importamos as funções que precisamos para salvar os dados e gerar IDs.
import { setItem } from './storage';
import { generateId } from '../utils/ids';

// A função principal que será chamada para popular o banco de dados.
export const seedDatabase = () => {
  // Apenas uma mensagem no console para sabermos que a função está rodando.
  console.log("Populando o localStorage com dados iniciais...");

  // --- 1. Atores (Indústrias, Fornecedores, Varejos) ---
  // Criamos listas (arrays) de objetos para cada tipo de participante do sistema.
  const industries = [
    {
      id: 'ind1', nomeFantasia: 'Boreal Bebidas S.A.', razaoSocial: 'Boreal Bebidas S.A.', cnpj: '11.111.111/0001-11',
      endereco: { logradouro: 'Av. Polar, 100', bairro: 'Centro', cidade: 'Campinas', uf: 'SP', cep: '13010-000' },
      linhaAtuacao: 'Bebidas', contato: { telefone: '19 4002-8922', email: 'bi@borealbebidas.com' }, premium: true
    },
    // ... mais objetos de indústria
  ];

  const suppliers = [
    { id: 'sup1', nomeFantasia: 'SulMinas Distribuidora', /* ... */ },
    // ... mais objetos de fornecedor
  ];

  const retailers = [
    { id: 'ret1', nomeFantasia: 'Mercearia Bom Preço', /* ... */ },
    // ... mais objetos de varejista
  ];

  // --- 2. Usuários ---
  // Criamos os usuários que poderão fazer login no sistema.
  // Cada usuário está ligado a um "ator" (uma loja, uma indústria, etc.) através do `actorId`.
  const users = [
    { id: generateId(), email: 'ana@mercearia.com', password: '123', role: 'retail', actorId: 'ret1', displayName: 'Ana (Mercearia)' },
    // ... mais objetos de usuário
  ];

  // --- 3. Produtos (100 SKUs fixos) ---
  // Criamos uma lista de produtos.
  const products = [];

  // Criamos os produtos por categoria para organizar.
  const bebidas = [
    ["Refrigerante Boreal Cola 2L", "Refrigerantes", 8.50],
    // ... mais arrays de dados de bebida
  ];
  // Usamos `forEach` para percorrer a lista de bebidas e criar um objeto para cada uma,
  // adicionando-a à lista principal de `products`.
  bebidas.forEach((p, i) => products.push({
    id: generateId(), sku: `BEV-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Bebidas", subcategoria: p[1], industryId: "ind1", precoSugerido: p[2], supplierIds: ["sup1"]
  }));

  // O mesmo processo é repetido para alimentos, limpeza e higiene.
  const alimentos = [ /* ... */ ];
  alimentos.forEach(/* ... */);
  
  const limpeza = [ /* ... */ ];
  limpeza.forEach(/* ... */);

  const higiene = [ /* ... */ ];
  higiene.forEach(/* ... */);

  // --- 4. Clientes ---
  // Geramos clientes falsos para cada varejista.
  let clients = [];
  retailers.forEach(r => {
    for (let i = 1; i <= 15; i++) {
      clients.push({ id: generateId(), retailerId: r.id, nome: `Cliente ${i} da ${r.nomeFantasia}` });
    }
  });

  // --- 5. Estoque ---
  // Criamos um inventário inicial para cada varejista, pegando 40 produtos aleatórios.
  let inventory = [];
  retailers.forEach(r => {
    const sample = products.sort(() => 0.5 - Math.random()).slice(0, 40);
    sample.forEach(p => {
      // ... geramos dados aleatórios como quantidade e data de validade.
      const validade = new Date();
      validade.setDate(validade.getDate() + Math.floor(Math.random() * 180));
      inventory.push({
        id: generateId(), retailerId: r.id, productId: p.id, estoque: Math.floor(Math.random() * 100) + 20,
        custoMedio: +(p.precoSugerido * 0.7).toFixed(2), precoVenda: +(p.precoSugerido * 1.25).toFixed(2),
        dataValidade: validade.toISOString()
      });
    });
  });

  // --- 6. Vendas ---
  // Geramos 400 vendas aleatórias para popular os gráficos e relatórios.
  const formas = ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Pix"];
  let sales = [];
  for (let i = 0; i < 400; i++) {
      // ... selecionamos um varejista, um produto do seu estoque, uma quantidade e data aleatórios.
  }
  
  // --- 7. Fundos de Dados ---
  const dataFunds = [ /* ... */ ];
  
  // --- 8. Propostas e Transações ---
  const proposals = [ /* ... */ ];

  // --- Salvando ---
  // Por fim, usamos nossa função `setItem` para salvar todas as listas de dados criadas
  // no localStorage, uma por uma.
  setItem('users', users); setItem('retailers', retailers); setItem('suppliers', suppliers); setItem('industries', industries);
  setItem('products', products); setItem('clients', clients); setItem('inventory', inventory); setItem('sales', sales);
  setItem('dataFunds', dataFunds); setItem('proposals', proposals); setItem('transactions', []); setItem('settings', {});

  console.log("LocalStorage populado com sucesso!");
};
