export interface MonthlyBudget {
    amount: number;
    currency: string;
}

export interface MonthlyAmount {
    GBP: number[];
}

export interface BudgetBreakdownRecord {
    name: string;
    categories: string[];
    monthlyBudget: MonthlyBudget;
    monthlyAmount: MonthlyAmount;
}

export class BudgetData {
    name: string;
    categories: string[];
    monthlyBudget: number;
    amount: number;
    // chart
    xStart: number;
    xLength: number;
    yStart: number;
    yLength: number;
}

export class ChartData {
    name: string;
    categories: string[];
    monthlyBudget: number;
    month: number;
    amount: number;
    // chart
    xStart: number;
    xLength: number;
    yStart: number;
    yLength: number;
}
