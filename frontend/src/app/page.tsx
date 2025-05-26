'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;


  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${backendUrl}/live`)
        .then(res => res)
        .then(console.log)
        .catch(console.error);
    }, (12 * 60 * 1000)); // every 10 min

    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   // Check if user is logged in
  //   const token = document.cookie
  //     .split("; ")
  //     .find((row) => row.startsWith("token="))
  //     ?.split("=")[1];

  //   if (token) {
  //     router.push('/dashboard');
  //   }
  // }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            DevLog
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            The Developer Productivity & Daily Log Tool
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Daily Work Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track your daily tasks, time spent, and mood with rich text support
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productivity Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Visualize your productivity patterns with heatmaps and analytics
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Share updates with managers and get feedback on your work
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12 space-y-4">
          <Button 
            size="lg" 
            onClick={() => router.push('/login')}
            className="bg-primary hover:bg-primary/90"
          >
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground">
            Join DevLog to improve your productivity and team collaboration
          </p>
        </div>
      </div>
    </main>
  );
}
