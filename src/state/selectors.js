// --- ARQUIVO ATUALIZADO: src/state/selectors.js ---
import { getItem } from './storage';
import { differenceInDays } from 'date-fns';

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
            logo: industry ? industry.logo : null, // <-- ADICIONADO
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

// Monta os dados de Dashboard do Varejista (AGORA COM FILTRO DE DATA E CATEGORIA)
export const getDashboardData = (retailerId, days = 30, categoryFilter = null, dateFilter = null) => {
    const sales = getSalesByRetailer(retailerId);
    const products = getItem('products') || [];
    const industries = getItem('industries') || [];

    // Filtra por período
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    let periodSales = sales.filter(s => new Date(s.dataISO) >= cutoffDate);
    let filteredSales = periodSales;

    // >>> NOVO: Aplica o filtro de data se ele existir <<<
    if (dateFilter) {
        // Converte a data do filtro (DD/MM) para um formato comparável
        const [day, month] = dateFilter.split('/');
        filteredSales = periodSales.filter(sale => {
            const saleDate = new Date(sale.dataISO);
            // Compara dia e mês da venda com o filtro
            return saleDate.getDate() === parseInt(day, 10) && (saleDate.getMonth() + 1) === parseInt(month, 10);
        });
    }
    
    // Aplica o filtro de categoria se ele existir (pode ser combinado com o de data)
    if (categoryFilter) {
        filteredSales = filteredSales.map(sale => {
            const filteredItems = sale.itens.filter(item => {
                const product = products.find(p => p.id === item.productId);
                return product && product.categoria === categoryFilter;
            });

            if (filteredItems.length === 0) return null;

            const totalLiquido = filteredItems.reduce((sum, i) => sum + (i.qtde * i.precoUnit), 0);
            return { ...sale, itens: filteredItems, totalLiquido };
        }).filter(Boolean);
    }

    // KPIs (calculados sobre as vendas filtradas)
    const numberOfSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalLiquido, 0);
    const averageTicket = numberOfSales > 0 ? totalRevenue / numberOfSales : 0;

    // Receita por dia (gráfico não é afetado pelos filtros para manter o contexto)
    const salesByDayMap = {};
    periodSales.forEach(s => {
        const day = new Date(s.dataISO).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
        salesByDayMap[day] = (salesByDayMap[day] || 0) + s.totalLiquido;
    });
    const salesByDay = Object.keys(salesByDayMap).map(d => ({ name: d, Receita: salesByDayMap[d] }));

    // Receita por categoria (gráfico não é afetado pelos filtros para manter o contexto)
    const revenueByCategoryMap = {};
    periodSales.forEach(s => {
        s.itens.forEach(i => {
            const product = products.find(p => p.id === i.productId);
            if (product) {
                revenueByCategoryMap[product.categoria] = 
                    (revenueByCategoryMap[product.categoria] || 0) + (i.qtde * i.precoUnit);
            }
        });
    });
    const revenueByCategory = Object.keys(revenueByCategoryMap).map(c => ({ name: c, Receita: revenueByCategoryMap[c] }));

    // Top 5 produtos (afetado por ambos os filtros)
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
        raw: { sales: filteredSales }
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