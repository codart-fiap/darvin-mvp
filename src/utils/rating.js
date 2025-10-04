// --- ARQUIVO: src/utils/rating.js ---
import { differenceInDays, startOfDay } from 'date-fns';

// --- PESOS PARA O CÁLCULO DO RATING ---
const WEIGHTS = {
  REGULARITY: 0.40,    // Regularidade das vendas
  GRANULARITY: 0.35, // Identificação do cliente
  VOLUME: 0.25,        // Faturamento
};

// --- FAIXAS DE PONTUAÇÃO PARA CADA NOTA ---
const RATING_THRESHOLDS = {
    E: 20,
    D: 40,
    C: 60,
    B: 80,
    A: 95,
};

/**
 * Calcula a pontuação de Regularidade (0 a 100)
 * Mede a % de dias nos últimos 30 dias que tiveram pelo menos uma venda.
 */
const calculateRegularityScore = (sales) => {
    if (!sales || sales.length === 0) return 0;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const salesInPeriod = sales.filter(s => new Date(s.dataISO) >= last30Days);
    if (salesInPeriod.length === 0) return 0;

    const uniqueDaysWithSales = new Set(
        salesInPeriod.map(s => startOfDay(new Date(s.dataISO)).toISOString())
    ).size;

    // A pontuação é a proporção de dias com vendas. Se teve vendas em 15 dos 30 dias, a nota é 50.
    const score = (uniqueDaysWithSales / 30) * 100;
    return Math.min(score, 100); // Garante que não passe de 100
};

/**
 * Calcula a pontuação de Granularidade (0 a 100)
 * Mede a % de vendas que identificaram um cliente (não 'Consumidor Final').
 */
const calculateGranularityScore = (sales) => {
    if (!sales || sales.length === 0) return 0;
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const salesInPeriod = sales.filter(s => new Date(s.dataISO) >= last30Days);
    if (salesInPeriod.length === 0) return 0;

    const identifiedSales = salesInPeriod.filter(
        s => s.clienteId && s.clienteId !== 'consumidor_final'
    ).length;

    const score = (identifiedSales / salesInPeriod.length) * 100;
    return Math.min(score, 100);
};

/**
 * Calcula a pontuação de Volume (0 a 100)
 * Compara o faturamento dos últimos 30 dias com uma meta (ex: R$ 5.000).
 */
const calculateVolumeScore = (sales) => {
    if (!sales || sales.length === 0) return 0;

    const TARGET_REVENUE = 5000; // Meta de faturamento para nota máxima
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const totalRevenue = sales
        .filter(s => new Date(s.dataISO) >= last30Days)
        .reduce((sum, s) => sum + s.totalLiquido, 0);

    // A pontuação é a proporção do faturamento em relação à meta.
    const score = (totalRevenue / TARGET_REVENUE) * 100;
    return Math.min(score, 100);
};

/**
 * Calcula o rating final (letra de E a A+)
 */
export const calculateRating = (sales) => {
    const regularity = calculateRegularityScore(sales);
    const granularity = calculateGranularityScore(sales);
    const volume = calculateVolumeScore(sales);

    const finalScore =
        regularity * WEIGHTS.REGULARITY +
        granularity * WEIGHTS.GRANULARITY +
        volume * WEIGHTS.VOLUME;

    let rating = 'E';
    if (finalScore >= RATING_THRESHOLDS.A) rating = 'A';
    else if (finalScore >= RATING_THRESHOLDS.B) rating = 'B';
    else if (finalScore >= RATING_THRESHOLDS.C) rating = 'C';
    else if (finalScore >= RATING_THRESHOLDS.D) rating = 'D';

    // Adiciona o '+' para pontuações muito altas na faixa
    if (rating === 'A' && finalScore >= 98) {
        rating = 'A+';
    }

    return {
        rating,
        score: Math.round(finalScore),
        details: {
            regularity: Math.round(regularity),
            granularity: Math.round(granularity),
            volume: Math.round(volume),
        },
    };
};