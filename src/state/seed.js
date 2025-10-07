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
  const industries = [
    {
      id: 'ind1', nomeFantasia: 'Boreal Bebidas S.A.', razaoSocial: 'Boreal Bebidas S.A.', cnpj: '11.111.111/0001-11',
      endereco: { logradouro: 'Av. Polar, 100', bairro: 'Centro', cidade: 'Campinas', uf: 'SP', cep: '13010-000' },
      linhaAtuacao: 'Bebidas', contato: { telefone: '19 4002-8922', email: 'bi@borealbebidas.com' }, premium: true
    },
    { id: 'ind2', nomeFantasia: 'DoceVida Alimentos', razaoSocial: 'DoceVida Indústria Alimentícia Ltda.', cnpj: '22.222.222/0001-22', linhaAtuacao: 'Alimentos' },
    { id: 'ind3', nomeFantasia: 'LimpaTudo Química', razaoSocial: 'LimpaTudo Produtos de Limpeza S.A.', cnpj: '33.333.333/0001-33', linhaAtuacao: 'Limpeza' },
    { id: 'ind4', nomeFantasia: 'PeleSuave Cosméticos', razaoSocial: 'PeleSuave Higiene e Cosméticos Ltda.', cnpj: '44.444.444/0001-44', linhaAtuacao: 'Higiene' }
  ];

  const suppliers = [
    { id: 'sup1', nomeFantasia: 'SulMinas Distribuidora', razaoSocial: 'Distribuidora Sul de Minas Ltda', cnpj: '55.555.555/0001-55' },
  ];

  const retailers = [
    { id: 'ret1', nomeFantasia: 'Mercearia Bom Preço', razaoSocial: 'Mercearia Bom Preço & Cia', cnpj: '66.666.666/0001-66', contato: { email: 'contato@mercearia.com'}, endereco: {logradouro: 'Rua das Flores, 123', bairro: 'Centro', cidade: 'São Paulo', uf: 'SP', cep: '01000-000'} },
  ];

  // --- 2. Usuários ---
  const users = [
    { id: generateId(), email: 'ana@mercearia.com', password: '123', role: 'retail', actorId: 'ret1', displayName: 'Ana (Mercearia)' },
    { id: generateId(), email: 'bruno@boreal.com', password: '123', role: 'industry', actorId: 'ind1', displayName: 'Bruno (Boreal)' },
  ];

  // --- 3. Produtos (100 SKUs fixos) ---
  const products = [];

  const bebidas = [
    ["Refrigerante Boreal Cola 2L", "Refrigerantes", 8.50],
    ["Suco de Laranja Boreal 1L", "Sucos", 6.00],
    ["Água Mineral Boreal 500ml", "Águas", 2.50],
  ];
  bebidas.forEach((p, i) => products.push({
    id: generateId(), sku: `BEV-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Bebidas", subcategoria: p[1], industryId: "ind1", precoSugerido: p[2], supplierIds: ["sup1"]
  }));

  // ✅ --- CORREÇÃO AQUI: ADICIONANDO DADOS AOS ARRAYS ---
  const alimentos = [
    ["Biscoito Recheado DoceVida 130g", "Biscoitos", 3.20],
    ["Macarrão Espaguete DoceVida 500g", "Massas", 4.50],
    ["Molho de Tomate DoceVida 340g", "Molhos", 2.80],
  ];
  alimentos.forEach((p, i) => products.push({
      id: generateId(), sku: `ALI-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Alimentos", subcategoria: p[1], industryId: "ind2", precoSugerido: p[2], supplierIds: ["sup1"]
  }));
  
  const limpeza = [
    ["Detergente Limão LimpaTudo 500ml", "Lava-louças", 2.20],
    ["Desinfetante Lavanda LimpaTudo 2L", "Desinfetantes", 9.90],
    ["Água Sanitária LimpaTudo 1L", "Alvejantes", 4.00],
  ];
  limpeza.forEach((p, i) => products.push({
    id: generateId(), sku: `LMP-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Limpeza", subcategoria: p[1], industryId: "ind3", precoSugerido: p[2], supplierIds: ["sup1"]
  }));

  const higiene = [
    ["Sabonete Lavanda PeleSuave 90g", "Sabonetes", 1.80],
    ["Shampoo Hidratante PeleSuave 350ml", "Cabelos", 12.50],
    ["Creme Dental Menta PeleSuave 70g", "Higiene Bucal", 3.50],
  ];
  higiene.forEach((p, i) => products.push({
    id: generateId(), sku: `HIG-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Higiene", subcategoria: p[1], industryId: "ind4", precoSugerido: p[2], supplierIds: ["sup1"]
  }));
  // ✅ --- FIM DA CORREÇÃO ---

  // --- 4. Clientes ---
  let clients = [];
  retailers.forEach(r => {
    for (let i = 1; i <= 15; i++) {
      clients.push({ id: generateId(), retailerId: r.id, nome: `Cliente ${i} da ${r.nomeFantasia}` });
    }
    clients.push({ id: 'consumidor_final', retailerId: r.id, nome: 'Consumidor Final' });
  });

  // --- 5. Estoque ---
  let inventory = [];
  retailers.forEach(r => {
    const sample = products.sort(() => 0.5 - Math.random()).slice(0, 40);
    sample.forEach(p => {
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
  const formas = ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Pix"];
  let sales = [];
  for (let i = 0; i < 400; i++) {
    const retailer = retailers[Math.floor(Math.random() * retailers.length)];
    const retailerInventory = inventory.filter(inv => inv.retailerId === retailer.id && inv.estoque > 5);
    if (retailerInventory.length === 0) continue;
    
    const numItens = Math.floor(Math.random() * 3) + 1;
    const saleItems = [];
    let total = 0;

    for (let j = 0; j < numItens; j++) {
        const invItem = retailerInventory[Math.floor(Math.random() * retailerInventory.length)];
        const product = products.find(p => p.id === invItem.productId);
        const qtde = Math.floor(Math.random() * 3) + 1;
        saleItems.push({ productId: product.id, sku: product.sku, qtde, precoUnit: invItem.precoVenda });
        total += qtde * invItem.precoVenda;
    }
    
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 90));

    sales.push({
        id: generateId(), retailerId: retailer.id, dataISO: saleDate.toISOString(), clienteId: 'consumidor_final',
        itens: saleItems, totalBruto: total, desconto: 0, totalLiquido: total,
        formaPagamento: formas[Math.floor(Math.random() * formas.length)]
    });
  }
  
  // --- 7. Fundos de Dados ---
  const dataFunds = [
      { id: 'df1', nome: 'Fundo de Bebidas Campinas', categoriaPrincipal: 'Bebidas', membrosCount: 12, ultimaPropostaValor: 12500.00, status: 'Aberto'},
      { id: 'df2', nome: 'Fundo de Mercearias Centro-Oeste', categoriaPrincipal: 'Alimentos Secos', membrosCount: 8, ultimaPropostaValor: 8200.00, status: 'Fechado'},
  ];
  
  // --- 8. Propostas e Transações ---
  const proposals = [
      { id: 'prop1', type: 'retailer', targetId: 'ret1', industryId: 'ind1', valorOfertadoBRL: 500, descricao: 'Dados de vendas anonimizados para a categoria de refrigerantes dos últimos 90 dias.', status: 'pendente', createdAt: new Date().toISOString() },
      { id: 'prop2', type: 'retailer', targetId: 'ret1', industryId: 'ind2', valorOfertadoBRL: 350, descricao: 'Dados de estoque e validade para a categoria de biscoitos.', status: 'aceita', createdAt: new Date('2025-09-15').toISOString() },
      { id: 'prop3', type: 'retailer', targetId: 'ret1', industryId: 'ind3', valorOfertadoBRL: 200, descricao: 'Informações sobre ruptura de estoque de produtos de limpeza.', status: 'recusada', createdAt: new Date('2025-09-10').toISOString() },
  ];

  // --- Salvando ---
  setItem('users', users); setItem('retailers', retailers); setItem('suppliers', suppliers); setItem('industries', industries);
  setItem('products', products); setItem('clients', clients); setItem('inventory', inventory); setItem('sales', sales);
  setItem('dataFunds', dataFunds); setItem('proposals', proposals); setItem('transactions', []); setItem('settings', {});

  console.log("LocalStorage populado com sucesso!");
};