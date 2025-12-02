import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { supabase } from "../integrations-supabase/client";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

// ---------- Types ----------
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

// ---------- Max Limit ----------
const MAX_EXPENSE = 20000;

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchCategories();
    }
  }, [user]);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*, categories(*)")
      .order("expense_date", { ascending: false });

    if (error) toast.error("Failed to load expenses");
    else setExpenses(data || []);

    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) toast.error("Failed to load categories");
    else setCategories(data || []);
  };

  // ---------------- ADD EXPENSE ----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (numAmount > MAX_EXPENSE) {
      toast.error(`Expense exceeds limit of ₱${MAX_EXPENSE.toLocaleString()}`);
      return;
    }

    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    const { error } = await supabase.from("expenses").insert({
      user_id: user?.id,
      amount: numAmount,
      category_id: categoryId,
      description: description || null,
      expense_date: expenseDate,
    });

    if (error) {
      toast.error("Failed to add expense");
    } else {
      toast.success("Expense added!");
      resetForm();
      setOpen(false);
      fetchExpenses();
    }
  };

  // ---------------- DELETE EXPENSE ----------------
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) toast.error("Failed to delete expense");
    else {
      toast.success("Expense deleted");
      fetchExpenses();
    }
  };

  // ---------------- HELPERS ----------------
  const resetForm = () => {
    setAmount("");
    setCategoryId("");
    setDescription("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        Loading...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            Track your daily spending
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              ➕ Add Expense
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Log a new expense to track your spending
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* AMOUNT */}
              <div className="space-y-2">
                <Label>Amount (Limit ₱{MAX_EXPENSE.toLocaleString()})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* CATEGORY */}
              <div className="space-y-2">
                <Label>Category</Label>
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

              {/* DATE */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Optional notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                Add Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* SUMMARY */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Your expense overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💸</span>
            <span className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </span>
            <span className="text-sm text-muted-foreground">
              total expenses
            </span>
          </div>
        </CardContent>
      </Card>

      {/* EXPENSE LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>All your tracked expenses</CardDescription>
        </CardHeader>

        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No expenses yet. Start tracking!
            </p>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {formatCurrency(expense.amount)}
                      </span>

                      {expense.categories && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {expense.categories.name}
                        </span>
                      )}
                    </div>

                    {expense.description && (
                      <p className="text-sm text-muted-foreground">
                        {expense.description}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground mt-1">
                      📅 {new Date(expense.expense_date).toLocaleDateString()}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                  >
                    🗑️
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
