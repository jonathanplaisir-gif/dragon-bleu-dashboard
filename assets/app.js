(function () {
  'use strict';

  const DATA = window.DB_DATA;
  const meta = DATA.metadata;
  const controls = {
    period: document.getElementById('period'),
    dimension: document.getElementById('dimension'),
    metric: document.getElementById('metric'),
    brand: document.getElementById('brand'),
    productType: document.getElementById('product-type'),
    market: document.getElementById('market'),
    status: document.getElementById('status'),
    priority: document.getElementById('priority'),
    search: document.getElementById('search'),
    limit: document.getElementById('limit')
  };

  const fmtEuro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const fmtEuro2 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
  const fmtNum = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  const fmtDec = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
  const fmtPct = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });

  function byId(id) { return document.getElementById(id); }
  function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
  function text(v) { return v === null || v === undefined ? '' : String(v); }
  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function arraysToObjects(block) {
    return block.rows.map(row => {
      const obj = {};
      block.columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }

  const references = arraysToObjects(DATA.references);
  const rawMarkets = arraysToObjects(DATA.markets).filter(row => text(row['Marché']).toUpperCase() !== 'GB');
  const brandSummary = arraysToObjects(DATA.brands);
  const periodMap = Object.fromEntries(meta.periods.map(p => [p.id, p]));
  const skuMeta = new Map();
  references.forEach(row => {
    const sku = text(row['SKU']);
    if (sku && !skuMeta.has(sku)) skuMeta.set(sku, row);
  });
  const markets = rawMarkets.map(row => {
    const metaRow = skuMeta.get(text(row['SKU'])) || {};
    return Object.assign({}, row, {
      'Variante': metaRow['Variante'] || '',
      'Prix TTC': metaRow['Prix TTC'] || null,
      'Statut fondation': metaRow['Statut fondation'] || '',
      'Priorité': metaRow['Priorité'] || '',
      'Action recommandée': metaRow['Action recommandée'] || '',
      'Commentaire achat': metaRow['Commentaire achat'] || '',
      'Commandes 12m': metaRow['Commandes 12m'] || null,
      'Vélocité mensuelle depuis 9 mars': metaRow['Vélocité mensuelle depuis 9 mars'] || null
    });
  });

  function unique(rows, field) {
    return Array.from(new Set(rows.map(r => r[field]).filter(v => v !== null && v !== undefined && text(v).trim() !== '')))
      .sort((a, b) => text(a).localeCompare(text(b), 'fr', { sensitivity: 'base' }));
  }
  function populateSelect(select, values, allLabel) {
    select.innerHTML = '';
    const all = document.createElement('option');
    all.value = '';
    all.textContent = allLabel;
    select.appendChild(all);
    values.forEach(value => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      select.appendChild(opt);
    });
  }
  function initControls() {
    meta.periods.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.label} · ${p.dateRange}`;
      controls.period.appendChild(opt);
    });
    populateSelect(controls.brand, unique(references, 'Marque'), 'Toutes les marques');
    populateSelect(controls.productType, unique(references, 'Type produit'), 'Tous les types');
    populateSelect(controls.market, unique(markets, 'Marché'), 'Tous hors GB');
    populateSelect(controls.status, unique(references, 'Statut fondation'), 'Tous les statuts');
    populateSelect(controls.priority, unique(references, 'Priorité'), 'Toutes priorités');
  }

  function getState() {
    return {
      period: controls.period.value || '12m',
      dimension: controls.dimension.value || 'Marque',
      metric: controls.metric.value || 'revenue',
      brand: controls.brand.value,
      productType: controls.productType.value,
      market: controls.market.value,
      status: controls.status.value,
      priority: controls.priority.value,
      search: controls.search.value.trim().toLowerCase(),
      limit: controls.limit.value
    };
  }
  function metricLabel(metric) { return metric === 'qty' ? 'Quantités' : 'CA TTC'; }
  function valueLabel(metric, value, precise) {
    if (metric === 'qty') return fmtNum.format(value);
    return precise ? fmtEuro2.format(value) : fmtEuro.format(value);
  }
  function rowRevenue(row, state) {
    if (state.period === 'since9') return num(row['CA TTC depuis 9 mars']);
    return num(row[periodMap[state.period].revenueField]);
  }
  function rowQty(row, state) {
    if (state.period === 'since9') return num(row['Qtés depuis 9 mars']);
    return num(row[periodMap[state.period].qtyField]);
  }
  function rowMetric(row, state) { return state.metric === 'qty' ? rowQty(row, state) : rowRevenue(row, state); }

  function matchesFilters(row, state, options) {
    const ignoreMarket = options && options.ignoreMarket;
    if (state.brand && text(row['Marque']) !== state.brand) return false;
    if (state.productType && text(row['Type produit']) !== state.productType) return false;
    if (state.status && text(row['Statut fondation']) !== state.status) return false;
    if (state.priority && text(row['Priorité']) !== state.priority) return false;
    if (!ignoreMarket && state.period === 'since9' && state.market && text(row['Marché']) !== state.market) return false;
    if (state.search) {
      const haystack = [
        row['Marque'], row['Produit'], row['SKU'], row['Variante'], row['Type produit'],
        row['Marché'], row['Statut fondation'], row['Priorité'], row['Action recommandée'], row['Commentaire achat']
      ].map(text).join(' ').toLowerCase();
      if (!haystack.includes(state.search)) return false;
    }
    return true;
  }

  function syncConstraints(state) {
    if (state.dimension === 'Marché' && state.period !== 'since9') {
      controls.period.value = 'since9';
      state.period = 'since9';
    }
    controls.market.disabled = state.period !== 'since9';
    if (state.period !== 'since9') {
      controls.market.value = '';
      state.market = '';
    }
  }

  function sourceRows(state) {
    const source = state.period === 'since9' ? markets : references;
    return source.filter(row => matchesFilters(row, state));
  }

  function aggregate(rows, state) {
    const groups = new Map();
    rows.forEach(row => {
      const key = text(row[state.dimension]) || '(vide)';
      if (!groups.has(key)) {
        groups.set(key, {
          name: key,
          revenue: 0,
          qty: 0,
          orders: 0,
          rows: 0,
          skuSet: new Set(),
          productSet: new Set(),
          brandSet: new Set(),
          typeSet: new Set(),
          marketSet: new Set()
        });
      }
      const g = groups.get(key);
      g.revenue += rowRevenue(row, state);
      g.qty += rowQty(row, state);
      if (state.period !== 'since9') g.orders += num(row[periodMap[state.period].ordersField]);
      g.rows += 1;
      if (row['SKU']) g.skuSet.add(row['SKU']);
      if (row['Produit']) g.productSet.add(row['Produit']);
      if (row['Marque']) g.brandSet.add(row['Marque']);
      if (row['Type produit']) g.typeSet.add(row['Type produit']);
      if (row['Marché']) g.marketSet.add(row['Marché']);
    });
    const totalRevenue = Array.from(groups.values()).reduce((acc, g) => acc + g.revenue, 0);
    return Array.from(groups.values()).map(g => ({
      name: g.name,
      revenue: g.revenue,
      qty: g.qty,
      orders: g.orders,
      rows: g.rows,
      skus: g.skuSet.size,
      products: g.productSet.size,
      brands: g.brandSet.size,
      types: g.typeSet.size,
      markets: g.marketSet.size,
      avgPrice: g.qty ? g.revenue / g.qty : 0,
      share: totalRevenue ? g.revenue / totalRevenue : 0,
      metric: state.metric === 'qty' ? g.qty : g.revenue
    })).sort((a, b) => b.metric - a.metric || b.revenue - a.revenue || a.name.localeCompare(b.name, 'fr'));
  }

  function totals(rows, state) {
    const skuSet = new Set(), productSet = new Set(), brandSet = new Set(), typeSet = new Set(), marketSet = new Set();
    let revenue = 0, qty = 0, orders = 0;
    rows.forEach(row => {
      revenue += rowRevenue(row, state);
      qty += rowQty(row, state);
      if (state.period !== 'since9') orders += num(row[periodMap[state.period].ordersField]);
      if (row['SKU']) skuSet.add(row['SKU']);
      if (row['Produit']) productSet.add(row['Produit']);
      if (row['Marque']) brandSet.add(row['Marque']);
      if (row['Type produit']) typeSet.add(row['Type produit']);
      if (row['Marché']) marketSet.add(row['Marché']);
    });
    return { revenue, qty, orders, skus: skuSet.size, products: productSet.size, brands: brandSet.size, types: typeSet.size, markets: marketSet.size, rows: rows.length, avgPrice: qty ? revenue / qty : 0 };
  }

  function renderKpis(total, state) {
    const period = periodMap[state.period];
    const cards = [
      ['CA TTC', fmtEuro.format(total.revenue), period.label],
      ['Quantités', fmtNum.format(total.qty), 'ventes nettes / unités'],
      ['Prix moyen', total.qty ? fmtEuro2.format(total.avgPrice) : '—', 'CA / quantité'],
      ['SKU', fmtNum.format(total.skus), `${fmtNum.format(total.rows)} lignes source`],
      ['Marques', fmtNum.format(total.brands), `${fmtNum.format(total.products)} produits`],
      [state.period === 'since9' ? 'Marchés' : 'Commandes 12m', state.period === 'since9' ? fmtNum.format(total.markets) : fmtNum.format(total.orders), state.period === 'since9' ? 'FR, DE, ES, IT hors GB' : 'source 12 mois']
    ];
    byId('kpis').innerHTML = cards.map(([label, value, sub]) => `
      <article class="kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(sub)}</small></article>
    `).join('');
  }

  function niceShort(value) {
    const abs = Math.abs(value);
    if (abs >= 1000000) return `${fmtDec.format(value / 1000000)} M`;
    if (abs >= 1000) return `${fmtDec.format(value / 1000)} k`;
    return fmtDec.format(value);
  }
  function renderBarChart(target, items, options) {
    const metric = options.metric || 'revenue';
    const titleWidth = options.titleWidth || 210;
    const rows = items.filter(item => item.metric > 0).slice(0, options.max || 15);
    if (!rows.length) {
      target.innerHTML = '<div class="empty">Aucune donnée pour les filtres actifs.</div>';
      return;
    }
    const width = 860;
    const rowH = options.rowHeight || 34;
    const height = rows.length * rowH + 34;
    const max = Math.max(...rows.map(r => r.metric));
    const barMax = width - titleWidth - 150;
    const label = metricLabel(metric);
    let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)}"><rect x="0" y="0" width="${width}" height="${height}" rx="14" fill="transparent"/>`;
    rows.forEach((row, i) => {
      const y = 24 + i * rowH;
      const w = max ? Math.max(2, (row.metric / max) * barMax) : 0;
      const fill = i === 0 ? '#0f4c81' : i < 3 ? '#1d72b8' : '#7aa7d9';
      svg += `<text x="16" y="${y + 15}" font-size="12" font-weight="700" fill="#14213d">${escapeHtml(row.name.length > 34 ? row.name.slice(0, 32) + '…' : row.name)}</text>`;
      svg += `<rect x="${titleWidth}" y="${y}" width="${w}" height="18" rx="9" fill="${fill}"></rect>`;
      svg += `<text x="${titleWidth + w + 8}" y="${y + 14}" font-size="12" fill="#475569">${escapeHtml(valueLabel(metric, row.metric, false))}</text>`;
    });
    svg += `</svg>`;
    target.innerHTML = svg;
  }

  function renderPeriodChart(state) {
    const refState = Object.assign({}, state, { period: '12m' });
    const refFiltered = references.filter(row => matchesFilters(row, refState, { ignoreMarket: true }));
    const marketFiltered = markets.filter(row => matchesFilters(row, Object.assign({}, state, { period: 'since9' })));
    const rows = meta.periods.map(p => {
      let value = 0;
      if (p.id === 'since9') {
        marketFiltered.forEach(row => { value += state.metric === 'qty' ? num(row['Qtés depuis 9 mars']) : num(row['CA TTC depuis 9 mars']); });
      } else {
        refFiltered.forEach(row => { value += state.metric === 'qty' ? num(row[p.qtyField]) : num(row[p.revenueField]); });
      }
      return { name: p.label, metric: value, revenue: state.metric === 'revenue' ? value : 0, qty: state.metric === 'qty' ? value : 0 };
    });
    renderBarChart(byId('period-chart'), rows, { metric: state.metric, max: 4, titleWidth: 170, rowHeight: 42 });
  }

  function renderMarketChart(state) {
    const marketState = Object.assign({}, state, { period: 'since9' });
    const filtered = markets.filter(row => matchesFilters(row, marketState, { ignoreMarket: true }));
    const groups = aggregate(filtered, Object.assign({}, marketState, { dimension: 'Marché' }));
    renderBarChart(byId('market-chart'), groups, { metric: state.metric, max: 8, titleWidth: 110, rowHeight: 42 });
  }

  function renderStatusChart(rows, state) {
    const dim = state.priority ? 'Statut fondation' : 'Priorité';
    const groups = aggregate(rows, Object.assign({}, state, { dimension: dim }));
    renderBarChart(byId('status-chart'), groups, { metric: state.metric, max: 10, titleWidth: 190, rowHeight: 38 });
  }

  function limited(rows, state) {
    if (state.limit === 'all') return rows;
    return rows.slice(0, Number(state.limit || 50));
  }
  function badge(value) {
    const v = text(value);
    const cls = v.toLowerCase() === 'p1' ? ' badge--p1' : v.toLowerCase() === 'p2' ? ' badge--p2' : v.toLowerCase() === 'p3' ? ' badge--p3' : '';
    return v ? `<span class="badge${cls}">${escapeHtml(v)}</span>` : '';
  }
  function renderRankingTable(groups, state) {
    const rows = limited(groups, state);
    if (!rows.length) {
      byId('ranking-table').innerHTML = '<div class="empty">Aucun résultat agrégé.</div>';
      return;
    }
    const dimensionLabel = controls.dimension.options[controls.dimension.selectedIndex].textContent;
    byId('ranking-title').textContent = `Classement ${dimensionLabel.toLowerCase()}`;
    byId('ranking-subtitle').textContent = `${fmtNum.format(groups.length)} groupes · tri par ${metricLabel(state.metric).toLowerCase()}`;
    const html = `
      <table>
        <thead><tr>
          <th class="num">#</th><th>${escapeHtml(dimensionLabel)}</th><th class="num">CA TTC</th><th class="num">Qtés</th><th class="num">Prix moyen</th><th class="num">SKU</th><th class="num">Produits</th><th class="num">Marques</th><th class="num">% CA</th>
        </tr></thead>
        <tbody>${rows.map((r, i) => `<tr>
          <td class="num">${i + 1}</td>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td class="num">${fmtEuro2.format(r.revenue)}</td>
          <td class="num">${fmtNum.format(r.qty)}</td>
          <td class="num">${r.qty ? fmtEuro2.format(r.avgPrice) : '—'}</td>
          <td class="num">${fmtNum.format(r.skus)}</td>
          <td class="num">${fmtNum.format(r.products)}</td>
          <td class="num">${fmtNum.format(r.brands)}</td>
          <td class="num">${fmtPct.format(r.share)}</td>
        </tr>`).join('')}</tbody>
      </table>`;
    byId('ranking-table').innerHTML = html;
  }

  function detailColumns(state) {
    if (state.period === 'since9') {
      return ['Marché', 'Marque', 'Produit', 'SKU', 'Variante', 'Type produit', 'CA TTC depuis 9 mars', 'Qtés depuis 9 mars', 'Prix TTC', 'Statut fondation', 'Priorité', 'Action recommandée'];
    }
    const p = periodMap[state.period];
    const cols = ['Marque', 'Produit', 'SKU', 'Variante', 'Type produit', 'Prix TTC', p.revenueField, p.qtyField];
    if (p.ordersField) cols.push(p.ordersField);
    if (p.velocityField) cols.push(p.velocityField);
    return cols.concat(['CA TTC 12m', 'Qtés 12m', 'CA TTC 6m', 'Qtés 6m', 'CA TTC 3m', 'Qtés 3m', 'CA depuis 9 mars', 'Qtés depuis 9 mars', 'Statut fondation', 'Priorité', 'Action recommandée', 'Commentaire achat']);
  }
  function formatCell(col, value) {
    if (value === null || value === undefined || value === '') return '';
    if (/^CA|Prix|Ventes|Couverture/.test(col)) return typeof value === 'number' ? fmtEuro2.format(value) : escapeHtml(value);
    if (/Qtés|Commandes|Stock|SKU|Vélocité/.test(col)) return typeof value === 'number' ? fmtDec.format(value) : escapeHtml(value);
    if (col === 'Priorité') return badge(value);
    return escapeHtml(value);
  }
  function renderDetailTable(rows, state) {
    const sorted = rows.slice().sort((a, b) => rowMetric(b, state) - rowMetric(a, state));
    const visible = limited(sorted, state);
    const cols = detailColumns(state);
    byId('detail-subtitle').textContent = `${fmtNum.format(rows.length)} lignes filtrées · ${state.limit === 'all' ? 'toutes affichées' : `${visible.length} affichées`}`;
    if (!visible.length) {
      byId('detail-table').innerHTML = '<div class="empty">Aucune ligne source pour ces filtres.</div>';
      return;
    }
    const html = `<table><thead><tr>${cols.map(c => `<th${/CA|Prix|Qtés|Commandes|Vélocité/.test(c) ? ' class="num"' : ''}>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>` +
      visible.map(row => `<tr>${cols.map(c => `<td${/CA|Prix|Qtés|Commandes|Vélocité/.test(c) ? ' class="num"' : ''}>${formatCell(c, row[c])}</td>`).join('')}</tr>`).join('') +
      '</tbody></table>';
    byId('detail-table').innerHTML = html;
  }

  function csvEscape(value) {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/\r?\n/g, ' ');
    if (/[";,]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }
  function downloadCSV(filename, rows, columns) {
    const csv = [columns.join(';')].concat(rows.map(row => columns.map(c => csvEscape(row[c])).join(';'))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function exportAggregate() {
    const state = getState();
    syncConstraints(state);
    const rows = sourceRows(state);
    const groups = aggregate(rows, state).map(g => ({
      [state.dimension]: g.name,
      'CA TTC': Math.round(g.revenue * 100) / 100,
      'Quantités': g.qty,
      'Prix moyen': Math.round(g.avgPrice * 100) / 100,
      'SKU': g.skus,
      'Produits': g.products,
      'Marques': g.brands,
      'Types': g.types,
      'Marchés': g.markets,
      'Part CA': g.share
    }));
    downloadCSV(`dragon_bleu_agregat_${state.dimension}_${state.period}.csv`, groups, [state.dimension, 'CA TTC', 'Quantités', 'Prix moyen', 'SKU', 'Produits', 'Marques', 'Types', 'Marchés', 'Part CA']);
  }
  function exportDetail() {
    const state = getState();
    syncConstraints(state);
    const rows = sourceRows(state);
    const columns = state.period === 'since9' ? DATA.markets.columns.concat(['Variante', 'Prix TTC', 'Statut fondation', 'Priorité', 'Action recommandée', 'Commentaire achat']) : DATA.references.columns;
    downloadCSV(`dragon_bleu_lignes_${state.period}.csv`, rows, columns);
  }

  function renderSourceSummary() {
    byId('source-file').textContent = `Source : ${meta.sourceFile}`;
    byId('generated-on').textContent = `Généré le ${meta.generatedOn}`;
    const c = meta.counts;
    const t = meta.totals;
    byId('source-summary').innerHTML = [
      ['Références', fmtNum.format(c.referenceRows), 'lignes SKU'],
      ['Marques', fmtNum.format(c.brands), 'dans Références_fondation'],
      ['Produits', fmtNum.format(c.products), `${fmtNum.format(c.productTypes)} types`],
      ['Marchés hors GB', c.marketsEmbedded.join(', '), `${fmtNum.format(c.marketRowsEmbedded)} lignes`],
      ['CA 12 mois', fmtEuro2.format(t.ca12mReferences), 'références'],
      ['CA depuis 09/03 hors GB', fmtEuro2.format(t.caSince9MarketsExGB), 'marchés']
    ].map(([label, value, sub]) => `<div class="source-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(sub)}</small></div>`).join('');

    const modeRows = DATA.modeEmploi.rows || [];
    const modeNotes = modeRows
      .filter(row => row.some(v => v !== null && v !== undefined && text(v).trim() !== ''))
      .map(row => row.filter(v => v !== null && v !== undefined && text(v).trim() !== '').join(' — '));
    byId('source-notes').innerHTML = meta.sourceNotes.concat(modeNotes).map(n => `<p>${escapeHtml(n)}</p>`).join('');
  }

  function refresh() {
    const state = getState();
    syncConstraints(state);
    const rows = sourceRows(state);
    const groups = aggregate(rows, state);
    const total = totals(rows, state);
    const period = periodMap[state.period];

    renderKpis(total, state);
    byId('main-chart-title').textContent = `Top ${controls.dimension.options[controls.dimension.selectedIndex].textContent.toLowerCase()}`;
    byId('main-chart-subtitle').textContent = `${metricLabel(state.metric)} · ${period.label} · ${period.dateRange}`;
    renderBarChart(byId('main-chart'), groups, { metric: state.metric, max: 15, titleWidth: state.dimension === 'Produit' ? 300 : 210 });
    renderPeriodChart(state);
    renderMarketChart(state);
    renderStatusChart(rows, state);
    renderRankingTable(groups, state);
    renderDetailTable(rows, state);

    const marketNote = state.period === 'since9'
      ? `Vue depuis le 09/03/2026 calculée sur Marchés_depuis_9_mars, GB exclu. Marchés disponibles : ${meta.counts.marketsEmbedded.join(', ')}.`
      : `Vue ${period.label} calculée sur Références_fondation. Les filtres marché sont disponibles uniquement sur la période depuis le 09/03/2026.`;
    const zeroExcluded = meta.counts.marketGBRowsExcluded === 0 ? 'Aucune ligne GB trouvée dans l’onglet Marchés_depuis_9_mars ; la règle d’exclusion reste active.' : `${meta.counts.marketGBRowsExcluded} lignes GB exclues.`;
    byId('context-note').textContent = `${marketNote} ${zeroExcluded}`;
  }

  function resetFilters() {
    controls.period.value = '12m';
    controls.dimension.value = 'Marque';
    controls.metric.value = 'revenue';
    controls.brand.value = '';
    controls.productType.value = '';
    controls.market.value = '';
    controls.status.value = '';
    controls.priority.value = '';
    controls.search.value = '';
    controls.limit.value = '50';
    refresh();
  }

  initControls();
  renderSourceSummary();
  Object.values(controls).forEach(control => control.addEventListener('input', refresh));
  byId('reset').addEventListener('click', resetFilters);
  byId('export-aggregate').addEventListener('click', exportAggregate);
  byId('export-detail').addEventListener('click', exportDetail);
  byId('export-references').addEventListener('click', () => downloadCSV('dragon_bleu_references_fondation.csv', references, DATA.references.columns));
  byId('export-markets').addEventListener('click', () => downloadCSV('dragon_bleu_marches_depuis_9_mars_hors_gb.csv', markets, DATA.markets.columns.concat(['Variante', 'Prix TTC', 'Statut fondation', 'Priorité', 'Action recommandée', 'Commentaire achat'])));
  refresh();
})();
