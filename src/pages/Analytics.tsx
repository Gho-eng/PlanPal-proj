import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface CategoryData {
  name: string;
  value: number;
}

interface TimeData {
  date: string;
  amount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const Analytics = () => {
  const { user } = useAuth();
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [timeData, setTimeData] = useState<TimeData[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch expenses with categories
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('amount, expense_date, categories(name)')
        .order('expense_date', { ascending: true });

      if (error) throw error;

      if (expenses) {
        // Calculate total spent
        const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
        setTotalSpent(total);

        // Group by category
        const categoryMap = new Map<string, number>();
        expenses.forEach(exp => {
          const categoryName = exp.categories?.name || 'Uncategorized';
          const current = categoryMap.get(categoryName) || 0;
          categoryMap.set(categoryName, current + parseFloat(exp.amount.toString()));
        });

        const catData = Array.from(categoryMap.entries()).map(([name, value]) => ({
          name,
          value
        }));
        setCategoryData(catData);

        // Group by date for time series
        const dateMap = new Map<string, number>();
        expenses.forEach(exp => {
          const date = new Date(exp.expense_date).toLocaleDateString();
          const current = dateMap.get(date) || 0;
          dateMap.set(date, current + parseFloat(exp.amount.toString()));
        });

        const timeSeriesData = Array.from(dateMap.entries())
          .map(([date, amount]) => ({ date, amount }))
          .slice(-7); // Last 7 days
        setTimeData(timeSeriesData);
      }
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(value);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Visualize your spending patterns</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Spending</CardTitle>
          <CardDescription>All-time expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-foreground">{formatCurrency(totalSpent)}</p>
        </CardContent>
      </Card>

      {categoryData.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Distribution of expenses across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {timeData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Spending Trend</CardTitle>
                <CardDescription>Daily expenses over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="amount" stroke="#0088FE" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No data available yet. Start logging expenses to see analytics!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
