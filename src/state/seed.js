// FILE: src/state/seed.js
import { setItem } from './storage';
import { generateId } from '../utils/ids';

// Função principal para popular o banco de dados
// Correto
export const seedDatabase = () => {
  // ...
  console.log("Populando o localStorage com dados iniciais...");

  // --- 1. Atores (Indústrias, Fornecedores, Varejos) ---
  const industries = [
    {
      id: 'ind1', nomeFantasia: 'Boreal Bebidas S.A.', razaoSocial: 'Boreal Bebidas S.A.', cnpj: '11.111.111/0001-11',
      endereco: { logradouro: 'Av. Polar, 100', bairro: 'Centro', cidade: 'Campinas', uf: 'SP', cep: '13010-000' },
      linhaAtuacao: 'Bebidas', contato: { telefone: '19 4002-8922', email: 'bi@borealbebidas.com' }, premium: true
    },
    {
      id: 'ind2', nomeFantasia: 'DoceVida Alimentos S.A.', razaoSocial: 'DoceVida Alimentos S.A.', cnpj: '22.222.222/0001-22',
      endereco: { logradouro: 'Rua das Guloseimas, 200', bairro: 'Centro', cidade: 'Ribeirão Preto', uf: 'SP', cep: '14010-000' },
      linhaAtuacao: 'Alimentos', contato: { telefone: '16 98888-0000', email: 'dados@docevida.com' }, premium: true
    },
    {
      id: 'ind3', nomeFantasia: 'LimpMax Indústria de Limpeza S.A.', razaoSocial: 'LimpMax S.A.', cnpj: '33.333.333/0001-33',
      endereco: { logradouro: 'Rua Brilhante, 300', bairro: 'Industrial', cidade: 'Betim', uf: 'MG', cep: '32600-000' },
      linhaAtuacao: 'Limpeza', contato: { telefone: '31 97777-1111', email: 'intel@limpmax.com' }, premium: true
    },
    {
      id: 'ind4', nomeFantasia: 'Aurora Hygiene S.A.', razaoSocial: 'Aurora Hygiene S.A.', cnpj: '44.444.444/0001-44',
      endereco: { logradouro: 'Alameda das Flores, 400', bairro: 'Jardins', cidade: 'Curitiba', uf: 'PR', cep: '80000-000' },
      linhaAtuacao: 'Higiene', contato: { telefone: '41 98888-2222', email: 'mkt@aurorahygiene.com' }, premium: true
    }
  ];

  const suppliers = [
    { id: 'sup1', nomeFantasia: 'SulMinas Distribuidora', razaoSocial: 'SulMinas Distribuidora Ltda', cnpj: '55.555.555/0001-55',
      endereco: { logradouro: 'Rua dos Vales, 50', bairro: 'Centro', cidade: 'Poços de Caldas', uf: 'MG', cep: '37701-000' },
      linhaAtuacao: 'Bebidas e Alimentos', contato: { telefone: '35 3555-5555', email: 'contato@sulminas.com' }, premium: true },
    { id: 'sup2', nomeFantasia: 'Noroeste Atacado', razaoSocial: 'Noroeste Atacado e Varejo', cnpj: '66.666.666/0001-66',
      endereco: { logradouro: 'Av. Central, 600', bairro: 'Setor Comercial', cidade: 'Goiânia', uf: 'GO', cep: '74000-000' },
      linhaAtuacao: 'Limpeza e Higiene', contato: { telefone: '62 96666-0000', email: 'vendas@noroeste.com' }, premium: true },
    { id: 'sup3', nomeFantasia: 'Alpha Supply', razaoSocial: 'Alpha Supply Co.', cnpj: '77.777.777/0001-77',
      endereco: { logradouro: 'Rua Principal, 70', bairro: 'Moema', cidade: 'São Paulo', uf: 'SP', cep: '04000-000' },
      linhaAtuacao: 'Alimentos e Higiene', contato: { telefone: '11 95555-7777', email: 'alpha@supply.com' }, premium: true }
  ];

  const retailers = [
    { id: 'ret1', nomeFantasia: 'Mercearia Bom Preço', razaoSocial: 'Mercearia de Ana Ltda', cnpj: '88.888.888/0001-88',
      endereco: { logradouro: 'Rua do Comércio, 123', bairro: 'Centro', cidade: 'São Paulo', uf: 'SP', cep: '01000-000' },
      linhaAtuacao: 'Alimentos e Bebidas', contato: { telefone: '11 99999-0001', email: 'ana@mercearia.com' }, premium: false },
    { id: 'ret2', nomeFantasia: 'Loja de Conveniência 24h', razaoSocial: 'Conveniencia do Carlos ME', cnpj: '99.999.999/0001-99',
      endereco: { logradouro: 'Av. das Américas, 456', bairro: 'Funcionários', cidade: 'Belo Horizonte', uf: 'MG', cep: '30140-000' },
      linhaAtuacao: 'Bebidas e Alimentos', contato: { telefone: '31 98888-0002', email: 'carlos@conveniencia.com' }, premium: false },
    { id: 'ret3', nomeFantasia: 'Empório Lago Azul', razaoSocial: 'Empório do João e Cia', cnpj: '10.101.010/0001-10',
      endereco: { logradouro: 'Travessa do Lago, 789', bairro: 'Centro', cidade: 'Curitiba', uf: 'PR', cep: '80020-000' },
      linhaAtuacao: 'Alimentos, Higiene e Limpeza', contato: { telefone: '41 97777-0003', email: 'joao@emporio.com' }, premium: false }
  ];

  // --- 2. Usuários ---
  const users = [
    { id: generateId(), email: 'ana@mercearia.com', password: '123', role: 'retail', actorId: 'ret1', displayName: 'Ana (Mercearia)' },
    { id: generateId(), email: 'carlos@conveniencia.com', password: '123', role: 'retail', actorId: 'ret2', displayName: 'Carlos (Conveniência)' },
    { id: generateId(), email: 'joao@emporio.com', password: '123', role: 'retail', actorId: 'ret3', displayName: 'João (Empório)' },
    { id: generateId(), email: 'contato@sulminas.com', password: '123', role: 'supplier', actorId: 'sup1', displayName: 'Contato (SulMinas)' },
    { id: generateId(), email: 'vendas@noroeste.com', password: '123', role: 'supplier', actorId: 'sup2', displayName: 'Vendas (Noroeste)' },
    { id: generateId(), email: 'alpha@supply.com', password: '123', role: 'supplier', actorId: 'sup3', displayName: 'Gerente (Alpha)' },
    { id: generateId(), email: 'bi@borealbebidas.com', password: '123', role: 'industry', actorId: 'ind1', displayName: 'BI (Boreal)' },
    { id: generateId(), email: 'dados@docevida.com', password: '123', role: 'industry', actorId: 'ind2', displayName: 'Dados (DoceVida)' },
    { id: generateId(), email: 'intel@limpmax.com', password: '123', role: 'industry', actorId: 'ind3', displayName: 'Intel (LimpMax)' },
    { id: generateId(), email: 'mkt@aurorahygiene.com', password: '123', role: 'industry', actorId: 'ind4', displayName: 'MKT (Aurora)' }
  ];

  // --- 3. Produtos (100 SKUs fixos) ---
  const products = [];

  // 25 bebidas
  const bebidas = [
    ["Refrigerante Boreal Cola 2L", "Refrigerantes", 8.50], ["Refrigerante Boreal Guaraná 2L", "Refrigerantes", 8.50],
    ["Água Mineral Boreal 500ml", "Água Mineral", 2.20], ["Suco Tropical Laranja 1L", "Sucos", 6.90],
    ["Suco Tropical Uva 1L", "Sucos", 6.90], ["Cerveja Boreal Pilsen 350ml", "Cervejas", 4.50],
    ["Cerveja Boreal Sem Álcool 350ml", "Cervejas", 4.30], ["Energético Voltagem 250ml", "Energéticos", 7.50],
    ["Chá Gelado Boreal Pêssego 1L", "Chás", 5.90], ["Chá Gelado Boreal Limão 1L", "Chás", 5.90],
    ["Água Tônica Boreal 350ml", "Refrigerantes", 4.20], ["Refrigerante Boreal Citrus 2L", "Refrigerantes", 8.70],
    ["Suco Boreal Manga 1L", "Sucos", 7.10], ["Suco Boreal Maçã 1L", "Sucos", 7.10],
    ["Água Mineral Boreal 1.5L", "Água Mineral", 3.80], ["Água com Gás Boreal 500ml", "Água Mineral", 2.80],
    ["Energético Voltagem 500ml", "Energéticos", 11.90], ["Cerveja Boreal Lager 600ml", "Cervejas", 7.90],
    ["Chá Verde Boreal 1L", "Chás", 6.20], ["Suco Integral Boreal Uva 1L", "Sucos", 10.90],
    ["Água Mineral Boreal Kids 300ml", "Água Mineral", 1.80], ["Refrigerante Boreal Limão 2L", "Refrigerantes", 8.40],
    ["Refrigerante Boreal Laranja 2L", "Refrigerantes", 8.40], ["Suco Boreal Abacaxi 1L", "Sucos", 7.50], ["Suco Boreal Maracujá 1L", "Sucos", 7.50]
  ];
  bebidas.forEach((p, i) => products.push({
    id: generateId(), sku: `BEV-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Bebidas", subcategoria: p[1], industryId: "ind1", precoSugerido: p[2], supplierIds: ["sup1"]
  }));

  // 25 alimentos
  const alimentos = [
    ["Macarrão Espaguete 500g", "Massas", 5.50], ["Macarrão Penne 500g", "Massas", 5.50],
    ["Arroz Branco Tipo 1 5kg", "Grãos", 22.90], ["Feijão Carioca 1kg", "Grãos", 8.90],
    ["Feijão Preto 1kg", "Grãos", 9.20], ["Biscoito Cream Cracker 200g", "Biscoitos", 3.80],
    ["Biscoito Recheado Chocolate 140g", "Biscoitos", 4.50], ["Biscoito Amanteigado 150g", "Biscoitos", 4.20],
    ["Molho de Tomate Tradicional 340g", "Molhos", 3.50], ["Molho de Tomate Temperado 340g", "Molhos", 4.10],
    ["Milho Verde Lata 170g", "Enlatados", 3.20], ["Ervilha Lata 170g", "Enlatados", 3.20],
    ["Atum em Óleo Lata 170g", "Enlatados", 9.90], ["Sardinha em Óleo Lata 125g", "Enlatados", 7.50],
    ["Açúcar Refinado 1kg", "Açúcares", 4.80], ["Açúcar Cristal 1kg", "Açúcares", 4.50],
    ["Café Torrado Moído 500g", "Cafés", 12.90], ["Café Solúvel 200g", "Cafés", 15.90],
    ["Farinha de Trigo 1kg", "Farinha", 5.50], ["Farinha de Milho 500g", "Farinha", 3.50],
    ["Sal Refinado 1kg", "Condimentos", 3.00], ["Óleo de Soja 900ml", "Óleos", 8.20],
    ["Azeite Extra Virgem 500ml", "Óleos", 28.90], ["Batata Palha 120g", "Snacks", 7.90], ["Amendoim Torrado 150g", "Snacks", 6.50]
  ];
  alimentos.forEach((p, i) => products.push({
    id: generateId(), sku: `ALI-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Alimentos", subcategoria: p[1], industryId: "ind2", precoSugerido: p[2], supplierIds: ["sup1","sup3"]
  }));

  // 25 limpeza
  const limpeza = [
    ["Detergente Neutro 500ml", "Detergentes", 3.20], ["Detergente Limão 500ml", "Detergentes", 3.20],
    ["Desinfetante Lavanda 2L", "Desinfetantes", 12.90], ["Desinfetante Pinho 2L", "Desinfetantes", 13.50],
    ["Água Sanitária 2L", "Cloro", 9.90], ["Sabão em Pó 1kg", "Sabão em Pó", 10.90],
    ["Amaciante 2L", "Amaciantes", 12.90], ["Limpador Multiuso 500ml", "Multiuso", 6.50],
    ["Limpador Perfumado 500ml", "Multiuso", 7.20], ["Álcool Líquido 1L", "Álcool", 5.90],
    ["Álcool em Gel 500ml", "Álcool", 9.50], ["Esponja Multiuso 4un", "Utensílios", 4.50],
    ["Sabão Barra 1kg", "Sabão em Barra", 8.90], ["Lustra Móveis 200ml", "Lustra Móveis", 6.90],
    ["Removedor de Gordura 500ml", "Removedores", 8.90], ["Desengordurante 500ml", "Removedores", 9.90],
    ["Saco de Lixo 50L 10un", "Descartáveis", 12.90], ["Saco de Lixo 100L 5un", "Descartáveis", 14.90],
    ["Água Sanitária Perfumada 2L", "Cloro", 11.50], ["Desinfetante Citrus 2L", "Desinfetantes", 12.50],
    ["Sabão Líquido 3L", "Sabão Líquido", 22.90], ["Amaciante Concentrado 1L", "Amaciantes", 15.90],
    ["Limpador de Piso 2L", "Multiuso", 14.50], ["Cloro Gel 1L", "Cloro", 10.90], ["Limpador Banheiro 500ml", "Multiuso", 7.90]
  ];
  limpeza.forEach((p, i) => products.push({
    id: generateId(), sku: `LIM-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Limpeza", subcategoria: p[1], industryId: "ind3", precoSugerido: p[2], supplierIds: ["sup2"]
  }));

  // 25 higiene
  const higiene = [
    ["Sabonete Neutro 90g", "Sabonetes", 2.50], ["Sabonete Erva Doce 90g", "Sabonetes", 2.70],
    ["Sabonete Lavanda 90g", "Sabonetes", 2.70], ["Shampoo 200ml", "Shampoo", 12.90],
    ["Condicionador 200ml", "Condicionador", 13.90], ["Pasta de Dente 90g", "Creme Dental", 4.50],
    // --- LISTA COMPLETADA AQUI ---
    ["Fio Dental 50m", "Higiene Bucal", 8.90], ["Enxaguante Bucal 250ml", "Higiene Bucal", 12.50],
    ["Desodorante Roll-On 50ml", "Desodorantes", 9.90], ["Desodorante Aerosol 150ml", "Desodorantes", 14.90],
    ["Papel Higiênico Folha Dupla 4un", "Papel Higiênico", 8.50], ["Papel Higiênico Folha Simples 4un", "Papel Higiênico", 6.50],
    ["Cotonetes 75un", "Cuidados Pessoais", 4.20], ["Algodão 50g", "Cuidados Pessoais", 3.80],
    ["Absorvente 8un", "Higiene Feminina", 7.50], ["Protetor Diário 20un", "Higiene Feminina", 6.90],
    ["Lâmina de Barbear 2un", "Barbearia", 5.50], ["Espuma de Barbear 150ml", "Barbearia", 18.90],
    ["Loção Pós-Barba 100ml", "Barbearia", 16.50], ["Hidratante Corporal 200ml", "Hidratantes", 11.90],
    ["Protetor Solar FPS 30 120ml", "Protetor Solar", 25.90], ["Repelente 100ml", "Repelentes", 13.50],
    ["Talco 100g", "Cuidados Pessoais", 8.20], ["Lenços Umedecidos 50un", "Cuidados Pessoais", 9.80]
  ];
  higiene.forEach((p, i) => products.push({
    id: generateId(), sku: `HIG-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Higiene", subcategoria: p[1], industryId: "ind4", precoSugerido: p[2], supplierIds: ["sup2", "sup3"]
  }));

  // --- 4. Clientes ---
  let clients = [];
  retailers.forEach(r => {
    for (let i = 1; i <= 15; i++) {
      clients.push({ id: generateId(), retailerId: r.id, nome: `Cliente ${i} da ${r.nomeFantasia}` });
    }
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
    const retailer = retailers[i % retailers.length];
    const invItem = inventory.filter(inv => inv.retailerId === retailer.id)[Math.floor(Math.random() * 40)];
    if (!invItem) continue; // Pula a iteração se não houver item de inventário (caso raro)
    const product = products.find(p => p.id === invItem.productId);
    const qtde = Math.floor(Math.random() * 3) + 1;
    const precoUnit = +(product.precoSugerido * (Math.random() * 0.2 + 0.9)).toFixed(2);
    let totalBruto = +(precoUnit * qtde).toFixed(2);
    const desconto = Math.random() < 0.15 ? +(totalBruto * 0.05).toFixed(2) : 0;
    const totalLiquido = +(totalBruto - desconto).toFixed(2);
    const day = Math.floor(Math.random() * 90);
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - day);
    sales.push({
      id: generateId(), retailerId: retailer.id, dataISO: saleDate.toISOString(), clienteId: clients.find(c => c.retailerId === retailer.id).id,
      itens: [{ productId: product.id, sku: product.sku, qtde, precoUnit }], totalBruto, desconto, totalLiquido,
      formaPagamento: formas[Math.floor(Math.random() * formas.length)]
    });
  }

// --- 7. Fundos ---
const dataFunds = [
  {
    id: 'fund1', nome: 'Fundo Padarias Centro-SP',
    descricao: 'Grupo de padarias e mercearias da região central de São Paulo.',
    categoriaPrincipal: 'Pães, frios e laticínios',
    ultimaPropostaValor: 15000,
    membrosCount: 20,
    status: 'Aberto',
    membros: [{ retailerId: 'ret1', rating: 'Ouro' }],
  },
  {
    id: 'fund2', nome: 'Fundo Conveniência Sul-BH/Curitiba',
    descricao: 'Lojas de conveniência selecionadas para análise de consumo de bebidas e snacks.',
    categoriaPrincipal: 'Bebidas e Snacks',
    ultimaPropostaValor: 22000,
    membrosCount: 15,
    status: 'Fechado',
    membros: [
      { retailerId: 'ret2', rating: 'Diamante' },
      { retailerId: 'ret3', rating: 'Prata' }
    ],
  }
];

// --- 8. Propostas + Transações ---
const proposals = [
  { id: generateId(), industryId: 'ind1', type: 'retailer', targetId: 'ret2', valorOfertadoBRL: 500, status: 'pendente', createdAt: new Date('2025-08-20T10:00:00Z').toISOString(), descricao: 'Dados de vendas de Energéticos - Últimos 30 dias.' },
  { id: generateId(), industryId: 'ind2', type: 'retailer', targetId: 'ret1', valorOfertadoBRL: 800, status: 'pendente', createdAt: new Date('2025-08-18T14:30:00Z').toISOString(), descricao: 'Dados de vendas da categoria de Biscoitos - Últimos 90 dias.' },
  { id: generateId(), industryId: 'ind4', type: 'retailer', targetId: 'ret3', valorOfertadoBRL: 300, status: 'pendente', createdAt: new Date('2025-08-22T11:00:00Z').toISOString(), descricao: 'Dados de vendas de Sabonetes - Últimos 30 dias.' },
  { id: generateId(), industryId: 'ind3', type: 'fund', targetId: 'fund2', valorOfertadoBRL: 2000, status: 'pendente', createdAt: new Date().toISOString(), descricao: 'Dados consolidados da categoria Limpeza.' },
  { id: generateId(), industryId: 'ind1', type: 'retailer', targetId: 'ret3', valorOfertadoBRL: 650, status: 'aceita', createdAt: new Date('2025-07-15T09:00:00Z').toISOString(), descricao: 'Dados de vendas de Cervejas - Últimos 60 dias.' },
  { id: generateId(), industryId: 'ind2', type: 'fund', targetId: 'fund1', valorOfertadoBRL: 1200, status: 'aceita', createdAt: new Date('2025-07-10T18:00:00Z').toISOString(), descricao: 'Dados consolidados da categoria Massas e Molhos.' },
  { id: generateId(), industryId: 'ind2', type: 'retailer', targetId: 'ret1', valorOfertadoBRL: 450, status: 'recusada', createdAt: new Date('2025-06-05T12:00:00Z').toISOString(), descricao: 'Dados de vendas da categoria de Enlatados.' },
];
  // --- Salvando ---
  setItem('users', users); setItem('retailers', retailers); setItem('suppliers', suppliers); setItem('industries', industries);
  setItem('products', products); setItem('clients', clients); setItem('inventory', inventory); setItem('sales', sales);
  setItem('dataFunds', dataFunds); setItem('proposals', proposals); setItem('transactions', transactions); setItem('settings', {});

  console.log("LocalStorage populado com sucesso!");
};