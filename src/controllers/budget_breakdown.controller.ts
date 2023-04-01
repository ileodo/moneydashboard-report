import { NextFunction, Request, Response } from 'express';
import { MoneyDashboard, Amount } from 'moneydashboard-api';
import * as process from 'process';

const moment = require('moment'); // require

class BudgetBreakdownItem {
  name: string;
  description: string;
  monthlyBudget: number;
  monthlyAmount: number[];
}

class BudgetBreakdownController {
  public year = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = Number(req.params.year);
      const today = moment().year(year);
      const currency = 'GBP';
      const token = `
      abc
      `;
      const md = new MoneyDashboard(token.replace(/^\s+|\s+$/g, ''));
      await md.login(process.env.USERNAME, process.env.PASSWORD);

      const yearStart = moment(`${today.year()}-01-01`);
      const yearEnd = moment(`${today.year()}-12-31`);
      md.getBudgets(yearStart, yearEnd)
        .then(budgets => {
          const budgetBreakdowns: BudgetBreakdownItem[] = budgets.map(element => {
            const item = new BudgetBreakdownItem();
            item.name = element.name;
            item.description = element.categories.join(', ');
            item.monthlyBudget = element.amount.amount;

            const amountByMonth = element.amountByMonth();
            if (!amountByMonth.hasOwnProperty(currency)) {
              item.monthlyAmount = new Array(12).fill(0);
            } else {
              item.monthlyAmount = amountByMonth[currency];
            }
            return item;
          });
          res.json(budgetBreakdowns);
        })
        .catch(error => {
          console.error(error);
          res.status(500).json(error);
        });
    } catch (error) {
      console.error(error);
      res.status(500).json(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = `
      abc
      `;
      const md = new MoneyDashboard(token.replace(/^\s+|\s+$/g, ''));

      await md.login(process.env.USERNAME, process.env.PASSWORD);
      md.refreshAccounts()
        .then(status => {
          res.json({});
        })
        .catch(error => {
          res.status(500).json(error);
        });
    } catch (error) {
      res.status(500).json(error);
    }
  };
}

export default BudgetBreakdownController;
