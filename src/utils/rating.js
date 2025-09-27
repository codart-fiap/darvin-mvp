// --- ARQUIVO: src/utils/rating.js ---
// --- TECNOLOGIA: JavaScript ---
// Este é um arquivo de "utilitário", o que significa que ele contém funções de ajuda
// que podem ser usadas em várias partes do nosso aplicativo.
// Este arquivo específico calcula a "nota" ou "rating" de um varejista.

// Importamos a função `getItem` para poder ler dados do nosso "banco de dados" (localStorage).
import { getItem } from '../state/storage';

// Exportamos a função `calculateRetailerRating` para que outros arquivos possam usá-la.
// Ela recebe o ID do varejista como um "parâmetro" (informação necessária para funcionar).
export const calculateRetailerRating = (retailerId) => {
  // Buscamos todas as vendas e todo o estoque do localStorage.
  const allSales = getItem('sales') || [];
  const allInventory = getItem('inventory') || [];

  // --- PASSO 1: Filtrar vendas dos últimos 90 dias ---
  // Criamos uma data que representa "90 dias atrás" a partir de hoje.
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Usamos `filter` para criar uma nova lista contendo apenas as vendas que
  // pertencem ao varejista (`sale.retailerId === retailerId`) E
  // que aconteceram depois da data que calculamos (`new Date(sale.dataISO) >= ninetyDaysAgo`).
  const recentSales = allSales.filter(sale =>
    sale.retailerId === retailerId && new Date(sale.dataISO) >= ninetyDaysAgo
  );
  // Contamos quantas vendas recentes encontramos.
  const salesCount = recentSales.length;

  // --- PASSO 2: Calcular a porcentagem de produtos em estoque ---
  // Filtramos o inventário para pegar apenas os itens do nosso varejista.
  const retailerInventory = allInventory.filter(inv => inv.retailerId === retailerId);
  // Contamos quantos tipos de produtos (SKUs) ele tem no total.
  const totalSkusForRetailer = retailerInventory.length;
  // Filtramos de novo para contar apenas os produtos que têm estoque maior que zero.
  const skusInStockCount = retailerInventory.filter(inv => inv.estoque > 0).length;
  // Calculamos a porcentagem. Se o total de SKUs for 0, a porcentagem é 0 para evitar erros.
  const stockPercentage = totalSkusForRetailer > 0 ? (skusInStockCount / totalSkusForRetailer) * 100 : 0;

  // --- PASSO 3: Aplicar as regras de rating ---
  // Usamos `if` para checar as condições e retornar a classificação correta.
  // Se ele vendeu muito E tem uma boa porcentagem de estoque, ele é Diamante.
  if (salesCount >= 300 && stockPercentage >= 80) return { name: 'Diamante' };
  // Se não, checamos a condição para Ouro.
  if (salesCount >= 150 && stockPercentage >= 60) return { name: 'Ouro' };
  // E assim por diante.
  if (salesCount >= 60 && stockPercentage >= 40) return { name: 'Prata' };

  // Se ele não se encaixou em nenhuma das regras acima, ele é Bronze.
  return { name: 'Bronze' };
};
