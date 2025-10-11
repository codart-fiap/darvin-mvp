// FILE: src/state/selectors.js
import { getItem } from './storage';
import { differenceInDays, subDays } from 'date-fns';
import { calculateRating } from '../utils/rating';

// Busca todos os atores (varejistas ou indústrias)
export const getActorsByType = (actorType) => {
    const key = actorType === 'retail' ? 'retailers' : 'industries';
    return getItem(key) || [];
};

// Busca os dados de um ator específico
export const getActorData = (actorId, actorType) => {
    const key = actorType === 'retail' ? 'retailers' : 'industries';
    const items = getItem(key) || [];
    return items.find(item => item.id === actorId) || null;
};

// Vendas por varejista
export const getSalesByRetailer = (retailerId) => {
    const sales = getItem('sales') || [];
    return sales.filter(s => s.retailerId === retailerId);
};

// --- FUNÇÃO OTIMIZADA PARA PERFORMANCE ---
// Inventário por varejista (agrupado por produto/lotes com pré-cálculo de métricas)
export const getInventoryByRetailer = (retailerId) => {
    const inventory = getItem('inventory') || [];
    const products = getItem('products') || [];
    const industries = getItem('industries') || [];
    const sales = getSalesByRetailer(retailerId);

    // --- CORREÇÃO APLICADA AQUI ---
    const salesMetrics = {};
    const cutoffDate = subDays(new Date(), 30);
    // 1. Cria uma variável para armazenar apenas as vendas dos últimos 30 dias.
    const salesInPeriod = sales.filter(s => new Date(s.dataISO) >= cutoffDate);

    // 2. Usa essa variável para calcular as unidades vendidas e a receita.
    salesInPeriod.forEach(sale => {
        sale.itens.forEach(item => {
            if (!salesMetrics[item.productId]) {
                salesMetrics[item.productId] = { salesCount: 0, quantitySold: 0, totalRevenue: 0 };
            }
            salesMetrics[item.productId].quantitySold += item.qtde;
            salesMetrics[item.productId].totalRevenue += item.qtde * item.precoUnit;
        });
    });

    // 3. Usa a MESMA variável para contar o número de transações, garantindo consistência.
    Object.keys(salesMetrics).forEach(productId => {
        salesMetrics[productId].salesCount = salesInPeriod.filter(s =>
            s.itens.some(i => i.productId === productId)
        ).length;
    });
    // --- FIM DA CORREÇÃO ---

    const retailerInventory = inventory.filter(item => item.retailerId === retailerId);
    
    const groupedByProduct = retailerInventory.reduce((acc, item) => {
        const productInfo = products.find(p => p.id === item.productId);
        if (!productInfo) return acc;

        if (!acc[item.productId]) {
            const industry = industries.find(ind => ind.id === productInfo.industryId);
            acc[item.productId] = {
                productId: item.productId,
                nome: productInfo.nome,
                sku: productInfo.sku,
                categoria: productInfo.categoria,
                marca: industry ? industry.nomeFantasia : 'Marca Desconhecida',
                logo: industry ? industry.logo : null,
                industryId: productInfo.industryId,
                batches: []
            };
        }
        acc[item.productId].batches.push(item);
        return acc;
    }, {});

    return Object.values(groupedByProduct).map(product => {
        const totalStock = product.batches.reduce((sum, batch) => sum + batch.estoque, 0);
        
        const totalValue = product.batches.reduce((sum, b) => sum + (b.precoVenda * b.estoque), 0);
        const totalCost = product.batches.reduce((sum, b) => sum + (b.custoMedio * b.estoque), 0);

        const weightedAvgPrice = totalStock > 0 ? totalValue / totalStock : 0;
        const weightedAvgCost = totalStock > 0 ? totalCost / totalStock : 0;
        
        const nextExpiryDate = product.batches
            .map(b => new Date(b.dataValidade))
            .sort((a, b) => a - b)[0];

        // --- OTIMIZAÇÃO: Usa os dados pré-calculados ---
        const metrics = salesMetrics[product.productId] || { salesCount: 0, quantitySold: 0, totalRevenue: 0 };
        const averagePriceSold = metrics.quantitySold > 0 ? metrics.totalRevenue / metrics.quantitySold : 0;
        const averageProfit = weightedAvgCost > 0 ? averagePriceSold - weightedAvgCost : 0;
        
        return {
            ...product,
            totalStock,
            avgPrice: weightedAvgPrice,
            avgCost: weightedAvgCost,
            profitMargin: weightedAvgPrice - weightedAvgCost,
            nextExpiryDate: nextExpiryDate ? nextExpiryDate.toISOString() : null,
            // Adiciona as métricas de venda diretamente ao objeto do produto
            salesDetails: {
                salesCount: metrics.salesCount,
                quantitySold: metrics.quantitySold,
                averagePrice: averagePriceSold,
                averageProfit: averageProfit > 0 ? averageProfit : 0
            }
        };
    }).sort((a,b) => a.nome.localeCompare(b.nome));
}


// Clientes por varejista
export const getClientsByRetailer = (retailerId) => {
    const clients = getItem('clients') || [];
    return clients.filter(c => c.retailerId === retailerId);
} 


// Monta os dados de Dashboard do Varejista
export const getDashboardData = (retailerId, days = 30, categoryFilter = null, dateFilter = null) => {
    const sales = getSalesByRetailer(retailerId);
    const products = getItem('products') || [];
    const industries = getItem('industries') || [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const periodSales = sales.filter(s => new Date(s.dataISO) >= cutoffDate);
    let filteredSales = periodSales;

    if (dateFilter) {
        const [day, month] = dateFilter.split('/');
        filteredSales = periodSales.filter(sale => {
            const saleDate = new Date(sale.dataISO);
            return saleDate.getDate() === parseInt(day, 10) && (saleDate.getMonth() + 1) === parseInt(month, 10);
        });
    }
    
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

    const numberOfSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalLiquido, 0);
    const averageTicket = numberOfSales > 0 ? totalRevenue / numberOfSales : 0;

    const salesByDayMap = {};
    periodSales.forEach(s => {
        const day = new Date(s.dataISO).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
        salesByDayMap[day] = (salesByDayMap[day] || 0) + s.totalLiquido;
    });
    const salesByDay = Object.keys(salesByDayMap).map(d => ({ name: d, Receita: salesByDayMap[d] }));

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

    const productSalesMap = {};
    // --- CORREÇÃO APLICADA AQUI ---
    // A lógica agora usa 'periodSales' para garantir que a contagem seja sempre baseada
    // nos dados originais do período, evitando o reuso de dados já filtrados por categoria.
    periodSales.forEach(s => {
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

// Insights do Assistente de Performance
export const getRetailerInsights = (retailerId) => {
    const today = new Date();
    const insights = [];
    
    const dashboardData30Days = getDashboardData(retailerId, 30);
    const inventory = getInventoryByRetailer(retailerId);
    
    const topProducts = dashboardData30Days.tables.top5Products;
    if (topProducts.length > 0) {
        const topProductInventory = inventory.find(i => i.productId === topProducts[0].productId);
        if (topProductInventory && topProductInventory.totalStock < 10) {
            insights.push({ 
                id: "insight-low-stock", type: "warning", icon: "ExclamationCircle", title: "Estoque baixo do campeão de vendas",
                description: `O produto "${topProducts[0].name}" está acabando! Considere fazer um novo pedido para não perder vendas.`,
                metric: `Apenas ${topProductInventory.totalStock} un. restantes`, text: `Estoque baixo: ${topProducts[0].name} (${topProductInventory.totalStock} un.)`,
                action: { text: "Ver Estoque", link: "/retail/inventory" }
            });
        }
    }
    
    const expiringSoon = inventory.find(item => 
        item.nextExpiryDate && 
        differenceInDays(new Date(item.nextExpiryDate), today) <= 15 &&
        differenceInDays(new Date(item.nextExpiryDate), today) > 0 
    );
    if (expiringSoon) {
        const daysLeft = differenceInDays(new Date(expiringSoon.nextExpiryDate), today);
        insights.push({ 
            id: "insight-expiring-soon", type: "warning", icon: "GraphDownArrow", title: "Produto perto de vencer",
            description: `Atenção ao produto "${expiringSoon.nome}". Crie uma promoção ou um combo para girar o estoque e evitar perdas.`,
            metric: `Vence em ${daysLeft} dias`, text: `Perto de vencer: ${expiringSoon.nome} (em ${daysLeft} dias)`,
            action: { text: "Ver Estoque", link: "/retail/inventory" }
        });
    }

    const salesLast30Days = dashboardData30Days.raw.sales.flatMap(s => s.itens);
    const slowMovingItem = inventory.find(item => 
        item.totalStock > 50 && 
        !salesLast30Days.some(sold => sold.productId === item.productId)
    );

    if (slowMovingItem) {
        insights.push({ 
            id: "insight-slow-moving", type: "info", icon: "BoxSeam", title: "Estoque parado",
            description: `O produto "${slowMovingItem.nome}" não teve vendas no último mês e possui um estoque alto. Que tal dar um destaque a ele na loja?`,
            metric: `${slowMovingItem.totalStock} un. em estoque`, text: `Estoque parado: ${slowMovingItem.nome} (${slowMovingItem.totalStock} un.)`,
            action: { text: "Ver Detalhes", link: "/retail/inventory" }
        });
    }

    const profitability = {};
    const flatInventory = getItem('inventory').filter(i => i.retailerId === retailerId) || [];
    salesLast30Days.forEach(soldItem => {
        const inventoryItem = flatInventory.find(i => i.productId === soldItem.productId);
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
            id: "insight-most-profitable", type: "success", icon: "GraphUpArrow", title: "Sua mina de ouro!",
            description: `O produto "${mostProfitable.name}" foi o que mais gerou lucro líquido no último mês. Invista na visibilidade dele!`,
            metric: `+ R$ ${mostProfitable.totalProfit.toFixed(2)} de lucro`, text: `Sua mina de ouro: ${mostProfitable.name} (+ R$ ${mostProfitable.totalProfit.toFixed(2)} de lucro)`,
            action: { text: "Ver Dashboard", link: "/retail/dashboard" }
        });
    }

    if (insights.length === 0) {
        insights.push({
            id: "insight-none", type: "neutral", icon: "ExclamationCircle", title: "Nenhum insight relevante",
            description: "Não encontramos insights significativos no período. Continue registrando suas vendas e movimentações.",
            metric: "Continue registrando", text: "Nenhum insight relevante no momento.",
            action: { text: "Registrar Venda", link: "/retail/pos/traditional" }
        });
    }

    return insights;
};

// --- SELECTOR DE PROGRAMAS APRIMORADO ---
export const getProgramsForRetailer = (retailerId) => {
    const programs = getItem('programs') || [];
    const industries = getItem('industries') || [];
    const subscriptions = getItem('programSubscriptions') || [];
    const sales = getSalesByRetailer(retailerId);
    const products = getItem('products') || [];
    const retailerRating = getRetailerRating(retailerId);
    const ratingOrder = { 'A+': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0 };


    return programs.map(program => {
        const industry = industries.find(i => i.id === program.industryId);
        const subscription = subscriptions.find(s => s.retailerId === retailerId && s.programId === program.id);
        const isCompleted = new Date() > new Date(program.endDate);

        const isEligible = !program.minRating || (ratingOrder[retailerRating.rating] >= ratingOrder[program.minRating]);

        let progress = { current: 0, target: 0, percentage: 0 };

        if (subscription) {
            const programStartDate = new Date(program.startDate);
            const programEndDate = new Date(program.endDate);
            const programSales = sales.filter(s => {
                const saleDate = new Date(s.dataISO);
                return saleDate >= programStartDate && saleDate <= programEndDate;
            });
            
            if (program.metric.type === 'percentual_venda_categoria') {
                const baseStartDate = subDays(programStartDate, 30);
                const baseSales = sales.filter(s => {
                     const saleDate = new Date(s.dataISO);
                     return saleDate >= baseStartDate && saleDate < programStartDate;
                });
                
                const getVolume = (salesList) => salesList.reduce((acc, sale) => {
                    return acc + sale.itens.reduce((itemAcc, item) => {
                        const product = products.find(p => p.id === item.productId);
                        if(product && program.metric.categories.includes(product.subcategoria)) {
                            return itemAcc + item.qtde;
                        }
                        return itemAcc;
                    }, 0);
                }, 0);

                const baseVolume = getVolume(baseSales);
                const currentVolume = getVolume(programSales);
                
                progress.target = Math.ceil(baseVolume * program.metric.target);
                progress.current = currentVolume;
            }
            else if (program.metric.type === 'volume_venda_sku') {
                progress.target = program.metric.target;
                programSales.forEach(sale => {
                    sale.itens.forEach(item => {
                        if (item.sku === program.metric.sku) {
                            progress.current += item.qtde;
                        }
                    });
                });
            }
            
            if (progress.target > 0) {
                progress.percentage = Math.min(Math.round((progress.current / progress.target) * 100), 100);
            }
        }

        return {
            ...program,
            industryName: industry?.nomeFantasia,
            industryLogo: industry?.logo,
            isSubscribed: !!subscription,
            isCompleted,
            isEligible,
            progress
        };
    });
};

// --- NOVO SELECTOR DE RATING ---
export const getRetailerRating = (retailerId) => {
    const sales = getSalesByRetailer(retailerId);
    return calculateRating(sales);
};

// SELECTOR PARA O DASHBOARD DA INDÚSTRIA
// ######################################################
export const getIndustryDashboardData = (industryId, days = 30, retailerFilter = null) => {
    const allSales = getItem('sales') || [];
    const allProducts = getItem('products') || [];
    const allRetailers = getItem('retailers') || [];

    const industryProductIds = allProducts
        .filter(p => p.industryId === industryId)
        .map(p => p.id);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const industrySales = allSales.map(sale => {
        const itemsFromIndustry = sale.itens.filter(item => industryProductIds.includes(item.productId));
        if (itemsFromIndustry.length === 0) return null;

        return {
            ...sale,
            itens: itemsFromIndustry,
            totalLiquido: itemsFromIndustry.reduce((sum, i) => sum + (i.qtde * i.precoUnit), 0)
        };
    }).filter(Boolean).filter(s => new Date(s.dataISO) >= cutoffDate);
    
    let filteredSales = industrySales;
    if (retailerFilter) {
        const retailer = allRetailers.find(r => r.nomeFantasia === retailerFilter);
        if (retailer) {
            filteredSales = industrySales.filter(s => s.retailerId === retailer.id);
        }
    }

    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalLiquido, 0);
    const totalUnitsSold = filteredSales.reduce((sum, s) => sum + s.itens.reduce((itemSum, i) => itemSum + i.qtde, 0), 0);
    const activeRetailers = new Set(filteredSales.map(s => s.retailerId)).size;
    const averagePricePerUnit = totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0;

    const salesByRetailerMap = {};
    industrySales.forEach(sale => {
        const retailer = allRetailers.find(r => r.id === sale.retailerId);
        if(retailer) {
            salesByRetailerMap[retailer.nomeFantasia] = (salesByRetailerMap[retailer.nomeFantasia] || 0) + sale.totalLiquido;
        }
    });
    const salesByRetailer = Object.keys(salesByRetailerMap).map(name => ({ name, Receita: salesByRetailerMap[name] })).sort((a, b) => b.Receita - a.Receita);

    const revenueByProductMap = {};
    filteredSales.forEach(sale => {
        sale.itens.forEach(item => {
            const product = allProducts.find(p => p.id === item.productId);
            if(product) {
                revenueByProductMap[product.nome] = (revenueByProductMap[product.nome] || 0) + (item.qtde * item.precoUnit);
            }
        });
    });
    const revenueByProduct = Object.keys(revenueByProductMap).map(name => ({ name, Receita: revenueByProductMap[name] }));

    const productSalesMap = {};
    filteredSales.forEach(sale => {
        sale.itens.forEach(item => {
            const product = allProducts.find(p => p.id === item.productId);
            if(product) {
                productSalesMap[product.nome] = (productSalesMap[product.nome] || 0) + item.qtde;
            }
        });
    });
    const topProducts = Object.keys(productSalesMap).map(name => ({ name, qtde: productSalesMap[name] })).sort((a,b) => b.qtde - a.qtde).slice(0, 5);

    const retailerRevenueMap = {};
     filteredSales.forEach(sale => {
        const retailer = allRetailers.find(r => r.id === sale.retailerId);
        if(retailer) {
            retailerRevenueMap[retailer.nomeFantasia] = (retailerRevenueMap[retailer.nomeFantasia] || 0) + sale.totalLiquido;
        }
    });
    const topRetailers = Object.keys(retailerRevenueMap).map(name => ({ name, revenue: retailerRevenueMap[name] })).sort((a,b) => b.revenue - a.revenue).slice(0, 5);


    return {
        kpis: { totalRevenue, totalUnitsSold, activeRetailers, averagePricePerUnit },
        charts: { salesByRetailer, revenueByProduct },
        tables: { topProducts, topRetailers },
    };
};

// SELECTOR PARA O DARVIN VISION
// ##############################################################################
export const getDarvinVisionData = (industryId) => {
    const allSales = getItem('sales') || [];
    const allProducts = getItem('products') || [];
    const allRetailers = getItem('retailers') || [];
    const allClients = getItem('clients') || [];
    const customerHistory = getItem('customerPurchaseHistory') || [];

    const industryProductIds = allProducts.filter(p => p.industryId === industryId).map(p => p.id);
    const industrySales = allSales.map(sale => {
        const itemsFromIndustry = sale.itens.filter(item => industryProductIds.includes(item.productId));
        if (itemsFromIndustry.length === 0 || !sale.clienteId || sale.clienteId.startsWith('consumidor_final')) {
            return null;
        }
        const industryRevenue = itemsFromIndustry.reduce((sum, i) => sum + (i.qtde * i.precoUnit), 0);
        return { ...sale, itens: itemsFromIndustry, industryRevenue };
    }).filter(Boolean);

    const comboCounts = {};
    industrySales.forEach(sale => {
        if (sale.itens.length > 1) {
            const productIds = sale.itens.map(item => item.productId).sort();
            for (let i = 0; i < productIds.length; i++) {
                for (let j = i + 1; j < productIds.length; j++) {
                    const pair = `${productIds[i]}|${productIds[j]}`;
                    comboCounts[pair] = (comboCounts[pair] || 0) + 1;
                }
            }
        }
    });

    const salesCombos = Object.keys(comboCounts)
        .map(pair => {
            const [idA, idB] = pair.split('|');
            return {
                productA_name: allProducts.find(p => p.id === idA)?.nome || 'Produto A',
                productB_name: allProducts.find(p => p.id === idB)?.nome || 'Produto B',
                count: comboCounts[pair]
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const regionSales = {};
    industrySales.forEach(sale => {
        const retailer = allRetailers.find(r => r.id === sale.retailerId);
        if (retailer) {
            const uf = retailer.endereco.uf;
            if (!regionSales[uf]) regionSales[uf] = { totalRevenue: 0, totalUnits: 0 };
            regionSales[uf].totalRevenue += sale.industryRevenue;
            regionSales[uf].totalUnits += sale.itens.reduce((sum, i) => sum + i.qtde, 0);
        }
    });

    const salesByRegion = Object.keys(regionSales).map(uf => ({ uf, ...regionSales[uf] })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    const weekdaySales = { 'Dom': 0, 'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0, 'Sáb': 0 };
    const weekdayOrder = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    industrySales.forEach(sale => {
        const dayIndex = new Date(sale.dataISO).getDay();
        weekdaySales[weekdayOrder[dayIndex]] += sale.industryRevenue;
    });
    
    const salesByWeekday = weekdayOrder.map(day => ({ day, Receita: weekdaySales[day] }));

    const getAgeGroup = (age) => {
        if (age <= 25) return '18-25';
        if (age <= 35) return '26-35';
        if (age <= 45) return '36-45';
        if (age <= 55) return '46-55';
        return '55+';
    };

    const demographicSales = { byGender: {}, byAge: {}, byHabit: {} };
    const customerSpending = {};
    const favoritesByProfile = { byGender: {}, byAgeGroup: {}, byHabit: {} };

    industrySales.forEach(sale => {
        const client = allClients.find(c => c.id === sale.clienteId);
        if (!client) return;

        if (client.sexo) {
            demographicSales.byGender[client.sexo] = (demographicSales.byGender[client.sexo] || 0) + sale.industryRevenue;
        }
        if (client.idade) {
            const ageGroup = getAgeGroup(client.idade);
            demographicSales.byAge[ageGroup] = (demographicSales.byAge[ageGroup] || 0) + sale.industryRevenue;
        }
        if (client.habitoCompra) {
            demographicSales.byHabit[client.habitoCompra] = (demographicSales.byHabit[client.habitoCompra] || 0) + sale.industryRevenue;
        }
        
        if (!customerSpending[client.id]) {
            customerSpending[client.id] = { totalSpent: 0, retailers: {} };
        }
        customerSpending[client.id].totalSpent += sale.industryRevenue;
        customerSpending[client.id].retailers[sale.retailerId] = (customerSpending[client.id].retailers[sale.retailerId] || 0) + 1;

        sale.itens.forEach(item => {
            const product = allProducts.find(p => p.id === item.productId);
            if (!product) return;

            if (client.sexo) {
                if (!favoritesByProfile.byGender[client.sexo]) favoritesByProfile.byGender[client.sexo] = {};
                favoritesByProfile.byGender[client.sexo][product.nome] = (favoritesByProfile.byGender[client.sexo][product.nome] || 0) + item.qtde;
            }
            if (client.idade) {
                const ageGroup = getAgeGroup(client.idade);
                if (!favoritesByProfile.byAgeGroup[ageGroup]) favoritesByProfile.byAgeGroup[ageGroup] = {};
                favoritesByProfile.byAgeGroup[ageGroup][product.nome] = (favoritesByProfile.byAgeGroup[ageGroup][product.nome] || 0) + item.qtde;
            }
             if (client.habitoCompra) {
                if (!favoritesByProfile.byHabit[client.habitoCompra]) favoritesByProfile.byHabit[client.habitoCompra] = {};
                favoritesByProfile.byHabit[client.habitoCompra][product.nome] = (favoritesByProfile.byHabit[client.habitoCompra][product.nome] || 0) + item.qtde;
            }
        });
    });

    const salesByGender = Object.keys(demographicSales.byGender).map(name => ({ name, Receita: demographicSales.byGender[name], percentage: 0 }));
    const totalGenderRevenue = salesByGender.reduce((sum, i) => sum + i.Receita, 0);
    salesByGender.forEach(item => item.percentage = Math.round((item.Receita / totalGenderRevenue) * 100));

    const salesByAge = Object.keys(demographicSales.byAge).map(name => ({ name, Receita: demographicSales.byAge[name] }));
    const salesByHabit = Object.keys(demographicSales.byHabit).map(name => ({ name, Receita: demographicSales.byHabit[name] }));

    const allCustomers = Object.keys(customerSpending)
        .map(clientId => {
            const client = allClients.find(c => c.id === clientId);
            const history = customerHistory.find(h => h.clientId === clientId);

            const favoriteRetailerId = Object.keys(customerSpending[clientId].retailers).sort((a, b) => 
                customerSpending[clientId].retailers[b] - customerSpending[clientId].retailers[a]
            )[0];
            const favoriteRetailer = allRetailers.find(r => r.id === favoriteRetailerId);

            return {
                id: clientId,
                code: `CLIENTE-${clientId.slice(-4).toUpperCase()}`,
                gender: client?.sexo,
                age: client?.idade,
                habit: client?.habitoCompra,
                city: favoriteRetailer?.endereco.cidade,
                favoriteStore: favoriteRetailer?.nomeFantasia,
                totalSpent: customerSpending[clientId].totalSpent,
                purchases: history?.totalPurchases || 0,
                averageTicket: history?.averageTicket || 0,
                lastPurchases: history?.purchases.slice(-3) || []
            };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent);

    const processFavorites = (favObject) => {
        const result = {};
        for (const segment in favObject) {
            result[segment] = Object.keys(favObject[segment])
                .map(productName => ({ name: productName, qtde: favObject[segment][productName] }))
                .sort((a, b) => b.qtde - a.qtde)
                .slice(0, 3);
        }
        return result;
    }
    
    const processedFavorites = {
        byGender: processFavorites(favoritesByProfile.byGender),
        byAgeGroup: processFavorites(favoritesByProfile.byAgeGroup),
        byHabit: processFavorites(favoritesByProfile.byHabit),
    };

    return { 
        salesCombos, 
        salesByRegion, 
        salesByWeekday,
        salesByGender,
        salesByAge,
        salesByHabit,
        allCustomers,
        favoritesByProfile: processedFavorites
    };
};

// --- NOVO SELECTOR PARA PROGRAMAS DA INDÚSTRIA ---
export const getProgramsByIndustry = (industryId) => {
    const allPrograms = getItem('programs') || [];
    const subscriptions = getItem('programSubscriptions') || [];
    const allSales = getItem('sales') || [];
    const allProducts = getItem('products') || [];

    const industryPrograms = allPrograms.filter(p => p.industryId === industryId);

    return industryPrograms.map(program => {
        const programSubscriptions = subscriptions.filter(s => s.programId === program.id);
        const participants = programSubscriptions.length;

        const programSales = allSales.filter(sale => {
            const saleDate = new Date(sale.dataISO);
            return saleDate >= new Date(program.startDate) && saleDate <= new Date(program.endDate);
        });

        let totalSales = 0;
        programSales.forEach(sale => {
            sale.itens.forEach(item => {
                const product = allProducts.find(p => p.id === item.productId);
                if (product && product.industryId === industryId) {
                    totalSales += item.qtde * item.precoUnit;
                }
            });
        });

        return {
            ...program,
            participants,
            totalSales
        };
    });
};