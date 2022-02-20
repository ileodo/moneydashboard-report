import { resolveSoa } from 'dns';
import { NextFunction, Request, Response } from 'express';
import { MoneyDashboard, Amount } from 'moneydashboard-api';
const http = require('http');
// import { strict as assert } from 'assert';
const moment = require('moment'); // require

class BudgetBreakdownItem {
  name: string;
  categories: string[];
  monthlyBudget: Amount;
  monthlyAmount: { [key: string]: number[] };
};


class BudgetBreakdownController {
  public year = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = Number(req.params.year);
      const today = moment().year(year);
      const currency = "GBP";
      const token = `
      abc
      `;
      const md = new MoneyDashboard(token.replace(/^\s+|\s+$/g, ''));

      await md.login(process.env.USERNAME, process.env.PASSWORD);

      const yearStart = moment(`${today.year()}-01-01`);
      const yearEnd = moment(`${today.year()}-12-31`);
      md.getBudgets(yearStart, yearEnd).then(budgets => {

        const budgetBreakdowns: BudgetBreakdownItem[] = budgets.map(element => {
          let item = new BudgetBreakdownItem();
          item.name = element.name;
          item.categories = element.categories;
          item.monthlyBudget = element.amount;
          item.monthlyAmount = element.amountByMonth()
          if (!item.monthlyAmount.hasOwnProperty(currency)) {
            item.monthlyAmount = {
              [currency]: new Array(12).fill(0)
            };
          }
          return item;
        });
        res.json(budgetBreakdowns);
      }).catch(error => {
        console.error(error);
        res.status(500).json(error)
      });

    } catch (error) {
      console.error(error);
      res.status(500).json(error)
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = `
      abc
      `;
      const md = new MoneyDashboard(token.replace(/^\s+|\s+$/g, ''));

      await md.login(process.env.USERNAME, process.env.PASSWORD);
      md.refreshAccounts().then((status) => {
        res.json({});
      }).catch(error => {
        res.status(500).json(error)
      });


    } catch (error) {
      res.status(500).json(error)
    }
  };



}

export default BudgetBreakdownController;

