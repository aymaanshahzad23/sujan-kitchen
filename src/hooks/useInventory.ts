import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { groupStockByCamp } from '../lib/mappers';
import { useRealtimeSubscription } from './useRealtime';
import type { CampId, Ingredient, Issuance, Purchase } from '../types/database';

export function useInventory(campId: CampId) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [openingStock, setOpeningStock] = useState<Record<string, number>>({});
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [issuances, setIssuances] = useState<Issuance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [ingRes, stockRes, purRes, issRes] = await Promise.all([
      supabase.from('ingredients').select('*').order('name'),
      supabase.from('camp_ingredient_stock').select('*').eq('camp_id', campId),
      supabase.from('purchases').select('*').eq('camp_id', campId).order('date', { ascending: false }),
      supabase.from('issuances').select('*').eq('camp_id', campId).order('date', { ascending: false }),
    ]);
    const err = ingRes.error || stockRes.error || purRes.error || issRes.error;
    if (err) setError(err.message);
    else {
      setIngredients(ingRes.data || []);
      const stockMap: Record<string, number> = {};
      for (const s of stockRes.data || []) stockMap[s.ingredient_id] = Number(s.opening_stock);
      setOpeningStock(stockMap);
      setPurchases(purRes.data || []);
      setIssuances(issRes.data || []);
      setError(null);
    }
    setLoading(false);
  }, [campId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription(
    [
      { table: 'ingredients' },
      { table: 'camp_ingredient_stock', filter: `camp_id=eq.${campId}` },
      { table: 'purchases', filter: `camp_id=eq.${campId}` },
      { table: 'issuances', filter: `camp_id=eq.${campId}` },
    ],
    refresh,
  );

  const addIngredient = async (input: {
    name: string;
    unit: string;
    price: number;
    min_stock: number;
    opening_stock: number;
  }) => {
    const { data: ing, error: err1 } = await supabase
      .from('ingredients')
      .insert({ name: input.name, unit: input.unit, price: input.price, min_stock: input.min_stock })
      .select()
      .single();
    if (err1) throw err1;
    const { error: err2 } = await supabase.from('camp_ingredient_stock').insert({
      camp_id: campId,
      ingredient_id: ing.id,
      opening_stock: input.opening_stock,
    });
    if (err2) throw err2;
    setIngredients((prev) => [...prev, ing]);
    setOpeningStock((prev) => ({ ...prev, [ing.id]: input.opening_stock }));
    return ing;
  };

  const removeIngredient = async (id: string) => {
    const { error: err } = await supabase.from('ingredients').delete().eq('id', id);
    if (err) throw err;
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const addPurchase = async (input: {
    ingredient_id: string;
    qty: number;
    price: number;
    date: string;
  }) => {
    const { data, error: err } = await supabase
      .from('purchases')
      .insert({ camp_id: campId, ...input })
      .select()
      .single();
    if (err) throw err;
    setPurchases((prev) => [data, ...prev]);
    return data;
  };

  const addIssuance = async (input: {
    ingredient_id: string;
    to_section: string;
    qty: number;
    date: string;
    reason: string;
  }) => {
    const { data, error: err } = await supabase
      .from('issuances')
      .insert({ camp_id: campId, ...input })
      .select()
      .single();
    if (err) throw err;
    setIssuances((prev) => [data, ...prev]);
    return data;
  };

  return {
    ingredients,
    openingStock,
    purchases,
    issuances,
    loading,
    error,
    refresh,
    addIngredient,
    removeIngredient,
    addPurchase,
    addIssuance,
  };
}

export function useAllOpeningStock() {
  const [stockByCamp, setStockByCamp] = useState(groupStockByCamp([]));

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('camp_ingredient_stock').select('*');
    setStockByCamp(groupStockByCamp(data || []));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription([{ table: 'camp_ingredient_stock' }], refresh);

  return { stockByCamp, refresh };
}
