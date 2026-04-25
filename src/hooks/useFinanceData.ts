import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { calcEMI, calcHealthScore } from '@/lib/finance';

export type Loan = { id: string; user_id: string; name: string; principal: number; rate: number; tenure_months: number };
export type Expense = { id: string; user_id: string; category: string; amount: number };
export type Income = { user_id: string; job_type: string | null; ctc: number; in_hand: number; cibil_score: number };
export type InvestCfg = { user_id: string; monthly_amount: number; tenure_years: number; expected_return: number };

export const useFinanceData = () => {
  const { user } = useAuth();
  const [income, setIncome] = useState<Income | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invest, setInvest] = useState<InvestCfg | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    const [i, l, e, v] = await Promise.all([
      supabase.from('income_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('loans').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('investments_config').select('*').eq('user_id', user.id).maybeSingle(),
    ]);
    setIncome((i.data as Income) ?? { user_id: user.id, job_type: null, ctc: 0, in_hand: 0, cibil_score: 700 });
    setLoans((l.data as Loan[]) ?? []);
    setExpenses((e.data as Expense[]) ?? []);
    setInvest((v.data as InvestCfg) ?? { user_id: user.id, monthly_amount: 0, tenure_years: 10, expected_return: 12 });
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const totalEMI = loans.reduce((s, l) => s + calcEMI(l.principal, l.rate, l.tenure_months), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const inHand = Number(income?.in_hand || 0);
  const monthlyInvestment = Number(invest?.monthly_amount || 0);
  const disposable = inHand - totalEMI - totalExpenses;
  const savings = disposable - monthlyInvestment;
  const savingsRate = inHand ? savings / inHand : 0;
  const healthScore = calcHealthScore({
    inHand, totalEMI, totalExpenses, monthlyInvestment, cibil: income?.cibil_score ?? 700,
  });

  return { income, loans, expenses, invest, loading, refresh,
    totalEMI, totalExpenses, inHand, monthlyInvestment, disposable, savings, savingsRate, healthScore };
};
