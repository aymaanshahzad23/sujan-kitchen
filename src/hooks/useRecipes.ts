import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { groupDirectCosts, groupRecipes } from '../lib/mappers';
import { useRealtimeSubscription } from './useRealtime';
import type { RecipeLine } from '../types/database';

export function useRecipes() {
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [directCosts, setDirectCosts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [recRes, dcRes] = await Promise.all([
      supabase.from('recipe_lines').select('*'),
      supabase.from('dish_direct_costs').select('*'),
    ]);
    setRecipeLines(recRes.data || []);
    setDirectCosts(groupDirectCosts(dcRes.data || []));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription(
    [{ table: 'recipe_lines' }, { table: 'dish_direct_costs' }],
    refresh,
  );

  const recipes = groupRecipes(recipeLines);

  const addRecipeLine = async (dish_id: string, ingredient_id: string, grams: number) => {
    const existing = recipeLines.find(
      (r) => r.dish_id === dish_id && r.ingredient_id === ingredient_id,
    );
    if (existing) {
      const { error } = await supabase
        .from('recipe_lines')
        .update({ grams })
        .eq('dish_id', dish_id)
        .eq('ingredient_id', ingredient_id);
      if (error) throw error;
      setRecipeLines((prev) =>
        prev.map((r) =>
          r.dish_id === dish_id && r.ingredient_id === ingredient_id ? { ...r, grams } : r,
        ),
      );
    } else {
      const { data, error } = await supabase
        .from('recipe_lines')
        .insert({ dish_id, ingredient_id, grams })
        .select()
        .single();
      if (error) throw error;
      setRecipeLines((prev) => [...prev, data]);
    }
  };

  const setDirectCost = async (dish_id: string, cost: number) => {
    const { error } = await supabase
      .from('dish_direct_costs')
      .upsert({ dish_id, cost });
    if (error) throw error;
    setDirectCosts((prev) => ({ ...prev, [dish_id]: cost }));
  };

  return { recipes, directCosts, recipeLines, loading, refresh, addRecipeLine, setDirectCost };
}
