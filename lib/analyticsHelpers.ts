//lib/analyticsHelpers.ts
// --- Definiciones de Tipos de Datos ---
// Definimos las "formas" de nuestros datos para trabajar de manera segura.
export type Deal = { id: string; title: string; stage_id: string; pipeline_id: string | null; value: number | null; created_at: string; closed_at: string | null; owner_id: string | null; account_id: string | null; status: string; pain: string | null; };
export type Stage = { pipeline_id: string; id: string; name: string; order: number; std_map: string | null; created_at: string; };
export type UserProfile = { avatar: string | null; id: string; name: string | null; };
export type Account = { id: string; name: string; sector: string | null; };
export type Goal = { year: number; months: { [key: string]: number } };
export type PipelineInfo = {id: string; name: string; }

// --- Funciones de Procesamiento de Datos ---
const getDealStatus = (deal: Deal, stages: Stage[]): 'won' | 'lost' | 'open' => {
  const stage = stages.find(s => s.id === deal.stage_id);
  if (stage?.std_map === 'Ganado') return 'won';
  if (stage?.std_map === 'Perdido') return 'lost';
  return 'open';
};
/**
 * Calcula los datos para el gráfico de embudo (Funnel Chart).
 * Cuenta cuántas oportunidades hay en cada etapa del pipeline.
 */
export function processFunnelData(deals: Deal[], stages: Stage[]) {
  const openStages = stages
    .filter(s => s.std_map !== 'Ganado' && s.std_map !== 'Perdido')
    .sort((a, b) => a.order - b.order);

  const labels = openStages.map(s => s.name);
  const data = openStages.map(stage => {
    return deals.filter(deal => deal.stage_id === stage.id).length;
  });

  return { labels, data };
}


export function processWinLossAnalysis(deals: Deal[], accounts: Account[], stages: Stage[]) {
  const wonDeals = deals.filter(d => getDealStatus(d, stages) === 'won');
  const lostDeals = deals.filter(d => getDealStatus(d, stages) === 'lost');
  
  const wonBySector: { [sector: string]: number } = {};
  const lostBySector: { [sector: string]: number } = {};
  const allSectors = new Set<string>();

  wonDeals.forEach(deal => {
    const account = accounts.find(acc => acc.id === deal.account_id);
    const sector = account?.sector || 'No especificado';
    wonBySector[sector] = (wonBySector[sector] || 0) + 1;
    allSectors.add(sector);
  });
  lostDeals.forEach(deal => {
    const account = accounts.find(acc => acc.id === deal.account_id);
    const sector = account?.sector || 'No especificado';
    lostBySector[sector] = (lostBySector[sector] || 0) + 1;
    allSectors.add(sector);
  });

  const labels = Array.from(allSectors);
  return {
    labels,
    datasets: [
      { label: 'Ganadas', data: labels.map(sector => wonBySector[sector] || 0), backgroundColor: 'var(--brand-success)' },
      { label: 'Perdidas', data: labels.map(sector => lostBySector[sector] || 0), backgroundColor: 'var(--brand-danger)' }
    ],
  };
}
/**
 * Agrupa las ventas ganadas por un período de tiempo (últimas 8 semanas).
 */
export function processSalesByPeriod(deals: Deal[], stages: Stage[]) {
  const wonDeals = deals.filter(d => getDealStatus(d, stages) === 'won');
  const weeklySales: { [key: string]: number } = {};
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const year = d.getFullYear();
    const week = Math.ceil((((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
    weeklySales[`S${week}`] = 0;
  }
  wonDeals.forEach(deal => {
    const closingDate = new Date(deal.closed_at!);
    const year = closingDate.getFullYear();
    const week = Math.ceil((((closingDate.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
    const weekKey = `S${week}`;
    if (weekKey in weeklySales) {
      weeklySales[weekKey] += deal.value || 0;
    }
  });
  return { labels: Object.keys(weeklySales), data: Object.values(weeklySales) };
}

/**
 * Crea un ranking de vendedores basado en el valor total de sus ventas ganadas.
 */
export function processSalespersonRanking(deals: Deal[], users: UserProfile[], stages: Stage[]) {
  const wonDeals = deals.filter(d => getDealStatus(d, stages) === 'won');
  const salesByOwner: { [ownerId: string]: number } = {};
  wonDeals.forEach(deal => {
    if (deal.owner_id) {
      salesByOwner[deal.owner_id] = (salesByOwner[deal.owner_id] || 0) + (deal.value || 0);
    }
  });
  const sortedRanking = Object.entries(salesByOwner).sort(([, aValue], [, bValue]) => bValue - aValue);
  const labels = sortedRanking.map(([ownerId]) => users.find(u => u.id === ownerId)?.name || 'Desconocido');
  const data = sortedRanking.map(([, value]) => value);
  return { labels, data };
}

/**
 * Analiza las ventas ganadas por sector/industria del cliente.
 */
export function processSalesBySector(deals: Deal[], accounts: Account[], stages: Stage[]) {
    const wonDeals = deals.filter(d => getDealStatus(d, stages) === 'won');
    const salesBySector: { [sector: string]: number } = {};
    wonDeals.forEach(deal => {
        const account = accounts.find(acc => acc.id === deal.account_id);
        const sector = account?.sector || 'No especificado';
        salesBySector[sector] = (salesBySector[sector] || 0) + (deal.value || 0);
    });
    return { labels: Object.keys(salesBySector), data: Object.values(salesBySector) };
}

/**
 * Compara la meta del mes actual con las ventas reales del mes actual.
 */
export function processGoalVsActual(deals: Deal[], goals: Goal[], stages: Stage[]) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1);
    const yearGoal = goals.find(g => g.year === currentYear);
    const monthlyGoal = yearGoal?.months?.[currentMonth] || 0;
    const wonDealsThisMonth = deals.filter(d => {
        if (getDealStatus(d, stages) !== 'won' || !d.closed_at) return false;
        const closingDate = new Date(d.closed_at);
        return closingDate.getFullYear() === currentYear && (closingDate.getMonth() + 1) === Number(currentMonth);
    });
    const actualSales = wonDealsThisMonth.reduce((sum, deal) => sum + (deal.value || 0), 0);
    return { goal: monthlyGoal, actual: actualSales, percentage: monthlyGoal > 0 ? (actualSales / monthlyGoal) * 100 : 0 };
}


