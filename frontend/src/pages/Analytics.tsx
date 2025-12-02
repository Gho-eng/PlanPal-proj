import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    fetchGoals();
  }, [user?.id]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load categories");
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getGoals(user.id);

      if (!res.success) throw new Error(res.error?.error || res.error || "Failed to load goals");

      setGoals(res.data || []);
    } catch (err: any) {
      console.error("Analytics load error:", err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user?.id)
      .single();

    if (data) {
      setFullName(data.full_name);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    const newName = categoryName.trim().toLowerCase();

    // Check duplicates locally (case-insensitive)
    const exists = categories.some(
      (cat) => cat.name.trim().toLowerCase() === newName
    );

    if (exists) {
      toast.error("Category name already exists!");
      return;
    }

    // Insert new category
    const { error } = await supabase
      .from("categories")
      .insert({
        user_id: user?.id,
        name: categoryName.trim(),
      });

    if (error) {
      if (error.code === "23505") {
        toast.error("Category already exists in database!");
      } else {
        toast.error("Failed to add category");
      }
      return;
    }

    toast.success("Category added successfully!");
    setOpen(false);
    setCategoryName("");
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete category");
    } else {
      toast.success("Category deleted");
      fetchCategories();
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user?.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully!");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const totalExpensesByCategory = categories.map((c) => {
    // categories from backend may not include totals; compute if expenses attached to category exist
    return { ...c, total: c.total || 0 };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Manage your custom expense categories</CardDescription>
          </div>

          {/* Add Category Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>Create a custom category for organizing expenses</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category Name</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Gaming, Transportation"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Category
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No categories yet. Create your first category!
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <span className="text-foreground">{category.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Overview of your spending and goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Number of categories: {categories.length}</CardDescription>
              </CardHeader>
              <CardContent>
                {totalExpensesByCategory.length === 0 ? (
                  <p className="text-muted-foreground">No categories yet</p>
                ) : (
                  <ul className="space-y-2">
                    {totalExpensesByCategory.map((c) => (
                      <li key={c.id} className="flex justify-between">
                        <span>{c.name}</span>
                        <span className="font-medium">${(c.total || 0).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goals</CardTitle>
                <CardDescription>Total goals: {goals.length}</CardDescription>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <p className="text-muted-foreground">No goals yet</p>
                ) : (
                  <ul className="space-y-2">
                    {goals.map((g) => (
                      <li key={g.id} className="flex justify-between">
                        <span>{g.title}</span>
                        <span className="font-medium">{g.completed ? "Completed" : `${Math.min(100, (g.currentAmount / g.targetAmount) * 100).toFixed(0)}%`}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
