import type { Profile } from '@/context/AuthContext';
import type { PlanId } from '@/lib/plans';
import { supabase } from '@/lib/supabase';

export async function changePlan(planId: PlanId): Promise<Profile> {
  const { data, error } = await supabase.rpc('set_plan', { p_plan: planId });
  if (error || !data) {
    throw new Error('We could not change your plan. Please try again.');
  }
  return data as Profile;
}
