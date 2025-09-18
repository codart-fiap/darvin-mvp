// FILE: src/utils/rating.js
import { getItem } from '../state/storage';

export const calculateRetailerRating = (retailerId) => {
  const allSales = getItem('sales') || [];
  const allInventory = getItem('inventory') || [];

  // 1. Filtrar vendas dos últimos 90 dias
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentSales = allSales.filter(sale =>
    sale.retailerId === retailerId && new Date(sale.dataISO) >= ninetyDaysAgo
  );
  const salesCount = recentSales.length;

  // 2. Calcular % de SKUs em estoque
  const retailerInventory = allInventory.filter(inv => inv.retailerId === retailerId);
  const totalSkusForRetailer = retailerInventory.length;
  const skusInStockCount = retailerInventory.filter(inv => inv.estoque > 0).length;
  const stockPercentage = totalSkusForRetailer > 0 ? (skusInStockCount / totalSkusForRetailer) * 100 : 0;

  // 3. Aplicar as regras de rating
  if (salesCount >= 300 && stockPercentage >= 80) return { name: 'Diamante' };
  if (salesCount >= 150 && stockPercentage >= 60) return { name: 'Ouro' };
  if (salesCount >= 60 && stockPercentage >= 40) return { name: 'Prata' };

  return { name: 'Bronze' };
};