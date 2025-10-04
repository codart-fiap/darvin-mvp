// --- ARQUIVO: src/state/seed.js ---
import { setItem } from './storage';
import { generateId } from '../utils/ids';

export const seedDatabase = () => {
  console.log("Populando o localStorage com dados iniciais...");

  const industries = [
    {
      id: 'ind1', nomeFantasia: 'Boreal Bebidas S.A.', razaoSocial: 'Boreal Bebidas S.A.', cnpj: '11.111.111/0001-11',
      endereco: { logradouro: 'Av. Polar, 100', bairro: 'Centro', cidade: 'Campinas', uf: 'SP', cep: '13010-000' },
      linhaAtuacao: 'Bebidas', contato: { telefone: '19 4002-8922', email: 'bi@borealbebidas.com' }, premium: true
    },
    {
      id: 'ind2', nomeFantasia: 'DoceVida Alimentos', razaoSocial: 'DoceVida Indústria Alimentícia Ltda.', cnpj: '22.222.222/0001-22',
      endereco: { logradouro: 'Rua das Glicínias, 250', bairro: 'Jardim Doce', cidade: 'Valinhos', uf: 'SP', cep: '13270-000' },
      linhaAtuacao: 'Alimentos', contato: { telefone: '19 3322-4455', email: 'contato@docevida.com' }, premium: false
    },
  ];

  const retailers = [
    { 
      id: 'ret1', nomeFantasia: 'Mercearia Bom Preço', razaoSocial: 'Mercearia Bom Preço Ltda ME', cnpj: '33.333.333/0001-33',
      endereco: { logradouro: 'Rua da Esquina, 10', bairro: 'Vila Nova', cidade: 'São Paulo', uf: 'SP', cep: '01010-010' },
      tipo: 'Mercearia', contato: { telefone: '11 98765-4321', email: 'ana@mercearia.com' } 
    },
    { 
      id: 'ret2', nomeFantasia: 'Mercado Central', razaoSocial: 'Mercado Central S.A.', cnpj: '44.444.444/0001-44',
      endereco: { logradouro: 'Avenida Principal, 500', bairro: 'Centro', cidade: 'Rio de Janeiro', uf: 'RJ', cep: '20040-000' },
      tipo: 'Supermercado', contato: { telefone: '21 91234-5678', email: 'bruno@mercadocentral.com' } 
    },
  ];

  const users = [
    { id: generateId(), email: 'ana@mercearia.com', password: '123', role: 'retail', actorId: 'ret1', displayName: 'Ana (Bom Preço)' },
    { id: generateId(), email: 'bruno@mercadocentral.com', password: '123', role: 'retail', actorId: 'ret2', displayName: 'Bruno (Central)' },
    { id: generateId(), email: 'bi@borealbebidas.com', password: '123', role: 'industry', actorId: 'ind1', displayName: 'BI (Boreal)' },
  ];

  const products = [];
  const bebidas = [
    ["Refrigerante Boreal Cola 2L", "Refrigerantes", 8.50], ["Refrigerante Boreal Guaraná 2L", "Refrigerantes", 8.50],
    ["Suco Boreal Laranja 1L", "Sucos", 6.20], ["Suco Boreal Uva 1L", "Sucos", 6.20],
    ["Água Mineral Boreal com Gás 500ml", "Águas", 2.50], ["Água Mineral Boreal sem Gás 500ml", "Águas", 2.00],
  ];
  bebidas.forEach((p, i) => products.push({
    id: generateId(), sku: `BEV-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Bebidas", subcategoria: p[1], industryId: "ind1", precoSugerido: p[2]
  }));

  const alimentos = [
    ["Biscoito DoceVida Recheado Chocolate 100g", "Biscoitos", 4.50], ["Biscoito DoceVida Água e Sal 200g", "Biscoitos", 3.80],
    ["Macarrão DoceVida Espaguete 500g", "Massas", 5.10], ["Molho de Tomate DoceVida Tradicional 340g", "Molhos", 3.20],
  ];
  alimentos.forEach((p, i) => products.push({
    id: generateId(), sku: `ALI-${i+1}`.padStart(7,"0"), nome: p[0], categoria: "Alimentos", subcategoria: p[1], industryId: "ind2", precoSugerido: p[2]
  }));

  let clients = [];
  retailers.forEach(r => {
    for (let i = 1; i <= 15; i++) {
      clients.push({ id: generateId(), retailerId: r.id, nome: `Cliente ${i} (${r.nomeFantasia})` });
    }
  });

  let inventory = [];
  retailers.forEach(r => {
    const sample = products.sort(() => 0.5 - Math.random()).slice(0, 8);
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

  let sales = [];
  for (let i = 0; i < 400; i++) {
    const retailer = retailers[Math.floor(Math.random() * retailers.length)];
    const retailerInventory = inventory.filter(inv => inv.retailerId === retailer.id && inv.estoque > 0);
    if(retailerInventory.length === 0) continue;

    const itemToSell = retailerInventory[Math.floor(Math.random() * retailerInventory.length)];
    const productInfo = products.find(p => p.id === itemToSell.productId);
    const qtde = Math.floor(Math.random() * 5) + 1;
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 90));

    const sale = {
        id: generateId(),
        retailerId: retailer.id,
        dataISO: saleDate.toISOString(),
        clienteId: 'consumidor_final',
        itens: [{ productId: itemToSell.productId, sku: productInfo.sku, qtde, precoUnit: itemToSell.precoVenda }],
        totalBruto: itemToSell.precoVenda * qtde,
        desconto: 0,
        totalLiquido: itemToSell.precoVenda * qtde,
        formaPagamento: "Dinheiro"
    };
    sales.push(sale);
  }
  
  setItem('users', users); 
  setItem('retailers', retailers); 
  setItem('industries', industries);
  setItem('products', products); 
  setItem('clients', clients); 
  setItem('inventory', inventory); 
  setItem('sales', sales);
  setItem('settings', {});

  console.log("LocalStorage populado com sucesso!");
};