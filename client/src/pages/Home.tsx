import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Activity, Brain, Database, Target, TrendingUp, Users } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const features = [
    {
      icon: Target,
      title: "Lead Mining",
      description: "AI-powered lead discovery and qualification with intelligent scoring algorithms.",
    },
    {
      icon: Activity,
      title: "Competitor Monitoring",
      description: "Real-time tracking of competitor activities, product changes, and market moves.",
    },
    {
      icon: Users,
      title: "People Intelligence",
      description: "Industry who's who database with LinkedIn integration and background analysis.",
    },
    {
      icon: Database,
      title: "Document Intelligence",
      description: "Automated article collection, AI summarization, and semantic search capabilities.",
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "OpenAI-powered insights, scoring, and strategic recommendations at every level.",
    },
    {
      icon: TrendingUp,
      title: "Continuous Monitoring",
      description: "Automated intelligence gathering with proactive alerts and change detection.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
              <h1 className="text-xl font-bold">{APP_TITLE}</h1>
            </div>
            <Button asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Brain className="h-4 w-4" />
            AI-Powered Intelligence Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Elite Intelligence
            <br />
            <span className="text-primary">For Strategic Advantage</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced lead mining, competitor monitoring, and market intelligence powered by cutting-edge AI.
            Built with the precision of senior engineers and the innovation of elite security researchers.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>Get Started</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Comprehensive Intelligence Capabilities</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every module leverages OpenAI's most advanced models to deliver actionable insights and strategic
            intelligence.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Enterprise-Grade Technology</CardTitle>
            <CardDescription>
              Built on modern, scalable infrastructure with AI at the core
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="font-semibold mb-2">AI Engine</h3>
                <p className="text-sm text-muted-foreground">
                  OpenAI GPT-5 for analysis, scoring, and natural language intelligence
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Web Intelligence</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced scraping with anti-detection and proxy rotation
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time processing with automated monitoring and alerts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Gain the Intelligence Edge?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join the platform designed for those who demand elite-level intelligence and strategic insights.
            </p>
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>Start Intelligence Gathering</a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 {APP_TITLE}. Advanced Intelligence Platform.</p>
        </div>
      </footer>
    </div>
  );
}
