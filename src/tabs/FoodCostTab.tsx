import { useEffect, useMemo, useState } from 'react';
import { useAppData } from '../context/AppContext';
import { PBar } from '../components/PBar';
import { StatCard } from '../components/StatCard';
import {
  GRN,
  MUT,
  ORA,
  ORAL,
  PR,
  RED,
  REDL,
  SEC,
  SECS,
  CAMP_NAMES,
} from '../constants';
import { fN, formatDateDisplay, gM, gW, normalizeDate } from '../utils/helpers';
import { getDishCost } from '../utils/leave';
import { toLegacyDish } from '../lib/mappers';
import { supabase } from '../lib/supabase';
import type { Section } from '../types/database';

type FcSub = 'dashboard' | 'main' | 'sections' | 'issue' | 'recipes';
type InvSub = 'overview' | 'receive' | 'add';

export function FoodCostTab() {
  const { campId, dishes, kots, inventory, recipes } = useAppData();

  const [fcSub, setFcSub] = useState<FcSub>('dashboard');
  const [invSub, setInvSub] = useState<InvSub>('overview');
  const [fcPer, setFcPer] = useState('all');
  const [fcKey, setFcKey] = useState('');

  const [pur_i, setPurI] = useState('');
  const [pur_q, setPurQ] = useState('');
  const [pur_p, setPurP] = useState('');
  const [pur_d, setPurD] = useState('');

  const [iN, setIN] = useState('');
  const [iU, setIU] = useState('kg');
  const [iP, setIP] = useState('');
  const [iO, setIO] = useState('');
  const [iM, setIM] = useState('');

  const [iss_i, setIssI] = useState('');
  const [iss_s, setIssS] = useState<Section>('indian');
  const [iss_q, setIssQ] = useState('');
  const [iss_d, setIssD] = useState('');
  const [iss_r, setIssR] = useState('');

  const [rD, setRD] = useState('');
  const [rI, setRI] = useState('');
  const [rG, setRG] = useState('');

  const [dcD, setDcD] = useState('');
  const [dcV, setDcV] = useState('');

  const cd = useMemo(() => dishes.dishes.map(toLegacyDish), [dishes.dishes]);
  const ingr = inventory.ingredients;
  const { purchases, issuances, openingStock } = inventory;
  const { recipes: recipeMap, directCosts } = recipes;

  const fcDates = useMemo(
    () => ({
      day: [...new Set(kots.kots.map((r) => normalizeDate(r.date)))].sort(),
      week: [...new Set(kots.kots.map((r) => gW(r.date)))].sort(),
      month: [...new Set(kots.kots.map((r) => gM(r.date)))].sort(),
    }),
    [kots.kots],
  );

  const fcKots = useMemo(() => {
    let k = kots.kots;
    if (fcPer !== 'all' && fcKey) {
      k = k.filter((r) => {
        const date = normalizeDate(r.date);
        return fcPer === 'day' ? date === fcKey : fcPer === 'week' ? gW(date) === fcKey : gM(date) === fcKey;
      });
    }
    return k;
  }, [kots.kots, fcPer, fcKey]);

  const getDC = (id: string) =>
    getDishCost(id, directCosts, recipeMap, ingr);

  const diCons = useMemo(
    () =>
      cd.map((d) => {
        const gK = fcKots.filter((k) => k.dish_id === d.id && k.type === 'Guest');
        const mK = fcKots.filter((k) => k.dish_id === d.id && k.type === 'Manager');
        const gQ = gK.reduce((s, k) => s + k.qty, 0);
        const mQ = mK.reduce((s, k) => s + k.qty, 0);
        const sC = getDC(d.id);
        const cG = Math.round(sC * gQ);
        const cM = Math.round(sC * mQ);
        return {
          ...d,
          gQ,
          mQ,
          totQ: gQ + mQ,
          sC: Math.round(sC * 100) / 100,
          cG,
          cM,
          totC: cG + cM,
          hC: !!(directCosts[d.id] != null || (recipeMap[d.id] || []).length > 0),
        };
      }),
    [cd, fcKots, ingr, recipeMap, directCosts],
  );

  const fcSum = useMemo(() => {
    const tC = diCons.reduce((s, d) => s + d.totC, 0);
    const mC = diCons.reduce((s, d) => s + d.cM, 0);
    const nFC = tC - mC;
    const tR = diCons.reduce((s, d) => s + d.gQ, 0);
    const fcP = 0;
    const oV = ingr.reduce((s, i) => s + (openingStock[i.id] ?? 0) * i.price, 0);
    const pV = purchases.reduce((s, p) => s + p.qty * p.price, 0);
    return { tC, mC, nFC, tR, fcP, oV, pV, spV: pV, closing: Math.max(0, oV + pV - nFC) };
  }, [diCons, ingr, openingStock, purchases]);

  useEffect(() => {
    if (!pur_i) return;
    const ing = ingr.find((i) => i.id === pur_i);
    if (ing) setPurP(String(ing.price));
  }, [pur_i, ingr]);

  const purIng = useMemo(
    () => (pur_i ? ingr.find((i) => i.id === pur_i) : undefined),
    [pur_i, ingr],
  );
  const issIng = useMemo(
    () => (iss_i ? ingr.find((i) => i.id === iss_i) : undefined),
    [iss_i, ingr],
  );

  const mainStore = useMemo(
    () =>
      ingr.map((i) => {
        const openStock = openingStock[i.id] ?? 0;
        const pur = purchases
          .filter((p) => p.ingredient_id === i.id)
          .reduce((s, p) => s + p.qty, 0);
        const iss = issuances
          .filter((x) => x.ingredient_id === i.id)
          .reduce((s, x) => s + x.qty, 0);
        const cur = Math.max(0, openStock + pur - iss);
        const mn = i.min_stock || 0;
        const mx = openStock * 1.5;
        return {
          ...i,
          openStock,
          minStock: i.min_stock,
          pur,
          iss,
          cur: Math.round(cur * 100) / 100,
          costVal: Math.round(cur * i.price),
          status: cur <= mn ? ('low' as const) : cur >= mx ? ('over' as const) : ('ok' as const),
        };
      }),
    [ingr, purchases, issuances, openingStock],
  );

  const lowCount = mainStore.filter((i) => i.status === 'low').length;

  async function addIngr() {
    if (!iN || !iP) return;
    await inventory.addIngredient({
      name: iN,
      unit: iU,
      price: +iP,
      min_stock: +iM || 0,
      opening_stock: +iO || 0,
    });
    setIN('');
    setIP('');
    setIO('');
    setIM('');
  }

  async function addPurch() {
    if (!pur_i || !pur_q || !pur_p || !pur_d) return;
    await inventory.addPurchase({
      ingredient_id: pur_i,
      qty: +pur_q,
      price: +pur_p,
      date: pur_d,
    });
    setPurI('');
    setPurQ('');
    setPurP('');
    setPurD('');
  }

  async function addIss() {
    if (!iss_i || !iss_q || !iss_d) return;
    await inventory.addIssuance({
      ingredient_id: iss_i,
      to_section: iss_s,
      qty: +iss_q,
      date: iss_d,
      reason: iss_r,
    });
    setIssI('');
    setIssQ('');
    setIssD('');
    setIssR('');
  }

  async function addRecLine() {
    if (!rD || !rI || !rG) return;
    await recipes.addRecipeLine(rD, rI, +rG);
    setRI('');
    setRG('');
  }

  async function removeRecLine(dishId: string, ingredientId: string) {
    const { error } = await supabase
      .from('recipe_lines')
      .delete()
      .eq('dish_id', dishId)
      .eq('ingredient_id', ingredientId);
    if (error) throw error;
    recipes.refresh();
  }

  async function saveDirectCost() {
    if (!dcD || !dcV) return;
    await recipes.setDirectCost(dcD, +dcV);
    setDcD('');
    setDcV('');
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, color: PR, marginBottom: 4 }}>
        Food Cost — {CAMP_NAMES[campId]}
      </h2>
      <p style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 12 }}>
        Live figures — updates as KOTs are punched
      </p>
      <div className="tab-bar">
        {(
          [
            ['dashboard', 'Dashboard'],
            ['main', 'Main Store'],
            ['sections', 'Section Stores'],
            ['issue', 'Issue from Store'],
            ['recipes', 'Recipes'],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            className={'tab' + (fcSub === k ? ' active' : '')}
            onClick={() => {
              setFcSub(k);
              setInvSub('overview');
            }}
          >
            {l}
            {k === 'main' && lowCount > 0 && (
              <span
                style={{
                  background: RED,
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '0 4px',
                  fontSize: 9,
                  marginLeft: 3,
                }}
              >
                {lowCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {fcSub === 'dashboard' && (
        <div>
          <PBar per={fcPer} setPer={setFcPer} pKey={fcKey} setPKey={setFcKey} opts={fcDates} />
          <div className="stats">
            <StatCard label="Opening Stock" val={fcSum.oV} />
            <StatCard label="(+) Purchases" val={fcSum.pV} color={GRN} />
            <StatCard label="Total Consumption" val={fcSum.tC} />
            <StatCard label="(-) Manager Meals" val={fcSum.mC} color={RED} />
            <StatCard label="Net Food Cost" val={fcSum.nFC} />
            <StatCard label="Guest Covers" val={fcSum.tR} color={GRN} />
          </div>
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>COFS Statement</div>
            {(
              [
                ['Opening Stock', fcSum.oV, ''],
                ['(+) Purchases', fcSum.pV, GRN],
                ['Total Available', fcSum.oV + fcSum.pV, PR],
                ['(-) Total Consumption', fcSum.tC, RED],
                ['(-) Manager Meal Offset', fcSum.mC, MUT],
                ['(=) Net Food Cost', fcSum.nFC, PR],
                ['Closing Stock (Est.)', fcSum.closing, GRN],
              ] as const
            ).map(([l, v, col], i) => (
              <div
                key={l}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '7px 0',
                  borderBottom: i < 7 ? '1px solid #f0ece6' : 'none',
                  background: i === 5 ? '#fff8f0' : 'transparent',
                  paddingLeft: i === 5 ? 5 : 0,
                }}
              >
                <span style={{ fontSize: 13, fontStyle: i === 2 || i === 5 ? 'italic' : 'normal' }}>
                  {l}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: i === 5 ? 500 : 400,
                    color: col || '#2a2418',
                  }}
                >
                  Rs {fN(v)}
                </span>
              </div>
            ))}
          </div>
          {diCons.filter((d) => d.hC).length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
              <table style={{ minWidth: 680 }}>
                <thead>
                  <tr>
                    <th>Dish</th>
                    <th>Section</th>
                    <th>Std Cost</th>
                    <th>Ref Cost</th>
                    <th>G.Qty</th>
                    <th>M.Qty</th>
                    <th>Food Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {diCons
                    .filter((d) => d.hC)
                    .sort((a, b) => b.cG - a.cG)
                    .map((d) => {
                      const sec = SECS[d.section] || { label: d.section, color: MUT };
                      return (
                        <tr key={d.id}>
                          <td
                            style={{
                              maxWidth: 130,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {d.name}
                          </td>
                          <td style={{ color: sec.color, fontStyle: 'italic', fontSize: 10 }}>
                            {sec.label}
                          </td>
                          <td>Rs {d.sC}</td>
                          <td>Rs {fN(d.costPrice)}</td>
                          <td>{d.gQ}</td>
                          <td style={{ color: RED }}>{d.mQ}</td>
                          <td>Rs {fN(d.cG)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {fcSub === 'main' && (
        <div>
          <div className="tab-bar">
            {(
              [
                ['overview', 'Overview'],
                ['receive', 'Receive Stock'],
                ['add', 'Add Ingredient'],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                className={'tab' + (invSub === k ? ' active' : '')}
                style={{ fontSize: 12, padding: '6px 12px' }}
                onClick={() => setInvSub(k)}
              >
                {l}
              </button>
            ))}
          </div>
          {invSub === 'overview' && (
            <div>
              <div className="stats">
                <StatCard
                  label="Stock Value"
                  val={mainStore.reduce((s, i) => s + i.costVal, 0)}
                />
                <StatCard
                  label="Low Stock"
                  val={mainStore.filter((i) => i.status === 'low').length}
                  color={RED}
                  prefix=""
                />
                <StatCard
                  label="Overstock"
                  val={mainStore.filter((i) => i.status === 'over').length}
                  color={ORA}
                  prefix=""
                />
                <StatCard
                  label="Optimum"
                  val={mainStore.filter((i) => i.status === 'ok').length}
                  color={GRN}
                  prefix=""
                />
              </div>
              {lowCount > 0 && (
                <div className="alert">
                  Low Stock:{' '}
                  {mainStore
                    .filter((i) => i.status === 'low')
                    .map((i) => i.name)
                    .join(', ')}
                </div>
              )}
              <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Unit</th>
                      <th>Opening</th>
                      <th>Min</th>
                      <th>Purchased</th>
                      <th>Issued</th>
                      <th>Current</th>
                      <th>Unit Rs</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...mainStore]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((i) => {
                        const stC = i.status === 'low' ? RED : i.status === 'over' ? ORA : GRN;
                        const stB =
                          i.status === 'low' ? REDL : i.status === 'over' ? ORAL : 'transparent';
                        return (
                          <tr key={i.id} style={{ background: stB }}>
                            <td>{i.name}</td>
                            <td>{i.unit}</td>
                            <td>{i.openStock}</td>
                            <td style={{ color: MUT }}>{i.minStock || 0}</td>
                            <td style={{ color: GRN }}>{i.pur > 0 ? '+' + i.pur : 0}</td>
                            <td style={{ color: RED }}>{i.iss}</td>
                            <td style={{ fontWeight: 500, color: stC }}>{i.cur}</td>
                            <td>Rs {i.price}</td>
                            <td>Rs {fN(i.costVal)}</td>
                            <td style={{ color: stC, fontStyle: 'italic', fontSize: 11 }}>
                              {i.status === 'low' ? 'Low' : i.status === 'over' ? 'Over' : 'OK'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {invSub === 'receive' && (
            <div>
              <div className="card">
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                  Receive Stock into Main Store
                </div>
                <div className="row">
                  <div className="field">
                    <label>Ingredient</label>
                    <select
                      value={pur_i}
                      onChange={(e) => setPurI(e.target.value)}
                      style={{ width: 195 }}
                    >
                      <option value="">Select</option>
                      {ingr.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Qty{purIng ? ` (${purIng.unit})` : ''}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number"
                        min="0"
                        value={pur_q}
                        onChange={(e) => setPurQ(e.target.value)}
                        style={{ width: 80 }}
                        placeholder={purIng ? `e.g. 10` : ''}
                      />
                      {purIng && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: PR,
                            background: '#f0ece6',
                            padding: '4px 8px',
                            borderRadius: 4,
                            minWidth: 36,
                            textAlign: 'center',
                          }}
                        >
                          {purIng.unit}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="field">
                    <label>Price Rs / {purIng?.unit ?? 'unit'}</label>
                    <input
                      type="number"
                      min="0"
                      value={pur_p}
                      onChange={(e) => setPurP(e.target.value)}
                      style={{ width: 100 }}
                    />
                  </div>
                  <div className="field">
                    <label>Date</label>
                    <input
                      type="date"
                      value={pur_d}
                      onChange={(e) => setPurD(e.target.value)}
                      style={{ width: 150 }}
                    />
                  </div>
                  <button type="button" className="btn" style={{ alignSelf: 'flex-end' }} onClick={addPurch}>
                    Receive
                  </button>
                </div>
                {purIng && (
                  <div style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginTop: 6 }}>
                    Enter quantity in <strong>{purIng.unit}</strong> — same unit as opening stock and purchases for{' '}
                    {purIng.name}.
                  </div>
                )}
              </div>
              {purchases.length > 0 && (
                <div className="card" style={{ padding: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Ingredient</th>
                        <th>Qty</th>
                        <th>Price/unit</th>
                        <th>Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...purchases].reverse().map((p) => {
                        const ing = ingr.find((x) => x.id === p.ingredient_id);
                        return (
                          <tr key={p.id}>
                            <td>{formatDateDisplay(p.date)}</td>
                            <td>{ing?.name || '—'}</td>
                            <td style={{ color: GRN }}>
                              +{p.qty} {ing?.unit || ''}
                            </td>
                            <td>Rs {p.price}</td>
                            <td style={{ color: GRN, fontWeight: 500 }}>
                              Rs {fN(Math.round(p.qty * p.price))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {invSub === 'add' && (
            <div>
              <div className="card">
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Add New Ingredient</div>
                <div className="row">
                  <div className="field">
                    <label>Name</label>
                    <input
                      placeholder="e.g. Saffron"
                      value={iN}
                      onChange={(e) => setIN(e.target.value)}
                      style={{ width: 165 }}
                    />
                  </div>
                  <div className="field">
                    <label>Unit</label>
                    <select value={iU} onChange={(e) => setIU(e.target.value)} style={{ width: 80 }}>
                      {['kg', 'ltr', 'nos', 'gm'].map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Price Rs/unit</label>
                    <input
                      type="number"
                      value={iP}
                      onChange={(e) => setIP(e.target.value)}
                      style={{ width: 95 }}
                    />
                  </div>
                  <div className="field">
                    <label>Opening Stock</label>
                    <input
                      type="number"
                      value={iO}
                      onChange={(e) => setIO(e.target.value)}
                      style={{ width: 95 }}
                    />
                  </div>
                  <div className="field">
                    <label>Min Stock</label>
                    <input
                      type="number"
                      value={iM}
                      onChange={(e) => setIM(e.target.value)}
                      style={{ width: 80 }}
                    />
                  </div>
                  <button type="button" className="btn" style={{ alignSelf: 'flex-end' }} onClick={addIngr}>
                    Add
                  </button>
                </div>
              </div>
              <div className="card" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Unit</th>
                      <th>Opening</th>
                      <th>Min Stock</th>
                      <th>Price Rs/unit</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingr.map((i) => (
                      <tr key={i.id}>
                        <td>{i.name}</td>
                        <td>{i.unit}</td>
                        <td>{openingStock[i.id] ?? 0}</td>
                        <td>{i.min_stock || 0}</td>
                        <td>Rs {i.price}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-red btn-sm"
                            onClick={() => inventory.removeIngredient(i.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {fcSub === 'sections' && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: PR, marginBottom: 4 }}>
            Section Dry Stores
          </h3>
          <p style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 14 }}>
            Auto-debits as KOTs are punched for dishes in each section
          </p>
          {Object.entries(SECS).map(([sk, sv]) => {
            const rows = ingr
              .map((i) => {
                const rcvd = issuances
                  .filter(
                    (x) => x.ingredient_id === i.id && x.to_section === sk,
                  )
                  .reduce((s, x) => s + x.qty, 0);
                let consG = 0;
                kots.kots.forEach((k) => {
                  const dish = cd.find((d) => d.id === k.dish_id);
                  if (!dish || dish.section !== sk) return;
                  const ri = (recipeMap[k.dish_id] || []).find((r) => r.ingredient_id === i.id);
                  if (ri) consG += ri.grams * k.qty;
                });
                const cur = Math.max(0, (rcvd * 1000 - consG) / 1000);
                return {
                  ...i,
                  rcvd,
                  cons: Math.round(consG) / 1000,
                  cur: Math.round(cur * 100) / 100,
                  costVal: Math.round(cur * i.price),
                };
              })
              .filter((i) => i.rcvd > 0 || i.cons > 0);
            return (
              <div key={sk} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: sv.color }}>
                    {sv.label} Dry Store
                  </span>
                  <span
                    style={{
                      background: sv.bg,
                      border: '1px solid #d9cdb8',
                      borderRadius: 3,
                      padding: '2px 10px',
                      fontSize: 11,
                      color: sv.color,
                    }}
                  >
                    Value: Rs {fN(rows.reduce((s, i) => s + i.costVal, 0))}
                  </span>
                </div>
                {rows.length === 0 ? (
                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid #d9cdb8',
                      borderRadius: 3,
                      padding: 12,
                      fontSize: 12,
                      color: MUT,
                      fontStyle: 'italic',
                    }}
                  >
                    No stock issued to this section yet.
                  </div>
                ) : (
                  <div className="card" style={{ padding: 0 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Ingredient</th>
                          <th>Unit</th>
                          <th>Received</th>
                          <th>Consumed</th>
                          <th>Current</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((i) => (
                          <tr key={i.id} style={{ background: i.cur <= 0 ? REDL : 'transparent' }}>
                            <td style={{ fontWeight: i.cur <= 0 ? 500 : 400 }}>{i.name}</td>
                            <td>{i.unit}</td>
                            <td style={{ color: GRN }}>+{i.rcvd}</td>
                            <td style={{ color: RED }}>{i.cons}</td>
                            <td style={{ fontWeight: 500, color: i.cur <= 0 ? RED : GRN }}>
                              {i.cur}
                            </td>
                            <td>Rs {fN(i.costVal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {fcSub === 'issue' && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: PR, marginBottom: 4 }}>
            Issue from Main Store
          </h3>
          <p style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 12 }}>
            Debits Main Store, credits section dry store
          </p>
          <div className="card" style={{ background: '#fff8f0', border: '1px solid ' + SEC }}>
            <div className="row">
              <div className="field">
                <label>Ingredient</label>
                <select
                  value={iss_i}
                  onChange={(e) => setIssI(e.target.value)}
                  style={{ width: 195 }}
                >
                  <option value="">Select</option>
                  {ingr.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Issue To</label>
                <select
                  value={iss_s}
                  onChange={(e) => setIssS(e.target.value as Section)}
                  style={{ width: 175 }}
                >
                  {Object.entries(SECS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Qty{issIng ? ` (${issIng.unit})` : ''}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min="0"
                    value={iss_q}
                    onChange={(e) => setIssQ(e.target.value)}
                    style={{ width: 80 }}
                    placeholder={issIng ? `e.g. 5` : ''}
                  />
                  {issIng && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: PR,
                        background: '#f0ece6',
                        padding: '4px 8px',
                        borderRadius: 4,
                        minWidth: 36,
                        textAlign: 'center',
                      }}
                    >
                      {issIng.unit}
                    </span>
                  )}
                </div>
              </div>
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={iss_d}
                  onChange={(e) => setIssD(e.target.value)}
                  style={{ width: 150 }}
                />
              </div>
              <div className="field">
                <label>Reason</label>
                <input
                  placeholder="e.g. Weekly issue"
                  value={iss_r}
                  onChange={(e) => setIssR(e.target.value)}
                  style={{ width: 165 }}
                />
              </div>
              <button type="button" className="btn" style={{ alignSelf: 'flex-end' }} onClick={addIss}>
                Issue
              </button>
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ingredient</th>
                  <th>To Section</th>
                  <th>Qty</th>
                  <th>Value</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {issuances.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: MUT, fontStyle: 'italic', padding: 12 }}>
                      No issuances yet
                    </td>
                  </tr>
                )}
                {[...issuances].reverse().map((x) => {
                  const ing = ingr.find((y) => y.id === x.ingredient_id);
                  const sv = SECS[x.to_section as Section] || {
                    label: x.to_section,
                    color: MUT,
                  };
                  return (
                    <tr key={x.id}>
                      <td>{x.date}</td>
                      <td>{ing?.name || '—'}</td>
                      <td style={{ color: sv.color, fontStyle: 'italic', fontSize: 11 }}>
                        {sv.label}
                      </td>
                      <td style={{ color: ORA }}>
                        {x.qty} {ing?.unit || ''}
                      </td>
                      <td>Rs {fN(Math.round(x.qty * (ing?.price || 0)))}</td>
                      <td style={{ color: MUT, fontStyle: 'italic', fontSize: 11 }}>
                        {x.reason || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {fcSub === 'recipes' && (
        <div>
          <div className="card" style={{ background: '#fff8f0', border: '1px solid ' + SEC }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: PR, marginBottom: 4 }}>
              Direct Cost Entry
            </div>
            <div style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 10 }}>
              Overrides recipe — enter fixed Rs per portion
            </div>
            <div className="row">
              <div className="field">
                <label>Dish</label>
                <select value={dcD} onChange={(e) => setDcD(e.target.value)} style={{ width: 220 }}>
                  <option value="">Select dish</option>
                  {cd.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Cost/Portion Rs</label>
                <input
                  type="number"
                  min="0"
                  value={dcV}
                  onChange={(e) => setDcV(e.target.value)}
                  style={{ width: 130 }}
                />
              </div>
              <button
                type="button"
                className="btn btn-gold"
                style={{ alignSelf: 'flex-end' }}
                onClick={saveDirectCost}
              >
                Save
              </button>
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Recipe Builder</div>
            <div className="row">
              <div className="field">
                <label>Dish</label>
                <select value={rD} onChange={(e) => setRD(e.target.value)} style={{ width: 210 }}>
                  <option value="">Select</option>
                  {cd.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Ingredient</label>
                <select value={rI} onChange={(e) => setRI(e.target.value)} style={{ width: 165 }}>
                  <option value="">Select</option>
                  {ingr.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Grams/portion</label>
                <input
                  type="number"
                  min="1"
                  value={rG}
                  onChange={(e) => setRG(e.target.value)}
                  style={{ width: 100 }}
                />
              </div>
              <button type="button" className="btn" style={{ alignSelf: 'flex-end' }} onClick={addRecLine}>
                Add / Update
              </button>
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            <table style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Category</th>
                  <th>Section</th>
                  <th>Cost Type</th>
                  <th>Std Cost/Portion</th>
                  <th>Recipe</th>
                </tr>
              </thead>
              <tbody>
                {cd.map((d) => {
                  const rec = recipeMap[d.id] || [];
                  const dca = directCosts[d.id];
                  const cost = getDC(d.id);
                  const type = dca != null ? 'Direct' : rec.length > 0 ? 'Recipe' : 'Not Set';
                  const tCol = dca != null ? SEC : rec.length > 0 ? GRN : RED;
                  const sec = SECS[d.section] || { label: d.section, color: MUT };
                  return (
                    <tr key={d.id}>
                      <td
                        style={{
                          maxWidth: 140,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {d.name}
                      </td>
                      <td>{d.cat}</td>
                      <td style={{ color: sec.color, fontStyle: 'italic', fontSize: 10 }}>
                        {sec.label}
                      </td>
                      <td style={{ color: tCol, fontStyle: 'italic', fontSize: 11 }}>{type}</td>
                      <td style={{ fontWeight: 500, color: cost > 0 ? PR : MUT }}>
                        {cost > 0 ? 'Rs ' + Math.round(cost * 100) / 100 : '—'}
                      </td>
                      <td style={{ fontSize: 10 }}>
                        {dca != null ? (
                          <span style={{ color: MUT, fontStyle: 'italic' }}>Direct Rs {dca}</span>
                        ) : rec.length > 0 ? (
                          rec.map((r) => {
                            const ii = ingr.find((x) => x.id === r.ingredient_id);
                            return (
                              <span
                                key={r.ingredient_id}
                                style={{
                                  display: 'inline-block',
                                  background: '#f0ece6',
                                  borderRadius: 2,
                                  padding: '1px 5px',
                                  marginRight: 2,
                                  marginBottom: 1,
                                  fontSize: 10,
                                }}
                              >
                                {ii?.name || '?'} {r.grams}g{' '}
                                <button
                                  type="button"
                                  onClick={() => removeRecLine(d.id, r.ingredient_id)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: RED,
                                    cursor: 'pointer',
                                    fontSize: 8,
                                  }}
                                >
                                  x
                                </button>
                              </span>
                            );
                          })
                        ) : (
                          <span style={{ color: RED, fontStyle: 'italic' }}>Not set</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
