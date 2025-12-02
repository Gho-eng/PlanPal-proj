import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { supabase } from "../../integrations-supabase/client";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

const Settings = () => {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  const [fullName, setFullName] = useState("");

  /** Load categories + profile */
  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchProfile();
    }
  }, [user]);

  /** Fetch categories */
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) toast.error("Failed to load categories");
    else setCategories(data || []);

    setLoading(false);
  };

  /** Fetch user profile */
  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user?.id)
      .single();

    if (data) setFullName(data.full_name);
  };

  /** Add category (duplicate protection added) */
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameClean = categoryName.trim().toLowerCase();

    // Check duplicates
    const exists = categories.some(
      (c) => c.name.trim().toLowerCase() === nameClean
    );

    if (exists) {
      toast.error("Category already exists!");
      return;
    }

    const { error } = await supabase.from("categories").insert({
      user_id: user?.id,
      name: categoryName.trim(),
    });

    if (error) {
      toast.error("Failed to add category");
      return;
    }

    toast.success("Category added!");
    setOpen(false);
    setCategoryName("");
    fetchCategories();
  };

  /** Delete category */
  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) toast.error("Failed to delete category");
    else {
      toast.success("Category deleted");
      fetchCategories();
    }
  };

  /** Update profile */
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user?.id);

    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated!");
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and categories</p>
      </div>

      {/* PROFILE */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>

            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* CATEGORIES */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Manage your custom categories</CardDescription>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Category</Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <Label>Category Name</Label>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., Transportation"
                  required
                />

                <Button type="submit" className="w-full">
                  Add
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No categories yet.
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <span className="font-medium">{cat.name}</span>

                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)}>
                    Delete
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
