import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Settings = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (user) {
      fetchCategories();
      setFullName(user.username || "");
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCategories = async () => {
    const res = await api.getCategories(user?.id);
    if (res.success) setCategories(res.data || []);
    setLoading(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    const exists = categories.some((c) => c.name.toLowerCase() === categoryName.trim().toLowerCase());
    if (exists) {
      toast.error("Category already exists");
      return;
    }
    const res = await api.createCategory({ userId: user?.id, name: categoryName.trim() });
    if (res.success) {
      toast.success("Category added");
      setCategoryName("");
      setOpen(false);
      fetchCategories();
    } else {
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const res = await api.deleteCategory(id);
    if (res.success) {
      toast.success("Category deleted");
      fetchCategories();
    } else {
      toast.error("Failed to delete");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.updateProfile(user?.id, { username: fullName });
    if (res.success) {
      toast.success("Profile updated");
    } else {
      toast.error("Failed to update");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Manage your custom expense categories</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Category
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
                  <Input id="category" placeholder="e.g., Gaming, Transportation" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Add Category</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No categories yet. Create your first category!</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <span className="text-foreground">{category.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
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

export default Settings;
