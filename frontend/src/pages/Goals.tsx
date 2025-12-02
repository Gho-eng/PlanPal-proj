import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", targetAmount: "", currentAmount: "0" });

  useEffect(() => {
    if (!user?.id) return;
    fetchGoals();
  }, [user?.id]);

  const fetchGoals = async () => {
    const res = await api.getGoals(user?.id);
    if (res.success) setGoals(res.data || []);
    setLoading(false);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.targetAmount) {
      toast.error("Please fill all fields");
      return;
    }
    const res = await api.createGoal({
      userId: user?.id,
      title: formData.title,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount),
      completed: false,
    });
    if (res.success) {
      toast.success("Goal created");
      setFormData({ title: "", targetAmount: "", currentAmount: "0" });
      setOpen(false);
      fetchGoals();
    } else {
      toast.error("Failed to create goal");
    }
  };

  const handleToggleGoal = async (goal: any) => {
    const res = await api.updateGoal(goal.id, { ...goal, completed: !goal.completed });
    if (res.success) {
      fetchGoals();
      toast.success(goal.completed ? "Goal unmarked" : "Goal completed!");
    }
  };

  const handleDeleteGoal = async (id: number) => {
    const res = await api.deleteGoal(id);
    if (res.success) {
      toast.success("Goal deleted");
      fetchGoals();
    } else {
      toast.error("Failed to delete");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Goals</h1>
          <p className="text-muted-foreground">Set and track your savings goals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a new savings goal</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Title</Label>
                <Input placeholder="e.g., Vacation Fund" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Target Amount</Label>
                <Input type="number" placeholder="0.00" step="0.01" value={formData.targetAmount} onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Current Amount</Label>
                <Input type="number" placeholder="0.00" step="0.01" value={formData.currentAmount} onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No goals yet. Create one to start saving!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal: any) => (
            <Card key={goal.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleGoal(goal)} className="hover:opacity-70">
                      {goal.completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5" />}
                    </button>
                    <CardTitle>{goal.title}</CardTitle>
                    {goal.completed && <Badge className="bg-green-500">Completed</Badge>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>${goal.currentAmount?.toFixed(2) || "0.00"}</span>
                  <span className="text-muted-foreground">${goal.targetAmount?.toFixed(2) || "0.00"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Goals;
