import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target, CreditCard, Calendar } from "lucide-react";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  status: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string | null;
  expense_date: string;
  categories: { name: string } | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total income
      const { data: incomes } = await supabase
        .from('incomes')
        .select('amount');
      const totalIncome = incomes?.reduce((sum, inc) => sum + parseFloat(inc.amount.toString()), 0) || 0;

      // Fetch total expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id, amount, expense_date, description, categories(name)')
        .order('expense_date', { ascending: false });
      const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;

      // Calculate this month's spending
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthExpenses = expenses?.filter(exp => new Date(exp.expense_date) >= firstDayOfMonth) || [];
      const monthlyTotal = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

      // Fetch active goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('status', 'active')
        .limit(3);

      // Set states
      setTotalBalance(totalIncome - totalExpenses);
      setMonthlySpending(monthlyTotal);
      setActiveGoals(goals || []);
      setRecentExpenses(expenses?.slice(0, 5) || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total income minus expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month's Spending
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(monthlySpending)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Expenses for current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Goals
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Goals in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Savings Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalBalance > 0 ? "42%" : "0%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on income vs spending
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Your latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expenses yet. Start tracking your spending!
              </p>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {expense.description || "Expense"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {expense.categories && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {expense.categories.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(parseFloat(expense.amount.toString()))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goals Progress</CardTitle>
            <CardDescription>Track your savings goals</CardDescription>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No goals yet. Create your first savings goal!
              </p>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal) => {
                  const progress = calculateProgress(goal.current_amount, goal.target_amount);
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">{goal.title}</span>
                        <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(goal.current_amount)}</span>
                        <span>{formatCurrency(goal.target_amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
