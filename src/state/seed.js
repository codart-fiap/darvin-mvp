// --- ARQUIVO: src/state/seed.js - VERSÃO EXPANDIDA MESCLADA ---
import { setItem } from './storage';
import { generateId } from '../utils/ids';
import logoBoreal from '../assets/images/logos/LogoBoreal.png';
import logoDoceVida from '../assets/images/logos/LogoDoceVida.png';
import logoLimpMax from '../assets/images/logos/LogoLimpMax.png';
import logoBelezaPura from '../assets/images/logos/logoBelezaPura.png'; // Este já estava correto


export const seedDatabase = () => {
  console.log("🌱 Populando o localStorage com dados EXPANDIDOS...");

  // --- 1. INDÚSTRIAS ---
  const industries = [
    {
      id: 'ind1', nomeFantasia: 'Boreal Bebidas S.A.', razaoSocial: 'Boreal Bebidas S.A.', cnpj: '11.111.111/0001-11',
      logo: logoBoreal,
      endereco: { logradouro: 'Av. Polar, 100', bairro: 'Centro', cidade: 'Campinas', uf: 'SP', cep: '13010-000' },
      linhaAtuacao: 'Bebidas', contato: { telefone: '19 4002-8922', email: 'bi@borealbebidas.com' }, premium: true
    },
    {
      id: 'ind2', nomeFantasia: 'DoceVida Alimentos', razaoSocial: 'DoceVida Indústria Alimentícia Ltda.', cnpj: '22.222.222/0001-22',
      logo: logoDoceVida,
      endereco: { logradouro: 'Rua das Glicínias, 250', bairro: 'Jardim Doce', cidade: 'Valinhos', uf: 'SP', cep: '13270-000' },
      linhaAtuacao: 'Alimentos', contato: { telefone: '19 3322-4455', email: 'contato@docevida.com' }, premium: false
    },
    {
      id: 'ind3', nomeFantasia: 'LimpMax Produtos', razaoSocial: 'LimpMax Indústria e Comércio Ltda.', cnpj: '33.444.555/0001-66',
      logo: logoLimpMax,
      endereco: { logradouro: 'Av. Industrial, 777', bairro: 'Polo Industrial', cidade: 'Jundiaí', uf: 'SP', cep: '13200-000' },
      linhaAtuacao: 'Limpeza', contato: { telefone: '11 3300-5566', email: 'vendas@limpmax.com' }, premium: true
    },
    {
      id: 'ind4', nomeFantasia: 'BelezaPura Cosméticos', razaoSocial: 'BelezaPura Ind. Cosméticos S.A.', cnpj: '44.555.666/0001-77',
      logo: logoBelezaPura,
      endereco: { logradouro: 'Rua das Flores, 333', bairro: 'Jardim Aroma', cidade: 'São Paulo', uf: 'SP', cep: '04567-000' },
      linhaAtuacao: 'Higiene Pessoal', contato: { telefone: '11 2200-4433', email: 'contato@belezapura.com' }, premium: false
    },
  ];

  // --- 2. VAREJOS (EXPANDIDO) ---
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
    { 
      id: 'ret3', nomeFantasia: 'Empório Santa Rosa', razaoSocial: 'Empório Santa Rosa Ltda', cnpj: '55.555.555/0001-55',
      endereco: { logradouro: 'Rua das Rosas, 123', bairro: 'Jardim Europa', cidade: 'Belo Horizonte', uf: 'MG', cep: '30130-000' },
      tipo: 'Empório', contato: { telefone: '31 99999-8888', email: 'carlos@santarosa.com' } 
    },
    { 
      id: 'ret4', nomeFantasia: 'Supermercado Família', razaoSocial: 'Supermercado Família Ltda', cnpj: '66.666.666/0001-66',
      endereco: { logradouro: 'Av. dos Trabalhadores, 2000', bairro: 'Industrial', cidade: 'Curitiba', uf: 'PR', cep: '80215-000' },
      tipo: 'Supermercado', contato: { telefone: '41 93333-4444', email: 'daniela@familia.com' } 
    },
  ];

  // --- 3. USUÁRIOS (EXPANDIDO) ---
  const users = [
    { id: generateId(), email: 'ana@mercearia.com', password: '123', role: 'retail', actorId: 'ret1', displayName: 'Ana (Bom Preço)' },
    { id: generateId(), email: 'bruno@mercadocentral.com', password: '123', role: 'retail', actorId: 'ret2', displayName: 'Bruno (Central)' },
    { id: generateId(), email: 'carlos@santarosa.com', password: '123', role: 'retail', actorId: 'ret3', displayName: 'Carlos (Santa Rosa)' },
    { id: generateId(), email: 'daniela@familia.com', password: '123', role: 'retail', actorId: 'ret4', displayName: 'Daniela (Família)' },
    { id: generateId(), email: 'bi@borealbebidas.com', password: '123', role: 'industry', actorId: 'ind1', displayName: 'BI (Boreal)' },
    { id: generateId(), email: 'contato@docevida.com', password: '123', role: 'industry', actorId: 'ind2', displayName: 'Gestor (DoceVida)' },
    { id: generateId(), email: 'vendas@limpmax.com', password: '123', role: 'industry', actorId: 'ind3', displayName: 'Vendas (LimpMax)' },
  ];

  // --- 4. PRODUTOS (85 PRODUTOS) ---
  const products = [];
  
  // BEBIDAS - Boreal (25 produtos)
  const bebidasBoreal = [
    ["Refrigerante Boreal Cola 2L", "Refrigerantes", "Boreal", 8.50, true],
    ["Refrigerante Boreal Cola Zero 2L", "Refrigerantes", "Boreal", 9.00, true],
    ["Refrigerante Boreal Guaraná 2L", "Refrigerantes", "Boreal", 8.50, true],
    ["Refrigerante Boreal Guaraná Zero 2L", "Refrigerantes", "Boreal", 9.00, false],
    ["Refrigerante Boreal Limão 2L", "Refrigerantes", "Boreal", 8.50, false],
    ["Refrigerante Boreal Laranja 2L", "Refrigerantes", "Boreal", 8.50, true],
    ["Refrigerante Boreal Uva 2L", "Refrigerantes", "Boreal", 8.50, false],
    ["Refrigerante Boreal Cola Lata 350ml", "Refrigerantes", "Boreal", 3.50, true],
    ["Refrigerante Boreal Guaraná Lata 350ml", "Refrigerantes", "Boreal", 3.50, true],
    ["Suco Boreal Laranja 1L", "Sucos", "Boreal", 6.20, true],
    ["Suco Boreal Uva 1L", "Sucos", "Boreal", 6.20, true],
    ["Suco Boreal Manga 1L", "Sucos", "Boreal", 6.20, false],
    ["Suco Boreal Maracujá 1L", "Sucos", "Boreal", 6.20, false],
    ["Suco Boreal Pêssego 1L", "Sucos", "Boreal", 6.20, false],
    ["Suco Boreal Mix Tropical 1L", "Sucos", "Boreal", 6.80, true],
    ["Água Mineral Boreal sem Gás 500ml", "Águas", "Boreal", 2.00, true],
    ["Água Mineral Boreal com Gás 500ml", "Águas", "Boreal", 2.50, true],
    ["Água Mineral Boreal sem Gás 1,5L", "Águas", "Boreal", 3.50, true],
    ["Água Mineral Boreal com Gás 1,5L", "Águas", "Boreal", 4.00, false],
    ["Água Saborizada Boreal Limão 500ml", "Águas", "Boreal", 3.20, false],
    ["Chá Gelado Boreal Limão 1L", "Chás", "Boreal", 5.50, true],
    ["Chá Gelado Boreal Pêssego 1L", "Chás", "Boreal", 5.50, true],
    ["Energético Boreal Energy 250ml", "Energéticos", "Boreal", 6.90, false],
    ["Isotônico Boreal Sport Laranja 500ml", "Isotônicos", "Boreal", 4.50, false],
    ["Isotônico Boreal Sport Limão 500ml", "Isotônicos", "Boreal", 4.50, false],
  ];

  bebidasBoreal.forEach((p, i) => {
    products.push({
      id: generateId(),
      sku: `BEB${String(i + 1).padStart(4, '0')}`,
      nome: p[0],
      categoria: "Bebidas",
      subcategoria: p[1],
      marca: p[2],
      industryId: "ind1",
      precoSugerido: p[3],
      popular: p[4]
    });
  });

  // ALIMENTOS - DoceVida (30 produtos)
  const alimentosDoceVida = [
    ["Biscoito DoceVida Recheado Chocolate 100g", "Biscoitos", "DoceVida", 4.50, true],
    ["Biscoito DoceVida Recheado Morango 100g", "Biscoitos", "DoceVida", 4.50, true],
    ["Biscoito DoceVida Recheado Baunilha 100g", "Biscoitos", "DoceVida", 4.50, false],
    ["Biscoito DoceVida Água e Sal 200g", "Biscoitos", "DoceVida", 3.80, true],
    ["Biscoito DoceVida Cream Cracker 200g", "Biscoitos", "DoceVida", 3.80, true],
    ["Biscoito DoceVida Maria 200g", "Biscoitos", "DoceVida", 3.50, true],
    ["Biscoito DoceVida Maisena 200g", "Biscoitos", "DoceVida", 3.50, false],
    ["Biscoito DoceVida Integral 200g", "Biscoitos", "DoceVida", 5.20, false],
    ["Macarrão DoceVida Espaguete 500g", "Massas", "DoceVida", 5.10, true],
    ["Macarrão DoceVida Parafuso 500g", "Massas", "DoceVida", 5.10, true],
    ["Macarrão DoceVida Penne 500g", "Massas", "DoceVida", 5.10, true],
    ["Macarrão DoceVida Talharim 500g", "Massas", "DoceVida", 5.30, false],
    ["Macarrão DoceVida Integral 500g", "Massas", "DoceVida", 6.80, false],
    ["Molho de Tomate DoceVida Tradicional 340g", "Molhos", "DoceVida", 3.20, true],
    ["Molho de Tomate DoceVida Picante 340g", "Molhos", "DoceVida", 3.50, false],
    ["Molho de Tomate DoceVida c/ Manjericão 340g", "Molhos", "DoceVida", 3.80, false],
    ["Extrato de Tomate DoceVida 140g", "Molhos", "DoceVida", 2.50, true],
    ["Café DoceVida Torrado e Moído 250g", "Café", "DoceVida", 12.90, true],
    ["Café DoceVida Torrado e Moído 500g", "Café", "DoceVida", 22.90, true],
    ["Café DoceVida Expresso 250g", "Café", "DoceVida", 15.90, false],
    ["Açúcar DoceVida Cristal 1kg", "Açúcar", "DoceVida", 4.50, true],
    ["Açúcar DoceVida Refinado 1kg", "Açúcar", "DoceVida", 5.20, true],
    ["Sal DoceVida Refinado 1kg", "Sal", "DoceVida", 2.80, true],
    ["Farinha de Trigo DoceVida 1kg", "Farinhas", "DoceVida", 5.90, true],
    ["Fubá DoceVida 500g", "Farinhas", "DoceVida", 3.50, false],
    ["Arroz DoceVida Tipo 1 - 1kg", "Arroz", "DoceVida", 6.80, true],
    ["Arroz DoceVida Tipo 1 - 5kg", "Arroz", "DoceVida", 32.90, true],
    ["Feijão DoceVida Carioca 1kg", "Feijão", "DoceVida", 8.90, true],
    ["Feijão DoceVida Preto 1kg", "Feijão", "DoceVida", 8.90, true],
    ["Óleo de Soja DoceVida 900ml", "Óleos", "DoceVida", 7.50, true],
  ];

  alimentosDoceVida.forEach((p, i) => {
    products.push({
      id: generateId(),
      sku: `ALI${String(i + 1).padStart(4, '0')}`,
      nome: p[0],
      categoria: "Alimentos",
      subcategoria: p[1],
      marca: p[2],
      industryId: "ind2",
      precoSugerido: p[3],
      popular: p[4]
    });
  });

  // LIMPEZA - LimpMax (15 produtos)
  const limpezaLimpMax = [
    ["Detergente LimpMax Limão 500ml", "Detergentes", "LimpMax", 2.50, true],
    ["Detergente LimpMax Coco 500ml", "Detergentes", "LimpMax", 2.50, true],
    ["Detergente LimpMax Neutro 500ml", "Detergentes", "LimpMax", 2.50, false],
    ["Sabão em Pó LimpMax 1kg", "Sabão em Pó", "LimpMax", 12.90, true],
    ["Sabão em Pó LimpMax 2kg", "Sabão em Pó", "LimpMax", 24.90, true],
    ["Amaciante LimpMax Lavanda 2L", "Amaciantes", "LimpMax", 8.90, true],
    ["Amaciante LimpMax Baby 2L", "Amaciantes", "LimpMax", 9.90, false],
    ["Água Sanitária LimpMax 1L", "Água Sanitária", "LimpMax", 3.50, true],
    ["Desinfetante LimpMax Lavanda 500ml", "Desinfetantes", "LimpMax", 4.50, true],
    ["Desinfetante LimpMax Pinho 500ml", "Desinfetantes", "LimpMax", 4.50, true],
    ["Limpador Multiuso LimpMax 500ml", "Limpadores", "LimpMax", 5.90, true],
    ["Limpa Vidros LimpMax 500ml", "Limpadores", "LimpMax", 6.50, false],
    ["Esponja LimpMax Dupla Face c/ 3un", "Esponjas", "LimpMax", 3.90, true],
    ["Pano de Limpeza LimpMax c/ 3un", "Panos", "LimpMax", 5.50, false],
    ["Luva de Látex LimpMax M", "Luvas", "LimpMax", 7.90, false],
  ];

  limpezaLimpMax.forEach((p, i) => {
    products.push({
      id: generateId(),
      sku: `LMP${String(i + 1).padStart(4, '0')}`,
      nome: p[0],
      categoria: "Limpeza",
      subcategoria: p[1],
      marca: p[2],
      industryId: "ind3",
      precoSugerido: p[3],
      popular: p[4]
    });
  });

  // HIGIENE PESSOAL - BelezaPura (15 produtos)
  const higieneBelezaPura = [
    ["Sabonete BelezaPura Suave 90g", "Sabonetes", "BelezaPura", 2.50, true],
    ["Sabonete BelezaPura Hidratante 90g", "Sabonetes", "BelezaPura", 2.80, true],
    ["Sabonete BelezaPura Ervas 90g", "Sabonetes", "BelezaPura", 2.50, false],
    ["Shampoo BelezaPura Anticaspa 350ml", "Shampoos", "BelezaPura", 12.90, true],
    ["Shampoo BelezaPura Hidratação 350ml", "Shampoos", "BelezaPura", 12.90, true],
    ["Condicionador BelezaPura Hidratação 350ml", "Condicionadores", "BelezaPura", 12.90, true],
    ["Creme Dental BelezaPura Branqueador 90g", "Creme Dental", "BelezaPura", 4.50, true],
    ["Creme Dental BelezaPura Tripla Ação 90g", "Creme Dental", "BelezaPura", 4.50, true],
    ["Desodorante BelezaPura Aerosol 150ml", "Desodorantes", "BelezaPura", 8.90, true],
    ["Desodorante BelezaPura Roll-on 50ml", "Desodorantes", "BelezaPura", 7.50, false],
    ["Papel Higiênico BelezaPura 12 rolos", "Papel Higiênico", "BelezaPura", 14.90, true],
    ["Papel Toalha BelezaPura 2 rolos", "Papel Toalha", "BelezaPura", 6.50, true],
    ["Lenço Umedecido BelezaPura 48un", "Lenços", "BelezaPura", 5.90, false],
    ["Cotonete BelezaPura 75un", "Cotonetes", "BelezaPura", 3.50, false],
    ["Algodão BelezaPura 50g", "Algodão", "BelezaPura", 4.20, false],
  ];

  higieneBelezaPura.forEach((p, i) => {
    products.push({
      id: generateId(),
      sku: `HIG${String(i + 1).padStart(4, '0')}`,
      nome: p[0],
      categoria: "Higiene Pessoal",
      subcategoria: p[1],
      marca: p[2],
      industryId: "ind4",
      precoSugerido: p[3],
      popular: p[4]
    });
  });

  console.log(`✅ ${products.length} produtos criados`);

  // --- 5. CLIENTES (EXPANDIDO - 50 por varejista) ---
  const clients = [];
  const nomesMasculinos = ["João", "Pedro", "Carlos", "Lucas", "José", "Rafael", "Paulo", "André", "Gustavo", "Fábio", "Roberto", "Fernando", "Marcos", "Daniel", "Eduardo"];
  const nomesFemininos = ["Maria", "Ana", "Fernanda", "Mariana", "Patrícia", "Beatriz", "Carla", "Roberta", "Larissa", "Juliana", "Cristina", "Sandra", "Gabriela", "Luciana", "Adriana"];
  const sobrenomes = ["Silva", "Santos", "Oliveira", "Costa", "Souza", "Lima", "Alves", "Rocha", "Pereira", "Mendes", "Ferreira", "Rodrigues", "Martins", "Araújo", "Ribeiro"];
  const habitos = ["Compra Semanal", "Fim de Semana", "Noturno", "Ocasional", "Promocional", "Diário"];

  retailers.forEach(r => {
    // Consumidor final sempre presente
    clients.push({ 
      id: 'consumidor_final_' + r.id, 
      retailerId: r.id, 
      nome: 'Consumidor Final',
      sexo: 'Não informado',
      idade: null,
      habitoCompra: 'Ocasional'
    });
    
    // 50 clientes por varejista
    for (let i = 0; i < 50; i++) {
        const sexo = Math.random() > 0.5 ? 'Masculino' : 'Feminino';
        const nome = sexo === 'Masculino' 
            ? nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)]
            : nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
        const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
        
        clients.push({ 
            id: generateId(), 
            retailerId: r.id, 
            nome: `${nome} ${sobrenome}`,
            sexo: sexo,
            idade: Math.floor(Math.random() * 55) + 18, // 18 a 72 anos
            habitoCompra: habitos[Math.floor(Math.random() * habitos.length)]
        });
    }
  });

  console.log(`✅ ${clients.length} clientes criados`);

  // --- 6. ESTOQUE ---
  const inventory = [];
  retailers.forEach(retailer => {
    products.forEach((product) => {
      const estoqueInicial = Math.floor(Math.random() * 150) + 30; // 30 a 180
      const custoMedio = +(product.precoSugerido * 0.70).toFixed(2);
      const precoVenda = +(product.precoSugerido * 1.22).toFixed(2);
      
      const validade = new Date();
      const daysUntilExpiry = product.categoria === 'Bebidas' 
        ? Math.floor(Math.random() * 90) + 20 
        : Math.floor(Math.random() * 365) + 60;
      validade.setDate(validade.getDate() + daysUntilExpiry);
      
      inventory.push({
        id: generateId(),
        retailerId: retailer.id,
        productId: product.id,
        sku: product.sku,
        nome: product.nome,
        categoria: product.categoria,
        subcategoria: product.subcategoria,
        marca: product.marca,
        industryId: product.industryId,
        estoque: estoqueInicial,
        custoMedio: custoMedio,
        precoVenda: precoVenda,
        precoSugerido: product.precoSugerido,
        dataValidade: validade.toISOString()
      });
    });
  });

  console.log(`✅ ${inventory.length} itens de estoque criados`);

  // --- 7. VENDAS (4000 VENDAS!) ---
  const sales = [];
  const formasPagamento = ["Dinheiro", "Cartão de Débito", "Cartão de Crédito", "Pix"];
  
  for (let i = 0; i < 4000; i++) {
    const retailer = retailers[Math.floor(Math.random() * retailers.length)];
    const retailerInventory = inventory.filter(inv => inv.retailerId === retailer.id && inv.estoque > 0);
    const retailerClients = clients.filter(c => c.retailerId === retailer.id);
    
    if (retailerInventory.length === 0) continue;

    const qtdeItens = Math.floor(Math.random() * 6) + 1; // 1 a 6 itens
    const itensVenda = [];
    let totalBruto = 0;

    for (let j = 0; j < qtdeItens; j++) {
      let itemToSell;
      
      // 70% de chance de vender produtos populares
      if (Math.random() < 0.7) {
        const popularItems = retailerInventory.filter(inv => 
          products.find(p => p.id === inv.productId)?.popular
        );
        if (popularItems.length > 0) {
          itemToSell = popularItems[Math.floor(Math.random() * popularItems.length)];
        }
      }
      
      if (!itemToSell) {
        itemToSell = retailerInventory[Math.floor(Math.random() * retailerInventory.length)];
      }

      const qtde = Math.floor(Math.random() * 5) + 1; // 1 a 5 unidades
      
      itensVenda.push({ 
        productId: itemToSell.productId, 
        sku: itemToSell.sku, 
        qtde, 
        precoUnit: itemToSell.precoVenda 
      });

      totalBruto += itemToSell.precoVenda * qtde;
    }

    // Desconto para compras acima de R$ 80
    const desconto = totalBruto > 80 
      ? +(totalBruto * (Math.random() * 0.10)).toFixed(2)
      : 0;

    const formaPagamento = formasPagamento[Math.floor(Math.random() * formasPagamento.length)];
    
    // Distribuir vendas nos últimos 240 dias (8 meses)
    const saleDate = new Date();
    const daysAgo = Math.floor(Math.random() * 240);
    saleDate.setDate(saleDate.getDate() - daysAgo);

    // Aumentar vendas em fins de semana
    if (saleDate.getDay() === 0 || saleDate.getDay() === 6) {
      if (Math.random() < 0.5) {
        const extraItem = retailerInventory[Math.floor(Math.random() * retailerInventory.length)];
        itensVenda.push({ 
          productId: extraItem.productId, 
          sku: extraItem.sku, 
          qtde: Math.floor(Math.random() * 2) + 1, 
          precoUnit: extraItem.precoVenda 
        });
        totalBruto += extraItem.precoVenda * itensVenda[itensVenda.length - 1].qtde;
      }
    }

    // 65% identificados com perfil, 35% consumidor final
    // Clientes com hábito "Compra Semanal" e "Diário" compram mais frequentemente
    let cliente;
    const namedClients = retailerClients.filter(c => c.id !== 'consumidor_final_' + retailer.id);
    
    if (Math.random() > 0.35 && namedClients.length > 0) {
        // Preferência por clientes com hábitos frequentes
        const frequentBuyers = namedClients.filter(c => 
            c.habitoCompra === 'Compra Semanal' || 
            c.habitoCompra === 'Diário' ||
            c.habitoCompra === 'Fim de Semana'
        );
        
        if (frequentBuyers.length > 0 && Math.random() > 0.3) {
            cliente = frequentBuyers[Math.floor(Math.random() * frequentBuyers.length)].id;
        } else {
            cliente = namedClients[Math.floor(Math.random() * namedClients.length)].id;
        }
    } else {
        cliente = 'consumidor_final_' + retailer.id;
    }

    sales.push({
      id: generateId(),
      retailerId: retailer.id,
      dataISO: saleDate.toISOString(),
      clienteId: cliente,
      itens: itensVenda,
      totalBruto: +totalBruto.toFixed(2),
      desconto: desconto,
      totalLiquido: +(totalBruto - desconto).toFixed(2),
      formaPagamento: formaPagamento
    });
  }

  console.log(`✅ ${sales.length} vendas criadas`);

  // --- 7.5. HISTÓRICO DE COMPRAS POR CLIENTE (NOVO!) ---
  const customerPurchaseHistory = {};
  
  sales.forEach(sale => {
    if (sale.clienteId && !sale.clienteId.startsWith('consumidor_final')) {
      if (!customerPurchaseHistory[sale.clienteId]) {
        customerPurchaseHistory[sale.clienteId] = {
          clientId: sale.clienteId,
          totalPurchases: 0,
          totalSpent: 0,
          favoriteProducts: {},
          favoriteCategories: {},
          averageTicket: 0,
          firstPurchase: sale.dataISO,
          lastPurchase: sale.dataISO,
          purchases: []
        };
      }
      
      const history = customerPurchaseHistory[sale.clienteId];
      history.totalPurchases++;
      history.totalSpent += sale.totalLiquido;
      history.lastPurchase = sale.dataISO;
      
      if (new Date(sale.dataISO) < new Date(history.firstPurchase)) {
        history.firstPurchase = sale.dataISO;
      }
      
      // Registra produtos favoritos
      sale.itens.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          history.favoriteProducts[product.nome] = (history.favoriteProducts[product.nome] || 0) + item.qtde;
          history.favoriteCategories[product.categoria] = (history.favoriteCategories[product.categoria] || 0) + item.qtde;
        }
      });
      
      history.purchases.push({
        date: sale.dataISO,
        total: sale.totalLiquido,
        items: sale.itens.length
      });
    }
  });
  
  // Calcula ticket médio e ordena favoritos
  Object.values(customerPurchaseHistory).forEach(history => {
    history.averageTicket = history.totalSpent / history.totalPurchases;
    
    // Converte favoritos em arrays ordenados
    history.topProducts = Object.entries(history.favoriteProducts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qtde]) => ({ name, qtde }));
    
    history.topCategories = Object.entries(history.favoriteCategories)
      .sort((a, b) => b[1] - a[1])
      .map(([name, qtde]) => ({ name, qtde }));
    
    delete history.favoriteProducts;
    delete history.favoriteCategories;
  });

  console.log(`✅ ${Object.keys(customerPurchaseHistory).length} históricos de clientes criados`);

  // --- 8. PROGRAMAS DE INCENTIVO ---
  const programs = [
    {
      id: 'prog1',
      industryId: 'ind1',
      title: 'Campanha "Verão Refrescante"',
      tags: ['Desafio de Vendas', 'Bebidas'],
      description: 'Aumente suas vendas de refrigerantes e sucos e ganhe bônus em dinheiro.',
      rules: 'Para participar, você deve aumentar em 20% o volume de vendas (em unidades) de todos os refrigerantes e sucos da Boreal em comparação com os 30 dias anteriores ao início da campanha.',
      reward: 'Bonificação de R$ 300,00 creditada na sua conta.',
      startDate: '2025-10-01T00:00:00.000Z',
      endDate: '2025-12-31T23:59:59.000Z',
      minRating: 'C',
      metric: {
        type: 'percentual_venda_categoria',
        categories: ['Refrigerantes', 'Sucos'],
        target: 1.20
      }
    },
    {
      id: 'prog2',
      industryId: 'ind2',
      title: 'Campanha "Doce Prateleira"',
      tags: ['Bônus por Compra', 'Alimentos'],
      description: 'Compre uma quantidade específica de biscoitos e ganhe unidades grátis.',
      rules: 'A cada 10 caixas de qualquer biscoito DoceVida compradas, você ganha 1 caixa do Biscoito Recheado de Chocolate grátis no próximo pedido.',
      reward: '1 caixa de Biscoito Recheado Chocolate grátis.',
      startDate: '2025-09-15T00:00:00.000Z',
      endDate: '2025-11-15T23:59:59.000Z',
      minRating: '',
      metric: {
        type: 'volume_compra_categoria',
        categories: ['Biscoitos'],
        target: 10
      }
    },
    {
      id: 'prog3',
      industryId: 'ind3',
      title: 'Faxina Premiada LimpMax',
      tags: ['Desafio de Vendas', 'Limpeza'],
      description: 'Venda o novo Sabão em Pó LimpMax e concorra a prêmios.',
      rules: 'Venda 50 unidades do Sabão em Pó LimpMax 1kg durante o período da campanha para se qualificar.',
      reward: 'Um kit exclusivo de produtos LimpMax avaliado em R$ 200,00.',
      startDate: '2025-10-01T00:00:00.000Z',
      endDate: '2025-11-30T23:59:59.000Z',
      minRating: 'B',
      metric: {
        type: 'volume_venda_sku',
        sku: 'LMP0004',
        target: 50
      }
    },
    {
      id: 'prog4',
      industryId: 'ind4',
      title: 'Lançamento BelezaPura Hidratação',
      tags: ['Lançamento', 'Higiene'],
      description: 'Compre e venda a nova linha de Shampoos e Condicionadores para ganhar visibilidade extra.',
      rules: 'Compre no mínimo 10 unidades do Shampoo e 10 do Condicionador da linha Hidratação e venda pelo menos 5 de cada.',
      reward: 'Sua loja será destacada em nossas redes sociais como um ponto de venda oficial.',
      startDate: '2025-11-01T00:00:00.000Z',
      endDate: '2025-12-15T23:59:59.000Z',
      minRating: '',
      metric: {
        type: 'mix_produtos',
        skus: { 'HIG0005': 5, 'HIG0006': 5 },
        target: 1
      }
    },
    {
      id: 'prog5',
      industryId: 'ind1',
      title: 'Mega Desconto Boreal',
      tags: ['Promoção', 'Bebidas'],
      description: 'Compre em volume e ganhe desconto progressivo.',
      rules: 'Compras acima de 100 unidades de qualquer produto Boreal ganham 5% de desconto. Acima de 200 unidades, 10% de desconto.',
      reward: 'Desconto de 5% a 10% no próximo pedido.',
      startDate: '2025-10-15T00:00:00.000Z',
      endDate: '2025-12-31T23:59:59.000Z',
      minRating: 'A',
      metric: {
        type: 'volume_compra_marca',
        marca: 'Boreal',
        target: 100
      }
    },
    {
      id: 'prog6',
      industryId: 'ind2',
      title: 'Combo Café da Manhã DoceVida',
      tags: ['Combo', 'Alimentos'],
      description: 'Venda mais combos de café da manhã e ganhe bonificação.',
      rules: 'Para cada combo vendido contendo Café + Biscoito + Açúcar DoceVida, acumule pontos. 30 pontos = R$ 50 em crédito.',
      reward: 'R$ 50 em crédito a cada 30 combos vendidos.',
      startDate: '2025-09-01T00:00:00.000Z',
      endDate: '2025-11-30T23:59:59.000Z',
      minRating: '',
      metric: {
        type: 'combo_venda',
        skus: ['ALI0018', 'ALI0001', 'ALI0021'],
        target: 30
      }
    }
  ];

  console.log(`✅ ${programs.length} programas de incentivo criados`);

  // --- 9. INSCRIÇÕES NOS PROGRAMAS (ALGUNS VAREJOS JÁ INSCRITOS) ---
  const programSubscriptions = [
    {
      id: generateId(),
      programId: 'prog1',
      retailerId: 'ret1',
      subscriptionDate: '2025-10-02T10:00:00.000Z',
      status: 'active'
    },
    {
      id: generateId(),
      programId: 'prog1',
      retailerId: 'ret2',
      subscriptionDate: '2025-10-03T14:30:00.000Z',
      status: 'active'
    },
    {
      id: generateId(),
      programId: 'prog2',
      retailerId: 'ret1',
      subscriptionDate: '2025-09-16T09:00:00.000Z',
      status: 'active'
    },
    {
      id: generateId(),
      programId: 'prog3',
      retailerId: 'ret3',
      subscriptionDate: '2025-10-01T11:00:00.000Z',
      status: 'active'
    },
    {
      id: generateId(),
      programId: 'prog5',
      retailerId: 'ret2',
      subscriptionDate: '2025-10-16T08:00:00.000Z',
      status: 'active'
    },
    {
      id: generateId(),
      programId: 'prog5',
      retailerId: 'ret4',
      subscriptionDate: '2025-10-17T15:00:00.000Z',
      status: 'active'
    }
  ];

  console.log(`✅ ${programSubscriptions.length} inscrições em programas criadas`);

  // --- 10. SALVANDO TUDO NO LOCALSTORAGE ---
  setItem('users', users);
  setItem('retailers', retailers);
  setItem('industries', industries);
  setItem('products', products);
  setItem('clients', clients);
  setItem('inventory', inventory);
  setItem('sales', sales);
  setItem('programs', programs);
  setItem('programSubscriptions', programSubscriptions);
  setItem('customerPurchaseHistory', Object.values(customerPurchaseHistory)); // NOVO
  setItem('settings', {});

  console.log("✅ Banco de dados populado com sucesso!");
  console.log(`📊 Resumo:`);
  console.log(`   - ${industries.length} indústrias`);
  console.log(`   - ${retailers.length} varejos`);
  console.log(`   - ${users.length} usuários`);
  console.log(`   - ${products.length} produtos`);
  console.log(`   - ${clients.length} clientes`);
  console.log(`   - ${inventory.length} itens em estoque`);
  console.log(`   - ${sales.length} vendas`);
  console.log(`   - ${programs.length} programas de incentivo`);
  console.log(`   - ${programSubscriptions.length} inscrições em programas`);
  console.log(`   - ${Object.keys(customerPurchaseHistory).length} históricos de clientes`);
};