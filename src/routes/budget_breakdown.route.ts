import { Router } from 'express';
import BudgetBreakdownController from '@controllers/budget_breakdown.controller';
import { Routes } from '@interfaces/routes.interface';

class BudgetBreakdownRoute implements Routes {
  public path = '/budget_breakdown';
  public router = Router();
  public budgetBreakdownController = new BudgetBreakdownController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:year(\\d{4})`, this.budgetBreakdownController.year);
  }
}

export default BudgetBreakdownRoute;
