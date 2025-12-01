import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";

const IconPlus = () => <span>➕</span>;
const IconTrash = () => <span>🗑️</span>;
const IconPin = () => <span>📌</span>;
const IconTarget = () => <span>🎯</span>;
const IconCalendar = () => <span>📅</span>;

import { supabase } from "../supabase/client";
import { useAuth } from "../auth/useAuth";
import { toast } from "sonner";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  is_pinned: boolean;
  status: string;
}

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [amountToAdd, setAmountToAdd] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load goals");
    else setGoals(data || []);

    setLoading(false);
  };

  // CREATE GOAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      toast.error("Target amount must be greater than 0");
      return;
    }

    const { error } = await supabase.from("goals").insert({
      user_id: user?.id,
      title,
      description: description || null,
      target_amount: target,
      deadline: deadline || null,
      current_amount: 0,
      status: "in_progress"
    });

    if (error) toast.error("Failed to create goal");
    else {
      toast.success("Goal created successfully!");
      setOpen(false);
      resetForm();
      fetchGoals();
    }
  };

  // UPDATE PROGRESS — prevents overflow
  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    const addAmount = parseFloat(amountToAdd);
    if (isNaN(addAmount) || addAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const newAmount = selectedGoal.current_amount + addAmount;

    if (newAmount > selectedGoal.target_amount) {
      toast.error("Amount exceeds target savings!");
      return;
    }

    const isCompleted = newAmount >= selectedGoal.target_amount;

    const { error } = await supabase
      .from("goals")
      .update({
        current_amount: newAmount,
        status: isCompleted ? "completed" : "in_progress"
      })
      .eq("id", selectedGoal.id);

    if (error) toast.error("Failed to update progress");
    else {
      toast.success(isCompleted ? "Goal completed!" : "Progress updated!");
      setUpdateOpen(false);
      setAmountToAdd("");
      setSelectedGoal(null);
      fetchGoals();
    }
  };

  const handleTogglePin = async (goal: Goal) => {
    const { error } = await supabase
      .from("goals")
      .update({ is_pinned: !goal.is_pinned })
      .eq("id", goal.id);

    if (error) toast.error("Failed to update goal");
    else {
      toast.success(goal.is_pinned ? "Goal unpinned" : "Goal pinned");
      fetchGoals();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) toast.error("Failed to delete goal");
    else {
      toast.success("Goal deleted");
      fetchGoals();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetAmount("");
    setDeadline("");
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const calculateProgress = (c: number, t: number) =>
    Math.min((c / t) * 100, 100);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-gray-500">Set and track your financial goals</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><IconPlus /> Create Goal</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a new savings goal to work towards</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Goal Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div>
                <Label>Target Amount</Label>
                <Input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
              </div>

              <div>
                <Label>Deadline (Optional)</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <Button type="submit" className="w-full">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* GOAL LIST */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No goals yet. Create your first savings goal!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.current_amount, goal.target_amount);

            return (
              <Card key={goal.id} className="relative">

                {goal.is_pinned && (
                  <div className="absolute top-2 right-2"><IconPin /></div>
                )}

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconTarget /> {goal.title}
                  </CardTitle>
                  {goal.description && <CardDescription>{goal.description}</CardDescription>}
                  {goal.status === "completed" && <Badge>Completed!</Badge>}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>

                    <Progress value={progress} />

                    <div className="flex justify-between text-sm mt-2">
                      <span>{formatCurrency(goal.current_amount)}</span>
                      <span>of {formatCurrency(goal.target_amount)}</span>
                    </div>
                  </div>

                  {goal.deadline && (
                    <div className="text-sm text-gray-500 flex gap-2">
                      <IconCalendar /> {goal.deadline}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={goal.status === "completed"}
                      onClick={() => { setSelectedGoal(goal); setUpdateOpen(true); }}
                    >
                      Add Progress
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => handleTogglePin(goal)}>
                      <IconPin />
                    </Button>

                    <Button size="sm" variant="ghost" onClick={() => handleDelete(goal.id)}>
                      <IconTrash />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* UPDATE PROGRESS DIALOG */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>
              Add to: {selectedGoal?.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProgress} className="space-y-4">
            <div>
              <Label>Amount to Add</Label>
              <Input
                type="number"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">Update Progress</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
