// Finance utility calculations used across FTI

export const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(n || 0));

export const calcEMI = (principal: number, annualRatePct: number, months: number) => {
  if (!principal || !months) return 0;
  const r = (annualRatePct || 0) / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};

export type CibilTier = {
  label: string;
  message: string;
  color: string;       // tailwind bg class
  text: string;        // tailwind text class
  emoji: string;
  tips: string[];
};

export const getCibilTier = (score: number): CibilTier => {
  if (score >= 750) return {
    label: 'Excellent', emoji: '✅',
    message: 'Easy loan approval, best interest rates',
    color: 'bg-success', text: 'text-success',
    tips: ['Keep credit utilization under 30%', 'Continue paying on time', 'Avoid unnecessary new credit lines'],
  };
  if (score >= 700) return {
    label: 'Good', emoji: '🟢',
    message: 'Strong profile, good approval chances',
    color: 'bg-success-soft', text: 'text-success',
    tips: ['Pay all EMIs on time', 'Reduce credit utilization', 'Keep old credit cards active'],
  };
  if (score >= 650) return {
    label: 'Average', emoji: '🟡',
    message: 'May face higher interest',
    color: 'bg-warning', text: 'text-foreground',
    tips: ['Pay credit card bill in full each month', 'Avoid multiple loan applications', 'Check report for errors'],
  };
  if (score >= 600) return {
    label: 'Low', emoji: '🟠',
    message: 'Limited approval chances',
    color: 'bg-orange', text: 'text-orange',
    tips: ['Clear overdue payments immediately', 'Reduce total debt burden', 'Limit new credit inquiries'],
  };
  return {
    label: 'Poor', emoji: '🔴',
    message: 'Loan rejection likely',
    color: 'bg-danger', text: 'text-danger',
    tips: ['Settle pending dues', 'Consider a secured credit card to rebuild', 'Avoid new applications for 6 months'],
  };
};

// Simplified Indian tax calc (FY 2025-26)
export const calcOldRegimeTax = (gross: number, deductions: number, age: number = 30) => {
  const taxable = Math.max(0, gross - deductions);
  let tax = 0;
  
  if (age > 80) {
    if (taxable > 1000000) tax += (taxable - 1000000) * 0.30 + 500000 * 0.20;
    else if (taxable > 500000) tax += (taxable - 500000) * 0.20;
  } else if (age >= 60 && age <= 80) {
    if (taxable > 1000000) tax += (taxable - 1000000) * 0.30 + 500000 * 0.20 + 200000 * 0.05;
    else if (taxable > 500000) tax += (taxable - 500000) * 0.20 + 200000 * 0.05;
    else if (taxable > 300000) tax += (taxable - 300000) * 0.05;
  } else {
    // Age < 60
    if (taxable > 1000000) tax += (taxable - 1000000) * 0.30 + 500000 * 0.20 + 250000 * 0.05;
    else if (taxable > 500000) tax += (taxable - 500000) * 0.20 + 250000 * 0.05;
    else if (taxable > 250000) tax += (taxable - 250000) * 0.05;
  }
  
  // Note: 4% Health & Education cess is standard, adding it for accurate realism.
  return Math.round(tax * 1.04); 
};

export const calcNewRegimeTax = (gross: number) => {
  const taxable = Math.max(0, gross); 
  let tax = 0;
  
  // Rebate 87A under new regime if taxable <= 7L -> Tax = 0
  if (taxable <= 700000) {
    return 0;
  }
  
  const slabs = [
    [300000, 0], 
    [700000, 0.05], 
    [1000000, 0.10],
    [1200000, 0.15], 
    [1500000, 0.20], 
    [Infinity, 0.30],
  ] as [number, number][];
  
  let prev = 0;
  for (const [cap, rate] of slabs) {
    if (taxable > cap) { 
      tax += (cap - prev) * rate; 
      prev = cap; 
    } else { 
      tax += (taxable - prev) * rate; 
      break; 
    }
  }
  
  return Math.round(tax * 1.04);
};

// SIP future value
export const calcSIP = (monthly: number, years: number, annualReturnPct: number) => {
  const n = years * 12;
  const r = annualReturnPct / 12 / 100;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
};

// Financial Health Score (0-100)
export const calcHealthScore = ({
  inHand, totalEMI, totalExpenses, monthlyInvestment, cibil,
}: { inHand: number; totalEMI: number; totalExpenses: number; monthlyInvestment: number; cibil: number; }) => {
  if (!inHand) return 0;
  const savings = inHand - totalEMI - totalExpenses - monthlyInvestment;
  const savingsRate = Math.max(0, savings / inHand);
  const dti = totalEMI / inHand;
  const investRate = monthlyInvestment / inHand;
  const cibilNorm = Math.min(1, Math.max(0, (cibil - 300) / 600));
  const score =
    savingsRate * 35 +
    Math.max(0, 1 - dti * 2) * 25 +
    Math.min(1, investRate * 5) * 20 +
    cibilNorm * 20;
  return Math.round(Math.max(0, Math.min(100, score)));
};

export const healthLabel = (s: number) =>
  s >= 80 ? { label: 'Excellent', color: 'text-success' }
  : s >= 60 ? { label: 'Good', color: 'text-success' }
  : s >= 40 ? { label: 'Average', color: 'text-warning' }
  : s >= 20 ? { label: 'Low', color: 'text-orange' }
  : { label: 'Poor', color: 'text-danger' };
