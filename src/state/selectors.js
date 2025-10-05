// --- ARQUIVO ATUALIZADO: src/state/selectors.js ---
import { getItem } from './storage';
import { differenceInDays, subDays } from 'date-fns';
import { calculateRating } from '../utils/rating'; // <-- IMPORTA A LÓGICA DE RATING


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
            logo: industry ? industry.logo : null,
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

// Monta os dados de Dashboard do Varejista
export const getDashboardData = (retailerId, days = 30, categoryFilter = null, dateFilter = null) => {
    const sales = getSalesByRetailer(retailerId);
    const products = getItem('products') || [];
    const industries = getItem('industries') || [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    let periodSales = sales.filter(s => new Date(s.dataISO) >= cutoffDate);
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

// Insights do Assistente de Performance
export const getRetailerInsights = (retailerId) => {
    const today = new Date();
    const insights = [];
    
    const dashboardData30Days = getDashboardData(retailerId, 30);
    const inventory = getInventoryByRetailer(retailerId);
    
    const topProducts = dashboardData30Days.tables.top5Products;
    if (topProducts.length > 0) {
        const topProductInventory = inventory.find(i => i.productId === topProducts[0].productId);
        if (topProductInventory && topProductInventory.estoque < 10) {
            insights.push({ 
                id: "insight-low-stock", type: "warning", icon: "ExclamationCircle", title: "Estoque baixo do campeão de vendas",
                description: `O produto "${topProducts[0].name}" está acabando! Considere fazer um novo pedido para não perder vendas.`,
                metric: `Apenas ${topProductInventory.estoque} un. restantes`, text: `Estoque baixo: ${topProducts[0].name} (${topProductInventory.estoque} un.)`,
                action: { text: "Ver Estoque", link: "/retail/inventory" }
            });
        }
    }
    
    const expiringSoon = inventory.find(item => 
        item.dataValidade && 
        differenceInDays(new Date(item.dataValidade), today) <= 15 &&
        differenceInDays(new Date(item.dataValidade), today) > 0 
    );
    if (expiringSoon) {
        const daysLeft = differenceInDays(new Date(expiringSoon.dataValidade), today);
        insights.push({ 
            id: "insight-expiring-soon", type: "warning", icon: "GraphDownArrow", title: "Produto perto de vencer",
            description: `Atenção ao produto "${expiringSoon.nome}". Crie uma promoção ou um combo para girar o estoque e evitar perdas.`,
            metric: `Vence em ${daysLeft} dias`, text: `Perto de vencer: ${expiringSoon.nome} (em ${daysLeft} dias)`,
            action: { text: "Ver Estoque", link: "/retail/inventory" }
        });
    }

    const salesLast30Days = dashboardData30Days.raw.sales.flatMap(s => s.itens);
    const slowMovingItem = inventory.find(item => 
        item.estoque > 50 && 
        !salesLast30Days.some(sold => sold.productId === item.productId)
    );

    if (slowMovingItem) {
        insights.push({ 
            id: "insight-slow-moving", type: "info", icon: "BoxSeam", title: "Estoque parado",
            description: `O produto "${slowMovingItem.nome}" não teve vendas no último mês e possui um estoque alto. Que tal dar um destaque a ele na loja?`,
            metric: `${slowMovingItem.estoque} un. em estoque`, text: `Estoque parado: ${slowMovingItem.nome} (${slowMovingItem.estoque} un.)`,
            action: { text: "Ver Detalhes", link: "/retail/inventory" }
        });
    }

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

// Busca detalhes de um produto específico para o card expansível
export const getProductDetails = (retailerId, productId) => {
    const sales = getSalesByRetailer(retailerId);
    const inventoryItem = (getItem('inventory') || []).find(i => i.retailerId === retailerId && i.productId === productId);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const salesInPeriod = sales.filter(s => new Date(s.dataISO) >= cutoffDate);
    
    let salesCount = 0, quantitySold = 0, totalRevenue = 0;

    salesInPeriod.forEach(sale => {
        const itemSold = sale.itens.find(i => i.productId === productId);
        if (itemSold) {
            salesCount++;
            quantitySold += itemSold.qtde;
            totalRevenue += itemSold.qtde * itemSold.precoUnit;
        }
    });

    const averagePrice = quantitySold > 0 ? totalRevenue / quantitySold : 0;
    const averageProfit = inventoryItem?.custoMedio ? averagePrice - inventoryItem.custoMedio : 0;

    return { salesCount, quantitySold, averagePrice, averageProfit: averageProfit > 0 ? averageProfit : 0 };
};

// --- SELECTOR DE PROGRAMAS APRIMORADO ---
export const getProgramsForRetailer = (retailerId) => {
    const programs = getItem('programs') || [];
    const industries = getItem('industries') || [];
    const subscriptions = getItem('programSubscriptions') || [];
    const sales = getSalesByRetailer(retailerId);
    const products = getItem('products') || [];

    return programs.map(program => {
        const industry = industries.find(i => i.id === program.industryId);
        const subscription = subscriptions.find(s => s.retailerId === retailerId && s.programId === program.id);
        const isCompleted = new Date() > new Date(program.endDate);

        let progress = { current: 0, target: 0, percentage: 0 };

        if (subscription) {
            const programStartDate = new Date(program.startDate);
            const programEndDate = new Date(program.endDate);
            const programSales = sales.filter(s => {
                const saleDate = new Date(s.dataISO);
                return saleDate >= programStartDate && saleDate <= programEndDate;
            });
            
            // Lógica para crescimento percentual
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
            // Lógica para volume de SKU
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

    // 1. Filtra apenas produtos que pertencem a esta indústria
    const industryProductIds = allProducts
        .filter(p => p.industryId === industryId)
        .map(p => p.id);

    // 2. Filtra as vendas que contêm produtos desta indústria e que estão no período de tempo
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
    
    // 3. Aplica o filtro de varejista (se houver)
    let filteredSales = industrySales;
    if (retailerFilter) {
        const retailer = allRetailers.find(r => r.nomeFantasia === retailerFilter);
        if (retailer) {
            filteredSales = industrySales.filter(s => s.retailerId === retailer.id);
        }
    }

    // 4. Calcula os KPIs
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalLiquido, 0);
    const totalUnitsSold = filteredSales.reduce((sum, s) => sum + s.itens.reduce((itemSum, i) => itemSum + i.qtde, 0), 0);
    const activeRetailers = new Set(filteredSales.map(s => s.retailerId)).size;
    const averagePricePerUnit = totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0;

    // 5. Prepara dados para os gráficos
    // Vendas por Varejista (usando as vendas antes do filtro para manter o contexto no gráfico)
    const salesByRetailerMap = {};
    industrySales.forEach(sale => {
        const retailer = allRetailers.find(r => r.id === sale.retailerId);
        if(retailer) {
            salesByRetailerMap[retailer.nomeFantasia] = (salesByRetailerMap[retailer.nomeFantasia] || 0) + sale.totalLiquido;
        }
    });
    const salesByRetailer = Object.keys(salesByRetailerMap).map(name => ({ name, Receita: salesByRetailerMap[name] })).sort((a, b) => b.Receita - a.Receita);

    // Receita por Produto
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

    // 6. Prepara dados para as tabelas
    // Top 5 Produtos
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

    // Top 5 Varejistas (baseado nas vendas filtradas)
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

// SELECTOR PARA O DARVIN VISION (ANÁLISES AVANÇADAS)
// ######################################################
export const getDarvinVisionData = (industryId) => {
    const allSales = getItem('sales') || [];
    const allProducts = getItem('products') || [];
    const allRetailers = getItem('retailers') || [];

    // Filtra apenas produtos e vendas relevantes para esta indústria
    const industryProductIds = allProducts.filter(p => p.industryId === industryId).map(p => p.id);
    const industrySales = allSales.map(sale => {
        const itemsFromIndustry = sale.itens.filter(item => industryProductIds.includes(item.productId));
        if (itemsFromIndustry.length === 0) return null;
        return { ...sale, itens: itemsFromIndustry };
    }).filter(Boolean);

    // --- Análise 1: Combos de Vendas (Market Basket Analysis Simplificado) ---
    const comboCounts = {};
    industrySales.forEach(sale => {
        if (sale.itens.length > 1) {
            const productIds = sale.itens.map(item => item.productId).sort(); // Ordenar para evitar pares duplicados (A,B vs B,A)
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
                productA_id: idA,
                productB_id: idB,
                productA_name: allProducts.find(p => p.id === idA)?.nome || 'Produto A',
                productB_name: allProducts.find(p => p.id === idB)?.nome || 'Produto B',
                count: comboCounts[pair]
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Pega os 5 combos mais frequentes

    // --- Análise 2: Vendas por Região ---
    const regionSales = {};
    industrySales.forEach(sale => {
        const retailer = allRetailers.find(r => r.id === sale.retailerId);
        if (retailer) {
            const uf = retailer.endereco.uf;
            if (!regionSales[uf]) {
                regionSales[uf] = { totalRevenue: 0, totalUnits: 0 };
            }
            sale.itens.forEach(item => {
                regionSales[uf].totalRevenue += item.qtde * item.precoUnit;
                regionSales[uf].totalUnits += item.qtde;
            });
        }
    });

    const salesByRegion = Object.keys(regionSales)
        .map(uf => ({ uf, ...regionSales[uf] }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // --- Análise 3: Vendas por Dia da Semana ---
    const weekdaySales = { 'Dom': 0, 'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0, 'Sáb': 0 };
    const weekdayOrder = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    industrySales.forEach(sale => {
        const dayIndex = new Date(sale.dataISO).getDay();
        const dayName = weekdayOrder[dayIndex];
        const saleTotal = sale.itens.reduce((sum, i) => sum + (i.qtde * i.precoUnit), 0);
        weekdaySales[dayName] += saleTotal;
    });
    
    const salesByWeekday = weekdayOrder.map(day => ({ day, Receita: weekdaySales[day] }));


    return { salesCombos, salesByRegion, salesByWeekday };
};