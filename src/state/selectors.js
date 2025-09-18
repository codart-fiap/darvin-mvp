// FILE: src/state/selectors.js
import { getItem } from './storage';

export const getActorData = (actorId, actorType) => {
    const items = getItem(`${actorType}s`);
    return items?.find(item => item.id === actorId) || null;
}

export const getSalesByRetailer = (retailerId) => {
    const sales = getItem('sales') || [];
    return sales.filter(s => s.retailerId === retailerId);
}

// --- FUNÇÕES PARA O VAREJO ---

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

export const getClientsByRetailer = (retailerId) => {
    const clients = getItem('clients') || [];
    return clients.filter(c => c.retailerId === retailerId);
} 

export const getProductsForMarketplace = () => {
    const products = getItem('products') || [];
    const suppliers = getItem('suppliers') || [];

    return products.map(product => {
        const supplierNames = (product.supplierIds || [])
            .map(supId => suppliers.find(s => s.id === supId)?.nomeFantasia)
            .filter(Boolean);
        return {
            ...product,
            supplierNames: supplierNames.join(', ') || 'Fornecedor Desconhecido'
        };
    });
}

export const getProposalsByRetailer = (retailerId) => {
    const proposals = getItem('proposals') || [];
    const industries = getItem('industries') || [];
    const retailerProposals = proposals.filter(p => p.type === 'retailer' && p.targetId === retailerId);

    return retailerProposals.map(proposal => {
        const industry = industries.find(ind => ind.id === proposal.industryId);
        return {
            ...proposal,
            industryName: industry ? industry.nomeFantasia : 'Indústria Desconhecida'
        };
    });
} 

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

export const getFeaturedSuppliers = () => {
    const suppliers = getItem('suppliers') || [];
    return suppliers;
}

export const searchMarketplace = (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
        return { type: 'initial', data: [] };
    }
    const products = getItem('products') || [];
    const suppliers = getItem('suppliers') || [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const matchedSupplier = suppliers.find(s => s.nomeFantasia.toLowerCase().includes(lowerCaseSearchTerm));
    if (matchedSupplier) {
        const supplierProducts = products
            .filter(p => (p.supplierIds || []).includes(matchedSupplier.id))
            .map(p => ({ ...p, supplierNames: matchedSupplier.nomeFantasia }));
        return { type: 'supplier', data: supplierProducts, supplierName: matchedSupplier.nomeFantasia };
    }
    let matchedProducts = products.filter(p => 
        p.nome.toLowerCase().includes(lowerCaseSearchTerm) ||
        p.categoria.toLowerCase().includes(lowerCaseSearchTerm)
    );
    matchedProducts = matchedProducts.map(p => {
        const productSuppliers = (p.supplierIds || []).map(supId => {
            const supplier = suppliers.find(s => s.id === supId);
            return {
                id: supId,
                name: supplier?.nomeFantasia || 'Desconhecido',
                price: p.precoSugerido
            };
        });
        return { ...p, suppliers: productSuppliers };
    });
    return { type: 'product', data: matchedProducts };
}

export const getConectaData = (retailerId) => {
    const proposals = getItem('proposals') || [];
    const transactions = getItem('transactions') || [];
    const funds = getItem('dataFunds') || [];
    const industries = getItem('industries') || [];
    
    const retailerProposals = proposals.filter(p => p.type === 'retailer' && p.targetId === retailerId);
    const proposalCount = retailerProposals.length;
    const totalMonetized = transactions
        .filter(t => t.destino.type === 'retailer' && t.destino.id === retailerId)
        .reduce((sum, t) => sum + t.liquido, 0);

    const individualProposals = retailerProposals.map(proposal => {
        const industry = industries.find(ind => ind.id === proposal.industryId);
        return {
            ...proposal,
            industryName: industry ? industry.nomeFantasia : 'Indústria Desconhecida'
        };
    });
    return {
        kpis: { proposalCount, totalMonetized },
        individualProposals,
        dataFunds: funds,
    };
}

// --- FUNÇÃO ATUALIZADA E CORRIGIDA PARA O ASSISTENTE DE PERFORMANCE ---
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
                action: { text: 'Comprar no Marketplace', link: `/retail/marketplace?search=${encodeURIComponent(item.nome)}` }
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