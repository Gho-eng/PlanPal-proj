import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Pin, Target, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations-supabase/client";
import { useAuth } from "@/lib/auth";
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
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Failed to load goals");
    } else {
      setGoals(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: user?.id,
        title,
        description: description || null,
        target_amount: parseFloat(targetAmount),
        deadline: deadline || null
      });

    if (error) {
      toast.error("Failed to create goal");
    } else {
      toast.success("Goal created successfully!");
      setOpen(false);
      resetForm();
      fetchGoals();
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    const newAmount = selectedGoal.current_amount + parseFloat(amountToAdd);

    const { error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('id', selectedGoal.id);

    if (error) {
      toast.error("Failed to update progress");
    } else {
      toast.success("Progress updated!");
      setUpdateOpen(false);
      setAmountToAdd("");
      setSelectedGoal(null);
      fetchGoals();
    }
  };

  const handleTogglePin = async (goal: Goal) => {
    const { error } = await supabase
      .from('goals')
      .update({ is_pinned: !goal.is_pinned })
      .eq('id', goal.id);

    if (error) {
      toast.error("Failed to update goal");
    } else {
      toast.success(goal.is_pinned ? "Goal unpinned" : "Goal pinned");
      fetchGoals();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete goal");
    } else {
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
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Savings Goals</h1>
          <p className="text-muted-foreground">Set and track your financial goals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a new savings goal to work towards</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., New Laptop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target Amount</Label>
                <Input
                  id="target"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (Optional)</Label>
                <Textarea
                  id="desc"
                  placeholder="What are you saving for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No goals yet. Create your first savings goal!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.current_amount, goal.target_amount);
            const daysLeft = goal.deadline 
              ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <Card key={goal.id} className="relative">
                {goal.is_pinned && (
                  <div className="absolute top-2 right-2">
                    <Pin className="h-4 w-4 text-primary fill-primary" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        {goal.title}
                      </CardTitle>
                      {goal.description && (
                        <CardDescription className="mt-2">{goal.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  {goal.status === 'completed' && (
                    <Badge className="w-fit">Completed!</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-foreground font-medium">
                        {formatCurrency(goal.current_amount)}
                      </span>
                      <span className="text-muted-foreground">
                        of {formatCurrency(goal.target_amount)}
                      </span>
                    </div>
                  </div>

                  {daysLeft !== null && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {daysLeft > 0 ? `${daysLeft} days remaining` : 'Deadline passed'}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedGoal(goal);
                        setUpdateOpen(true);
                      }}
                      disabled={goal.status === 'completed'}
                    >
                      Add Progress
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePin(goal)}
                    >
                      <Pin className={`h-4 w-4 ${goal.is_pinned ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Progress Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>
              Add an amount to your goal: {selectedGoal?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProgress} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Add</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)}
                required
              />
            </div>
            {selectedGoal && (
              <div className="text-sm text-muted-foreground">
                Current: {formatCurrency(selectedGoal.current_amount)} →{" "}
                New: {formatCurrency(selectedGoal.current_amount + parseFloat(amountToAdd || "0"))}
              </div>
            )}
            <Button type="submit" className="w-full">Update Progress</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
