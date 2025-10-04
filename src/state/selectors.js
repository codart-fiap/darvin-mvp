// --- ARQUIVO: src/state/selectors.js ---
// --- TECNOLOGIA: JavaScript ---

import { getItem } from './storage';

// ✅ CORREÇÃO APLICADA AQUI
// A função agora busca pela chave correta ("retailers" ou "industries").
export const getActorsByType = (actorType) => {
    const key = actorType === 'retail' ? 'retailers' : 'industries';
    const items = getItem(key);
    return items || [];
}

// Busca os dados de um "ator" (varejista, etc.) específico pelo seu ID.
export const getActorData = (actorId, actorType) => {
    const items = getItem(`${actorType}s`);
    return items?.find(item => item.id === actorId) || null;
}

// Busca todas as vendas de um varejista específico.
export const getSalesByRetailer = (retailerId) => {
    const sales = getItem('sales') || [];
    return sales.filter(s => s.retailerId === retailerId);
}

// --- FUNÇÕES ESPECÍFICAS PARA O VAREJO ---

// Busca o inventário de um varejista e adiciona informações dos produtos e das marcas.
export const getInventoryByRetailer = (retailerId) => {
    const inventory = getItem('inventory') || [];
    const products = getItem('products') || [];
    const industries = getItem('industries') || [];

    const retailerInventory = inventory.filter(item => item.retailerId === retailerId);
    
    return retailerInventory.map(item => {
        const product = products.find(p => p.id === item.productId);
        const industry = industries.find(ind => ind.id === product?.industryId);
        return { 
            ...product,
            ...item,
            marca: industry ? industry.nomeFantasia : 'Marca Desconhecida'
        };
    });
}

// Busca todos os clientes de um varejista.
export const getClientsByRetailer = (retailerId) => {
    const clients = getItem('clients') || [];
    return clients.filter(c => c.retailerId === retailerId);
} 

// Função complexa que calcula todos os dados para o Dashboard.
export const getDashboardData = (retailerId, periodInDays) => {
    const allSales = getItem('sales') || [];
    const products = getItem('products') || [];
    const industries = getItem('industries') || [];

    const periodEndDate = new Date();
    const periodStartDate = new Date();
    periodStartDate.setDate(periodStartDate.getDate() - periodInDays);

    const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.dataISO);
        return sale.retailerId === retailerId && saleDate >= periodStartDate && saleDate <= periodEndDate;
    });

    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.totalLiquido, 0);
    const numberOfSales = filteredSales.length;
    const averageTicket = numberOfSales > 0 ? totalRevenue / numberOfSales : 0;

    const salesByDay = filteredSales.reduce((acc, sale) => {
        const day = new Date(sale.dataISO).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!acc[day]) acc[day] = 0;
        acc[day] += sale.totalLiquido;
        return acc;
    }, {});
    const salesByDayChartData = Object.keys(salesByDay).map(day => ({ name: day, Receita: salesByDay[day] })).sort((a, b) => a.name.localeCompare(b.name));

    const revenueByCategory = filteredSales.reduce((acc, sale) => {
        sale.itens.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                if (!acc[product.categoria]) acc[product.categoria] = 0;
                acc[product.categoria] += (item.qtde * item.precoUnit);
            }
        });
        return acc;
    }, {});

    const revenueByCategoryChartData = Object.keys(revenueByCategory).map(cat => ({ 
        name: cat, 
        Receita: parseFloat(revenueByCategory[cat].toFixed(2)) 
    }));
    
    const productSales = filteredSales.reduce((acc, sale) => {
        sale.itens.forEach(item => {
            if (!acc[item.productId]) {
                const product = products.find(p => p.id === item.productId);
                const industry = industries.find(ind => ind.id === product?.industryId);
                acc[item.productId] = { 
                    name: product?.nome || 'Desconhecido', 
                    marca: industry?.nomeFantasia || 'N/A',
                    qtde: 0 
                };
            }
            acc[item.productId].qtde += item.qtde;
        });
        return acc;
    }, {});
    
    const top5Products = Object.values(productSales).sort((a, b) => b.qtde - a.qtde).slice(0, 5);

    return {
        kpis: { totalRevenue, numberOfSales, averageTicket },
        charts: { salesByDay: salesByDayChartData, revenueByCategory: revenueByCategoryChartData },
        tables: { top5Products }
    };
}
    
// Converte um texto de linguagem natural em itens de carrinho.
export const parseTextToCart = (text, inventory) => {
    const cleanedText = text.toLowerCase().replace(/vendi/g, '').trim();
    const parts = cleanedText.split(/ e |,| e,|, e/);
    const cartItems = [];
    const notFound = [];

    parts.forEach(part => {
        const trimmedPart = part.trim();
        if (trimmedPart === '') return;
        const match = trimmedPart.match(/^(\d+)\s+(.*)/);
        let qty = 1;
        let searchTerm = trimmedPart;
        if (match) {
            qty = parseInt(match[1], 10);
            searchTerm = match[2].trim();
        }
        const foundProduct = inventory.find(item => 
            item.nome.toLowerCase().includes(searchTerm) && item.estoque > 0
        );
        if (foundProduct) {
            const finalQty = Math.min(qty, foundProduct.estoque);
            const existingItem = cartItems.find(ci => ci.productId === foundProduct.productId);
            if (existingItem) {
                existingItem.qtde += finalQty;
            } else {
                cartItems.push({ ...foundProduct, qtde: finalQty, precoUnit: foundProduct.precoSugerido });
            }
        } else {
            notFound.push(trimmedPart);
        }
    });
    return { items: cartItems, notFound: notFound };
}

// Gera insights e recomendações para o Assistente de Performance.
export const getRetailerInsights = (retailerId) => {
    const insights = [];
    const allSales = getItem('sales') || [];
    const inventory = getInventoryByRetailer(retailerId);
    const retailers = getItem('retailers') || [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = allSales.filter(s => s.retailerId === retailerId && new Date(s.dataISO) >= thirtyDaysAgo);
    
    inventory.forEach(item => {
        const salesOfItem = recentSales.flatMap(s => s.itens).filter(i => i.productId === item.productId);
        const totalSold = salesOfItem.reduce((sum, i) => sum + i.qtde, 0);
        const avgDailySale = totalSold / 30;
        const daysOfStock = avgDailySale > 0 ? item.estoque / avgDailySale : Infinity;

        if (daysOfStock < 7) {
            insights.push({
                id: `insight-stock-${item.id}`,
                type: 'warning', icon: 'BoxSeam',
                title: 'Estoque Baixo',
                description: `O estoque de "${item.nome}" está acabando!`,
                metric: `Restam ${item.estoque} unidades. Duração estimada: ${Math.floor(daysOfStock)} dia(s).`,
                action: { text: 'Verificar Estoque', link: `/retail/inventory` }
            });
        }
    });

    const productsWithSales = new Set(recentSales.flatMap(s => s.itens).map(i => i.productId));
    const slowMover = inventory.find(item => !productsWithSales.has(item.productId) && item.estoque > 0);
    
    if (slowMover) {
        insights.push({
            id: `insight-slow-${slowMover.id}`,
            type: 'info', icon: 'ExclamationCircle',
            title: 'Oportunidade de Venda',
            description: `O produto "${slowMover.nome}" não é vendido há mais de 30 dias.`,
            metric: `Estoque atual: ${slowMover.estoque} unidades.`,
            action: { text: 'Criar Promoção', link: '#' }
        });
    }
    
    if (retailers.length > 1) {
        const retailerData = getDashboardData(retailerId, 30);
        const retailerTicket = retailerData.kpis.averageTicket;
        
        let totalRevenueAll = 0;
        let totalSalesCountAll = 0;
        retailers.forEach(r => {
            if (r.id !== retailerId) {
                const data = getDashboardData(r.id, 30);
                totalRevenueAll += data.kpis.totalRevenue;
                totalSalesCountAll += data.kpis.numberOfSales;
            }
        });
        const averageTicketOthers = totalSalesCountAll > 0 ? totalRevenueAll / totalSalesCountAll : 0;

        if (retailerTicket > averageTicketOthers * 1.1) {
            insights.push({
                id: 'insight-benchmark-good',
                type: 'success', icon: 'GraphUpArrow',
                title: 'Ótima Performance!',
                description: `Seu ticket médio está acima da média de outros varejistas.`,
                metric: `Seu: R$ ${retailerTicket.toFixed(2)} | Média: R$ ${averageTicketOthers.toFixed(2)}`,
                action: { text: 'Ver Produtos de Maior Margem', link: '/retail/inventory' }
            });
        } else if (retailerTicket < averageTicketOthers * 0.9 && averageTicketOthers > 0) {
             insights.push({
                id: 'insight-benchmark-bad',
                type: 'warning',
                icon: 'GraphDownArrow',
                title: 'Oportunidade de Melhoria',
                description: `Seu ticket médio está abaixo da média de outros varejistas.`,
                metric: `Seu: R$ ${retailerTicket.toFixed(2)} | Média: R$ ${averageTicketOthers.toFixed(2)}`,
                action: { text: 'Ver Produtos Mais Vendidos', link: '/retail/dashboard' }
            });
        }
    }

    return insights.slice(0, 4);
}