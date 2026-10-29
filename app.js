'use strict'
const $ = s => document.querySelector(s)
const KEY = 'carteira-b3-v1'

/* Tipos de ativo: n = nome, c = cor, u = 1 se cotado em US$ */
const CL = {
  acao: { n: 'Ações Brasil', c: '#3A5BD9', u: 0 },
  fii: { n: 'FIIs', c: '#E0A21B', u: 0 },
  etfbr: { n: 'ETFs Brasil', c: '#B24F8A', u: 0 },
  rf: { n: 'Renda fixa', c: '#5E8F73', u: 0 },
  us: { n: 'Ações exterior', c: '#7B4FC9', u: 1 },
  etf: { n: 'ETFs exterior', c: '#1E9BB0', u: 1 },
  reit: { n: 'REITs exterior', c: '#D2603A', u: 1 }
}
const CRIT = {
  acao: [
    'Lucro e receita crescendo de forma consistente',
    'ROE e margens acima dos pares do setor',
    'Dívida líquida/EBITDA sob controle',
    'Histórico de dividendos e recompras',
    'P/L frente ao histórico da empresa e ao setor'
  ],
  fii: [
    'P/VP próximo ou abaixo de 1 em fundos de tijolo',
    'Vacância baixa e contratos longos',
    'Qualidade e diversificação dos imóveis ou recebíveis',
    'Dividend yield sustentável, não só um mês pontual',
    'Liquidez diária e taxas de administração'
  ],
  etfbr: [
    'Taxa de administração baixa',
    'Índice replicado e peso das maiores posições',
    'Liquidez e tamanho do fundo'
  ],
  rf: [
    'Rentabilidade líquida de IR frente ao CDI ou à inflação',
    'Risco do emissor e cobertura do FGC',
    'Prazo, liquidez e carência',
    'Risco de marcação a mercado antes do vencimento'
  ],
  us: [
    'Crescimento de receita e fluxo de caixa livre',
    'Vantagem competitiva e valuation razoável',
    'Concentração em uma economia ou setor',
    'Custos de câmbio e tributação de ganhos e dividendos no exterior'
  ],
  etf: [
    'Taxa de administração baixa',
    'Índice replicado e peso das maiores posições',
    'Liquidez e tamanho do fundo',
    'Moeda, tributação e custo de câmbio para o investidor brasileiro'
  ],
  reit: [
    'FFO e cobertura do dividendo',
    'Setor e taxa de ocupação',
    'Endividamento e vencimentos das dívidas',
    'Tributação sobre dividendos pagos a investidores brasileiros'
  ]
}
const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})
const PCT = v =>
  (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1).replace('.', ',') + '%'
const esc = s =>
  String(s == null ? '' : s).replace(
    /[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  )
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const opts = sel =>
  Object.entries(CL)
    .map(
      ([k, v]) =>
        `<option value="${k}"${k === sel ? ' selected' : ''}>${v.n}</option>`
    )
    .join('')

let S = { pos: [], watch: [], fx: 5 }

/* ---------- Armazenamento (localStorage) ---------- */
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S))
    $('#status').textContent = 'Salvo neste navegador'
  } catch (e) {
    $('#status').textContent = 'Não foi possível salvar'
  }
}
function adopt(d) {
  if (d && Array.isArray(d.pos))
    S = {
      pos: d.pos,
      watch: Array.isArray(d.watch) ? d.watch : [],
      fx: +d.fx > 0 ? +d.fx : 5
    }
}

/* ---------- Cálculo e tela ---------- */
function calc() {
  const rows = S.pos.map(p => {
    const r = CL[p.c] && CL[p.c].u ? S.fx : 1
    const inv = p.q * p.pm * r,
      val = p.q * p.pa * r
    return { p, inv, val, prov: p.pv * r, res: val - inv }
  })
  const t = rows.reduce(
    (a, x) => ({
      inv: a.inv + x.inv,
      val: a.val + x.val,
      prov: a.prov + x.prov
    }),
    { inv: 0, val: 0, prov: 0 }
  )
  return { rows, t }
}
function render() {
  const { rows, t } = calc(),
    res = t.val - t.inv
  $('#vTot').textContent = BRL.format(t.val)
  const chip = $('#vRes')
  chip.textContent = t.inv
    ? `${BRL.format(res)} (${PCT((res / t.inv) * 100)}) de resultado, sem contar proventos`
    : 'Importe ou adicione seu primeiro ativo para ver o resumo'
  chip.className = 'chip ' + (res >= 0 ? 'up' : 'dn')
  $('#sInv').textContent = t.inv ? BRL.format(t.inv) : '—'
  $('#sProv').textContent = t.inv ? BRL.format(t.prov) : '—'
  const ret = t.val + t.prov - t.inv
  $('#sRet').textContent = t.inv
    ? `${BRL.format(ret)} (${PCT((ret / t.inv) * 100)})`
    : '—'
  const by = {}
  rows.forEach(x => (by[x.p.c] = (by[x.p.c] || 0) + x.val))
  const ks = Object.keys(CL).filter(k => by[k] > 0)
  $('#bar').innerHTML = ks
    .map(
      k =>
        `<i style="flex:${by[k]};background:${CL[k].c}" title="${CL[k].n}"></i>`
    )
    .join('')
  $('#leg').innerHTML = ks
    .map(
      k =>
        `<li><i style="background:${CL[k].c}"></i>${CL[k].n} <b>${((by[k] / t.val) * 100).toFixed(0)}%</b> <span>${BRL.format(by[k])}</span></li>`
    )
    .join('')
  const inp = (f, v, l) =>
    `<input type="number" step="any" min="0" data-f="${f}" value="${v}" aria-label="${l}">`
  $('#tb').innerHTML = rows
    .map(
      x => `<tr data-id="${x.p.id}">
<td><input class="tk" data-f="t" value="${esc(x.p.t)}" aria-label="Ativo"><select data-f="c" aria-label="Tipo">${opts(x.p.c)}</select></td>
<td>${inp('q', x.p.q, 'Quantidade')}</td><td>${inp('pm', x.p.pm, 'Preço médio')}</td><td>${inp('pa', x.p.pa, 'Cotação atual')}</td>
<td class="n">${BRL.format(x.val)}</td>
<td class="n ${x.res >= 0 ? 'up' : 'dn'}">${BRL.format(x.res)}<small>${x.inv ? PCT((x.res / x.inv) * 100) : '—'}</small></td>
<td>${inp('pv', x.p.pv, 'Proventos recebidos')}</td>
<td class="n">${t.val ? ((x.val / t.val) * 100).toFixed(1).replace('.', ',') + '%' : '—'}</td>
<td><button class="ghost" data-del type="button">Remover</button></td></tr>`
    )
    .join('')
  $('#empty').hidden = rows.length > 0
  $('#fx').value = S.fx
  renderWatch()
}
function renderWatch() {
  $('#watch').innerHTML = S.watch.length
    ? S.watch
        .map(
          (w, i) =>
            `<div class="w"><div><b>${esc(w.t)}</b> <small>${esc(w.n)} · ${CL[w.c] ? CL[w.c].n : ''}</small></div><div class="acts" style="margin:0"><button class="ghost" data-wa="add" data-i="${i}" type="button">Adicionar à carteira</button><button class="ghost" data-wa="rm" data-i="${i}" type="button">Remover</button></div></div>`
        )
        .join('')
    : '<p class="empty" style="margin:0">Salve ideias para acompanhar aqui.</p>'
}
function tab(t) {
  document
    .querySelectorAll('.tabs button')
    .forEach(b => b.setAttribute('aria-selected', b.dataset.t === t))
  $('#cart').hidden = t !== 'cart'
  $('#idea').hidden = t !== 'idea'
}
function prefill(t, c) {
  tab('cart')
  $('#nT').value = t
  $('#nC').value = c
  $('#nQ').focus()
}
const crit = () => {
  $('#crit').innerHTML = CRIT[$('#cat').value]
    .map(x => `<li>${x}</li>`)
    .join('')
}

/* ---------- Importação da B3 ---------- */
const n = s =>
  String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
const num = v => {
  if (typeof v === 'number') return v
  let s = String(v == null ? '' : v).replace(/[^\d,.\-]/g, '')
  if (!s || s === '-') return 0
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  return parseFloat(s) || 0
}
/* Procura a coluna pelo nome (sem acento, maiúsculas ou ordem), na ordem de prioridade dada */
const pick = (r, ...ks) => {
  const K = Object.keys(r)
  for (const k of ks) {
    const f = K.find(x => n(x) === k) ?? K.find(x => n(x).includes(k))
    if (f !== undefined) return r[f]
  }
  return ''
}
const clean = t => {
  t = String(t).trim().toUpperCase()
  return /^[A-Z]{4}\d{1,2}F$/.test(t) ? t.slice(0, -1) : t
}
const tkClass = t => (/^[A-Z]{4}11$/.test(t) ? 'fii' : 'acao')
const sheetClass = nm => {
  nm = n(nm)
  return /renda fixa|tesouro|cdb|lci|lca|debenture/.test(nm)
    ? 'rf'
    : /etf/.test(nm)
      ? 'etfbr'
      : /fundo/.test(nm)
        ? 'fii'
        : /acao|acoes|bdr/.test(nm)
          ? 'acao'
          : null
}
function csv(t) {
  const L = t
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(x => x.trim())
  const d =
    (L[0].match(/;/g) || []).length >= (L[0].match(/,/g) || []).length
      ? ';'
      : ','
  const sp = l => {
    const o = []
    let c = '',
      q = 0
    for (const ch of l) {
      if (ch === '"') q = !q
      else if (ch === d && !q) {
        o.push(c)
        c = ''
      } else c += ch
    }
    o.push(c)
    return o
  }
  const h = sp(L[0])
  return L.slice(1).map(l => {
    const v = sp(l),
      r = {}
    h.forEach((k, i) => (r[k] = v[i] ?? ''))
    return r
  })
}
async function readFile(f) {
  if (/\.csv$/i.test(f.name)) {
    const buf = await f.arrayBuffer()
    let txt
    try {
      txt = new TextDecoder('utf-8', { fatal: true }).decode(buf)
    } catch (e) {
      txt = new TextDecoder('windows-1252').decode(buf)
    }
    return [{ name: f.name, rows: csv(txt) }]
  }
  if (!window.XLSX) throw new Error('xlsx')
  const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' })
  return wb.SheetNames.map(nm => ({
    name: nm,
    rows: XLSX.utils.sheet_to_json(wb.Sheets[nm], { defval: '' })
  }))
}
function fromPosition(rows, cls) {
  const out = []
  for (const r of rows) {
    const prod = String(pick(r, 'produto')).trim()
    const q = num(pick(r, 'quantidade'))
    const rf = cls === 'rf'
    const t = rf
      ? prod.slice(0, 40) || String(pick(r, 'codigo'))
      : clean(pick(r, 'codigo de negociacao', 'codigo') || prod.split(' - ')[0])
    if (!t || !(q > 0)) continue
    const val = num(
      pick(
        r,
        'valor atualizado mtm',
        'valor atualizado curva',
        'valor atualizado',
        'valor liquido',
        'valor bruto'
      )
    )
    let pa = num(
      pick(
        r,
        'preco de fechamento',
        'preco atualizado mtm',
        'preco atualizado curva',
        'preco atualizado'
      )
    )
    if (!pa && val) pa = val / q
    const inv = num(pick(r, 'valor aplicado'))
    out.push({ t, c: cls, q, pa, pm: inv > 0 ? inv / q : 0 })
  }
  return out
}
/* Preço médio pelo método do custo médio, a partir das compras e vendas do extrato de Negociação */
function fromTrades(rows) {
  const d = v => {
    const m = String(v).match(/(\d{2})\/(\d{2})\/(\d{4})/)
    return m ? +(m[3] + m[2] + m[1]) : 0
  }
  const L = rows
    .map(r => ({
      t: clean(pick(r, 'codigo de negociacao')),
      s: n(pick(r, 'tipo de movimentacao')),
      q: num(pick(r, 'quantidade')),
      p: num(pick(r, 'preco')),
      d: d(pick(r, 'data do negocio', 'data'))
    }))
    .filter(x => x.t && x.q > 0 && /compra|venda/.test(x.s))
    .sort((a, b) => a.d - b.d)
  const A = {}
  L.forEach(x => {
    const a = A[x.t] || (A[x.t] = { q: 0, k: 0 })
    if (/compra/.test(x.s)) {
      a.q += x.q
      a.k += x.q * x.p
    } else {
      const m = a.q ? a.k / a.q : 0
      a.q -= x.q
      a.k -= m * x.q
      if (a.q <= 0) {
        a.q = 0
        a.k = 0
      }
    }
  })
  return Object.entries(A)
    .filter(([, a]) => a.q > 0)
    .map(([t, a]) => ({ t, q: a.q, pm: a.k / a.q, c: tkClass(t) }))
}
async function importFiles(files) {
  const msg = $('#impMsg')
  msg.className = 'msg'
  msg.textContent = 'Lendo arquivos…'
  const pos = [],
    trd = []
  try {
    for (const f of files) {
      for (const sh of await readFile(f)) {
        if (!sh.rows.length) continue
        const h = Object.keys(sh.rows[0]).map(n)
        if (h.includes('tipo de movimentacao') && h.includes('preco')) {
          trd.push(...fromTrades(sh.rows))
          continue
        }
        if (!h.some(x => x.startsWith('quantidade'))) continue
        const cls =
          sheetClass(sh.name) ||
          (h.some(x => x.includes('indexador') || x.includes('vencimento'))
            ? 'rf'
            : 'acao')
        pos.push(...fromPosition(sh.rows, cls))
      }
    }
  } catch (e) {
    msg.className = 'msg err'
    msg.textContent =
      e.message === 'xlsx'
        ? 'Não consegui abrir o .xlsx porque a biblioteca de leitura não carregou. Conecte-se à internet (ou veja o README) ou salve o arquivo como .csv.'
        : 'Não consegui ler este arquivo. Confira se é um extrato do Portal do Investidor da B3.'
    return
  }
  if (!pos.length && !trd.length) {
    msg.className = 'msg err'
    msg.textContent =
      'Não encontrei posições nem negociações neste arquivo. Use os extratos de Posição ou de Negociação da B3.'
    return
  }
  /* soma linhas repetidas do mesmo ativo (várias contas ou corretoras) */
  const m = {}
  pos.forEach(x => {
    const o = m[x.t]
    if (!o) m[x.t] = { ...x }
    else {
      const q = o.q + x.q
      o.pm = ((o.pm || o.pa) * o.q + (x.pm || x.pa) * x.q) / q
      o.pa = x.pa || o.pa
      o.q = q
    }
  })
  let add = 0,
    upd = 0,
    semPm = 0
  const seen = new Set()
  Object.values(m).forEach(x => {
    seen.add(x.t)
    const e = S.pos.find(p => p.t === x.t)
    if (e) {
      e.q = x.q
      e.pa = x.pa || e.pa
      if (x.pm) e.pm = x.pm
      upd++
    } else {
      if (!x.pm) semPm++
      S.pos.push({
        id: uid(),
        t: x.t,
        c: x.c,
        q: x.q,
        pm: x.pm || x.pa,
        pa: x.pa || x.pm,
        pv: 0
      })
      add++
    }
  })
  if (pos.length && $('#impClean').checked)
    S.pos = S.pos.filter(p => seen.has(p.t) || CL[p.c].u)
  trd.forEach(x => {
    const e = S.pos.find(p => p.t === x.t)
    if (e) {
      e.pm = x.pm
      upd++
      semPm = Math.max(0, semPm - 1)
    } else {
      S.pos.push({
        id: uid(),
        t: x.t,
        c: x.c,
        q: x.q,
        pm: x.pm,
        pa: x.pm,
        pv: 0
      })
      add++
    }
  })
  save()
  render()
  msg.className = 'msg up'
  msg.textContent =
    `Importação concluída: ${add} novo(s) e ${upd} atualizado(s).` +
    (semPm
      ? ` Em ${semPm} ativo(s) novo(s) usei a cotação como preço médio, porque o extrato de Posição não traz esse dado. Importe também o extrato de Negociação para corrigir.`
      : '') +
    ' Confira os tipos na tabela.'
}

/* ---------- Eventos ---------- */
document
  .querySelectorAll('.tabs button')
  .forEach(b => (b.onclick = () => tab(b.dataset.t)))
$('#nC').innerHTML = opts('acao')
$('#cat').innerHTML = opts('us')
$('#cat').onchange = crit
$('#fx').onchange = e => {
  const v = +e.target.value
  if (v > 0) {
    S.fx = v
    save()
    render()
  }
}
$('#addBtn').onclick = () => {
  const t = $('#nT').value.trim().toUpperCase(),
    c = $('#nC').value,
    q = +$('#nQ').value,
    pm = +$('#nPm').value
  if (!t || !(q > 0) || !(pm > 0)) {
    $('#addErr').textContent = 'Preencha ativo, quantidade e preço médio.'
    return
  }
  $('#addErr').textContent = ''
  S.pos.push({
    id: uid(),
    t,
    c,
    q,
    pm,
    pa: +$('#nPa').value || pm,
    pv: +$('#nPv').value || 0
  })
  ;['nT', 'nQ', 'nPm', 'nPa', 'nPv'].forEach(i => ($('#' + i).value = ''))
  save()
  render()
}
$('#tb').addEventListener('change', e => {
  const tr = e.target.closest('tr'),
    f = e.target.dataset.f
  const p = tr && f && S.pos.find(x => x.id === tr.dataset.id)
  if (!p) return
  p[f] =
    f === 't'
      ? e.target.value.trim().toUpperCase()
      : f === 'c'
        ? e.target.value
        : Math.max(0, +e.target.value || 0)
  save()
  render()
})
$('#tb').addEventListener('click', e => {
  if (!e.target.matches('[data-del]')) return
  const id = e.target.closest('tr').dataset.id
  S.pos = S.pos.filter(x => x.id !== id)
  save()
  render()
})
$('#watch').addEventListener('click', e => {
  const a = e.target.dataset.wa,
    i = +e.target.dataset.i
  if (!a) return
  if (a === 'add') prefill(S.watch[i].t, S.watch[i].c)
  else {
    S.watch.splice(i, 1)
    save()
    renderWatch()
  }
})
$('#wAdd').onclick = () => {
  const t = $('#wT').value.trim().toUpperCase()
  if (!t) return
  S.watch.push({ t, n: $('#wN').value.trim(), c: $('#cat').value })
  $('#wT').value = ''
  $('#wN').value = ''
  save()
  renderWatch()
}
$('#cp').onclick = async () => {
  const { rows, t } = calc()
  const by = {}
  rows.forEach(x => (by[x.p.c] = (by[x.p.c] || 0) + x.val))
  const comp =
    Object.keys(by)
      .map(k => `${CL[k].n} ${((by[k] / t.val) * 100).toFixed(0)}%`)
      .join(', ') || 'ainda sem ativos'
  const held = S.pos.map(p => p.t).join(', ') || 'nenhum'
  const p = `Você é um analista de investimentos educacional. Hoje é ${new Date().toLocaleDateString('pt-BR')}.
Liste 6 ideias de "${$('#cat').selectedOptions[0].text}" para um investidor brasileiro com objetivo "${$('#obj').value}" e perfil de risco "${$('#per').value}".
Composição atual da carteira: ${comp}. Ativos que ele já tem (evite repetir e favoreça diversificação): ${held}.
Regras: use apenas ativos reais e conhecidos, com o ticker correto; não invente números, preços ou rentabilidades; para cada ideia, dê a tese em 1 ou 2 frases e o principal risco em 1 frase; avise que não é recomendação personalizada.`
  const ta = $('#prompt')
  ta.value = p
  ta.hidden = false
  try {
    await navigator.clipboard.writeText(p)
    $('#cpMsg').textContent = 'Pedido copiado. Cole no Claude.'
  } catch (e) {
    $('#cpMsg').textContent = 'Copie o texto abaixo e cole no Claude.'
  }
}
$('#bkExp').onclick = () => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' })
  )
  a.download = 'carteira-backup.json'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
$('#bkImp').onchange = async e => {
  const f = e.target.files[0]
  if (f) {
    try {
      adopt(JSON.parse(await f.text()))
      save()
      render()
    } catch (x) {
      $('#status').textContent = 'Backup inválido'
    }
  }
  e.target.value = ''
}
$('#file').onchange = e => {
  if (e.target.files.length) importFiles([...e.target.files])
  e.target.value = ''
}
const drop = $('#drop')
;['dragenter', 'dragover'].forEach(ev =>
  drop.addEventListener(ev, e => {
    e.preventDefault()
    drop.classList.add('over')
  })
)
;['dragleave', 'drop'].forEach(ev =>
  drop.addEventListener(ev, e => {
    e.preventDefault()
    drop.classList.remove('over')
  })
)
drop.addEventListener('drop', e => {
  if (e.dataTransfer.files.length) importFiles([...e.dataTransfer.files])
})

/* ---------- Início ---------- */
try {
  adopt(JSON.parse(localStorage.getItem(KEY)))
} catch (e) {
  /* primeira vez */
}
crit()
render()
$('#status').textContent = 'Dados salvos neste navegador'
