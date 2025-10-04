// --- ARQUIVO: src/state/selectors.js ---
import { getItem } from './storage';

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
// NOVOS SELECTORS
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
                    productSalesMap[key] = { name: product.nome, marca: industry?.nomeFantasia || "Desconhecida", qtde: 0 };
                }
                productSalesMap[key].qtde += i.qtde;
            }
        });
    });
    const top5Products = Object.values(productSalesMap).sort((a, b) => b.qtde - a.qtde).slice(0, 5);

    return {
        kpis: { numberOfSales, totalRevenue, averageTicket },
        charts: { salesByDay, revenueByCategory },
        tables: { top5Products }
    };
};


// Insights básicos do Assistente de Performance
export const getRetailerInsights = (retailerId) => {
    const data = getDashboardData(retailerId, 30);
    const insights = [];

    if (data.kpis.averageTicket < 20) {
        insights.push({ 
            id: "insight-avg-ticket",
            type: "warning", 
            icon: "GraphDownArrow", 
            title: "Ticket médio baixo",
            description: "O ticket médio está abaixo de R$20. Considere oferecer promoções de venda casada ou kits de produtos.",
            metric: `R$ ${data.kpis.averageTicket.toFixed(2)}`,
            action: { text: "Ver vendas", link: "/retailer/sales" }
        });
    }

    if (data.kpis.totalRevenue > 1000) {
        insights.push({ 
            id: "insight-revenue",
            type: "success", 
            icon: "GraphUpArrow", 
            title: "Boa receita no período",
            description: "Sua receita nos últimos 30 dias já ultrapassou R$ 1.000, continue assim!",
            metric: `R$ ${data.kpis.totalRevenue.toFixed(2)}`,
            action: { text: "Ver relatório", link: "/retailer/dashboard" }
        });
    }

    if (data.tables.top5Products.length > 0 && data.tables.top5Products[0].qtde > 50) {
        insights.push({ 
            id: "insight-top-product",
            type: "info", 
            icon: "BoxSeam", 
            title: "Produto campeão de vendas",
            description: `O produto mais vendido (${data.tables.top5Products[0].name}) já saiu mais de ${data.tables.top5Products[0].qtde} vezes.`,
            metric: `${data.tables.top5Products[0].qtde} un.`,
            action: { text: "Ver estoque", link: "/retailer/stock" }
        });
    }

    if (insights.length === 0) {
        insights.push({
            id: "insight-none",
            type: "neutral",
            icon: "ExclamationCircle",
            title: "Nenhum insight relevante",
            description: "Não encontramos insights significativos no período. Continue registrando suas vendas e movimentações.",
            metric: "-",
            action: { text: "Atualizar dados", link: "/retailer/dashboard" }
        });
    }

    return insights;
};
