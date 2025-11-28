import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Calendar, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Expense {
  id: string;
  amount: number;
  description: string | null;
  expense_date: string;
  category_id: string | null;
  categories: Category | null;
}

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // Form states
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchCategories();
    }
  }, [user]);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, categories(*)')
      .order('expense_date', { ascending: false });
    
    if (error) {
      toast.error("Failed to load expenses");
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error("Failed to load categories");
    } else {
      setCategories(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('expenses')
      .insert({
        user_id: user?.id,
        amount: parseFloat(amount),
        category_id: categoryId || null,
        description: description || null,
        expense_date: expenseDate
      });

    if (error) {
      toast.error("Failed to add expense");
    } else {
      toast.success("Expense added successfully!");
      setOpen(false);
      resetForm();
      fetchExpenses();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete expense");
    } else {
      toast.success("Expense deleted");
      fetchExpenses();
    }
  };

  const resetForm = () => {
    setAmount("");
    setCategoryId("");
    setDescription("");
    setExpenseDate(new Date().toISOString().split('T')[0]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">Track your daily spending</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>Log a new expense to track your spending</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">Add Expense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Your expense overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(totalExpenses)}
            </span>
            <span className="text-sm text-muted-foreground">total expenses</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>All your tracked expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No expenses yet. Start tracking your spending!
            </p>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(parseFloat(expense.amount.toString()))}
                      </span>
                      {expense.categories && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {expense.categories.name}
                        </span>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground mt-1">{expense.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
