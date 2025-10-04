// --- ARQUIVO ATUALIZADO: src/state/selectors.js ---
import { getItem } from './storage';
import { differenceInDays } from 'date-fns'; // Importa a função para calcular a diferença em dias

// Busca todos os atores (varejistas ou indústrias)
export const getActorsByType = (actorType) => {
    const key = actorType === 'retail' ? 'retailers' : 'industries';
    const items = getItem(key);
    return items || [];
}

// Busca os dados de um ator específico
export const getActorData = (actorId, actorType) => {
    const key = actorType === 'retail' ? 'retailers' : 'industries';
    const items = getItem(key);
    return items?.find(item => item.id === actorId) || null;
}

// Vendas por varejista
export const getSalesByRetailer = (retailerId) => {
    const sales = getItem('sales') || [];
    return sales.filter(s => s.retailerId === retailerId);
}

// Inventário por varejista
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
            marca: industry ? industry.nomeFantasia : 'Marca Desconhecida',
            lote: item.lote
        };
    });
}

// Clientes por varejista
export const getClientsByRetailer = (retailerId) => {
    const clients = getItem('clients') || [];
    return clients.filter(c => c.retailerId === retailerId);
} 

// Conversor de texto para carrinho
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
                cartItems.push({ 
                    ...foundProduct, 
                    qtde: finalQty, 
                    precoUnit: foundProduct.precoVenda
                });
            }
        } else {
            notFound.push(trimmedPart);
        }
    });
    return { items: cartItems, notFound: notFound };
}


// --------------------
// SELECTORS APRIMORADOS
// --------------------

// Monta os dados de Dashboard do Varejista
export const getDashboardData = (retailerId, days = 30) => {
    const sales = getSalesByRetailer(retailerId);
    const products = getItem('products') || [];
    const industries = getItem('industries') || [];

    // Filtra por período
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const filteredSales = sales.filter(s => new Date(s.dataISO) >= cutoffDate);

    // KPIs
    const numberOfSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalLiquido, 0);
    const averageTicket = numberOfSales > 0 ? totalRevenue / numberOfSales : 0;

    // Receita por dia
    const salesByDayMap = {};
    filteredSales.forEach(s => {
        const day = new Date(s.dataISO).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
        salesByDayMap[day] = (salesByDayMap[day] || 0) + s.totalLiquido;
    });
    const salesByDay = Object.keys(salesByDayMap).map(d => ({ name: d, Receita: salesByDayMap[d] }));

    // Receita por categoria
    const revenueByCategoryMap = {};
    filteredSales.forEach(s => {
        s.itens.forEach(i => {
            const product = products.find(p => p.id === i.productId);
            if (product) {
                revenueByCategoryMap[product.categoria] = 
                    (revenueByCategoryMap[product.categoria] || 0) + (i.qtde * i.precoUnit);
            }
        });
    });
    const revenueByCategory = Object.keys(revenueByCategoryMap).map(c => ({ name: c, Receita: revenueByCategoryMap[c] }));

    // Top 5 produtos
    const productSalesMap = {};
    filteredSales.forEach(s => {
        s.itens.forEach(i => {
            const product = products.find(p => p.id === i.productId);
            const industry = industries.find(ind => ind.id === product?.industryId);
            if (product) {
                const key = product.id;
                if (!productSalesMap[key]) {
                    productSalesMap[key] = { id: product.id, productId: product.id, name: product.nome, marca: industry?.nomeFantasia || "Desconhecida", qtde: 0 };
                }
                productSalesMap[key].qtde += i.qtde;
            }
        });
    });
    const top5Products = Object.values(productSalesMap).sort((a, b) => b.qtde - a.qtde).slice(0, 5);

    return {
        kpis: { numberOfSales, totalRevenue, averageTicket },
        charts: { salesByDay, revenueByCategory },
        tables: { top5Products },
        raw: { sales: filteredSales } // Exporta vendas filtradas para uso em outros seletores
    };
};


// Insights do Assistente de Performance (VERSÃO CORRIGIDA E MELHORADA)
export const getRetailerInsights = (retailerId) => {
    const today = new Date();
    const insights = [];
    
    // --- Dados Base ---
    const dashboardData30Days = getDashboardData(retailerId, 30);
    const inventory = getInventoryByRetailer(retailerId);
    
    // --- INSIGHT 1: Alerta de Estoque Baixo para Produtos Populares ---
    const topProducts = dashboardData30Days.tables.top5Products;
    if (topProducts.length > 0) {
        const topProductInventory = inventory.find(i => i.productId === topProducts[0].productId);
        if (topProductInventory && topProductInventory.estoque < 10) {
            insights.push({ 
                id: "insight-low-stock",
                type: "warning", 
                icon: "ExclamationCircle", 
                title: "Estoque baixo do campeão de vendas",
                description: `O produto "${topProducts[0].name}" está acabando! Considere fazer um novo pedido para não perder vendas.`,
                metric: `Apenas ${topProductInventory.estoque} un. restantes`,
                text: `Estoque baixo: ${topProducts[0].name} (${topProductInventory.estoque} un.)`,
                action: { text: "Ver Estoque", link: "/retail/inventory" }
            });
        }
    }
    
    // --- INSIGHT 2: Alerta de Produtos Próximos da Validade ---
    const expiringSoon = inventory.find(item => 
        item.dataValidade && 
        differenceInDays(new Date(item.dataValidade), today) <= 15 &&
        differenceInDays(new Date(item.dataValidade), today) > 0 
    );
    if (expiringSoon) {
        const daysLeft = differenceInDays(new Date(expiringSoon.dataValidade), today);
        insights.push({ 
            id: "insight-expiring-soon",
            type: "warning", 
            icon: "GraphDownArrow", 
            title: "Produto perto de vencer",
            description: `Atenção ao produto "${expiringSoon.nome}". Crie uma promoção ou um combo para girar o estoque e evitar perdas.`,
            metric: `Vence em ${daysLeft} dias`,
            text: `Perto de vencer: ${expiringSoon.nome} (em ${daysLeft} dias)`,
            action: { text: "Ver Estoque", link: "/retail/inventory" }
        });
    }

    // --- INSIGHT 3: Alerta de Estoque Parado ---
    const salesLast30Days = dashboardData30Days.raw.sales.flatMap(s => s.itens);
    const slowMovingItem = inventory.find(item => 
        item.estoque > 50 && 
        !salesLast30Days.some(sold => sold.productId === item.productId)
    );

    if (slowMovingItem) {
        insights.push({ 
            id: "insight-slow-moving",
            type: "info", 
            icon: "BoxSeam", 
            title: "Estoque parado",
            description: `O produto "${slowMovingItem.nome}" não teve vendas no último mês e possui um estoque alto. Que tal dar um destaque a ele na loja?`,
            metric: `${slowMovingItem.estoque} un. em estoque`,
            text: `Estoque parado: ${slowMovingItem.nome} (${slowMovingItem.estoque} un.)`,
            action: { text: "Ver Detalhes", link: "/retail/inventory" }
        });
    }

    // --- INSIGHT 4: Produto Mais Lucrativo ---
    const profitability = {};
    salesLast30Days.forEach(soldItem => {
        const inventoryItem = inventory.find(i => i.productId === soldItem.productId);
        if (inventoryItem && inventoryItem.custoMedio) {
            const profit = (soldItem.precoUnit - inventoryItem.custoMedio) * soldItem.qtde;
            if (!profitability[soldItem.productId]) {
                profitability[soldItem.productId] = { name: inventoryItem.nome, totalProfit: 0 };
            }
            profitability[soldItem.productId].totalProfit += profit;
        }
    });

    const mostProfitable = Object.values(profitability).sort((a,b) => b.totalProfit - a.totalProfit)[0];
    if (mostProfitable && mostProfitable.totalProfit > 100) {
        insights.push({ 
            id: "insight-most-profitable",
            type: "success", 
            icon: "GraphUpArrow", 
            title: "Sua mina de ouro!",
            description: `O produto "${mostProfitable.name}" foi o que mais gerou lucro líquido no último mês. Invista na visibilidade dele!`,
            metric: `+ R$ ${mostProfitable.totalProfit.toFixed(2)} de lucro`,
            text: `Sua mina de ouro: ${mostProfitable.name} (+ R$ ${mostProfitable.totalProfit.toFixed(2)} de lucro)`,
            action: { text: "Ver Dashboard", link: "/retail/dashboard" }
        });
    }

    // --- Fallback ---
    if (insights.length === 0) {
        insights.push({
            id: "insight-none",
            type: "neutral",
            icon: "ExclamationCircle",
            title: "Nenhum insight relevante",
            description: "Não encontramos insights significativos no período. Continue registrando suas vendas e movimentações.",
            metric: "Continue registrando",
            text: "Nenhum insight relevante no momento.",
            action: { text: "Registrar Venda", link: "/retail/pos/traditional" }
        });
    }

    return insights;
};