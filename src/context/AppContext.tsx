import { createContext, useContext, type ReactNode } from 'react';
import type { CampId } from '../types/database';
import { useCamps } from '../hooks/useCamps';
import { useDishes, useAllDishes } from '../hooks/useDishes';
import { useKots, useAllKots } from '../hooks/useKots';
import { useInventory } from '../hooks/useInventory';
import { useRecipes } from '../hooks/useRecipes';
import { useStaff, useAllStaff } from '../hooks/useStaff';
import { useGuests, useAllGuests } from '../hooks/useGuests';
import { useComplaints, useAllComplaints } from '../hooks/useComplaints';

type AppContextValue = ReturnType<typeof useAppDataInternal>;

function useAppDataInternal(campId: CampId) {
  const camps = useCamps();
  const dishes = useDishes(campId);
  const allDishes = useAllDishes();
  const kots = useKots(campId);
  const allKots = useAllKots();
  const inventory = useInventory(campId);
  const recipes = useRecipes();
  const staff = useStaff();
  const allStaff = useAllStaff();
  const guests = useGuests(campId);
  const allGuests = useAllGuests();
  const complaints = useComplaints(campId);
  const allComplaints = useAllComplaints();

  return {
    campId,
    camps,
    dishes,
    allDishes,
    kots,
    allKots,
    inventory,
    recipes,
    staff,
    allStaff,
    guests,
    allGuests,
    complaints,
    allComplaints,
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ campId, children }: { campId: CampId; children: ReactNode }) {
  const value = useAppDataInternal(campId);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used within AppProvider');
  return ctx;
}
