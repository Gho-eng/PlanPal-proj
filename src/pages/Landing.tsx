import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Target, PiggyBank, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-finance.jpg";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: "Track Expenses",
      description: "Log and categorize your daily spending to understand where your money goes"
    },
    {
      icon: Target,
      title: "Set Goals",
      description: "Create savings goals and watch your progress with visual tracking"
    },
    {
      icon: PiggyBank,
      title: "Budget Smart",
      description: "Stay on top of your budget with automatic balance calculations"
    },
    {
      icon: BarChart3,
      title: "Analyze Spending",
      description: "Visualize your spending patterns with intuitive charts and insights"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">PlanPal</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
              Master Your Money as a Student
            </h1>
            <p className="text-lg text-muted-foreground">
              PlanPal helps students track expenses, create budgets, and achieve savings goals. 
              Take control of your finances and build healthy money habits that last.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate("/register")} className="group">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • Free forever
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl" />
            <img 
              src={heroImage} 
              alt="Financial planning illustration with piggy bank and growing charts" 
              className="relative rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-card/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Manage Your Money
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple yet powerful tools designed specifically for students
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-border">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Ready to Take Control?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already managing their money smarter with PlanPal
          </p>
          <Button size="lg" onClick={() => navigate("/register")} className="group">
            Start Your Journey
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">PlanPal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 PlanPal. Built for students, by students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
