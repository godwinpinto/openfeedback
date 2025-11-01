"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { genUIToast } from "@/lib/genui-sonner";
import { 
  FormInput, 
  BarChart3, 
  Sparkles, 
  Users, 
  MessageSquare, 
  FileText,
  ArrowRight,
  CheckCircle2,
  Github,
  BookOpen
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950/5 dark:bg-white/10">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-950/10 dark:border-white/20 bg-white/50 dark:bg-gray-950/30 pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-gray-950/10 dark:border-white/20 bg-white dark:bg-gray-950/50 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <Sparkles className="mr-2 h-4 w-4" />
              Open Source • AI-Powered
            </div>
            <h1 className="mx-auto max-w-4xl mb-6 text-5xl font-medium tracking-tight text-gray-950 dark:text-white sm:text-6xl lg:text-7xl">
              Feedback{' '}
              <span className="relative whitespace-nowrap text-blue-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 418 42"
                  className="absolute top-2/3 left-0 h-[0.58em] w-full fill-blue-300/70 dark:fill-blue-400/40"
                  preserveAspectRatio="none"
                >
                  <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
                </svg>
                <span className="relative">made simple</span>
              </span>{' '}
              for everyone.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-gray-600 dark:text-gray-400">
              An open source feedback platform that's powerful and easy to use. 
              Built with transparency, extensibility, and community in mind.
            </p>
            <div className="mt-10 flex justify-center gap-x-6">
              <Button asChild size="lg" className="rounded-full text-base px-8 bg-gray-950 text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                <Link href="/create">
                  Create Your First Form
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full text-base px-8 border-gray-950/10 dark:border-white/20 text-gray-950 dark:text-white ring-1 ring-gray-950/10 dark:ring-white/20"
                onClick={() => genUIToast.info("The docs section is under construction. Please check back soon!", { tone: "friendly", maxLength: 100, retryOnFail: true })}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Docs
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full text-base px-8 border-gray-950/10 dark:border-white/20 text-gray-950 dark:text-white ring-1 ring-gray-950/10 dark:ring-white/20">
                <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-950 dark:text-white sm:text-4xl">
              Assistance at Every Step
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              AI-powered help throughout your feedback journey—without costing a bomb. Powered by local LLM.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              title="Create"
              description="Build feedback forms quickly with an intuitive builder. AI assistance helps you craft better questions without the cost—powered by local LLM."
              icon={<FormInput className="h-6 w-6" />}
            />
            <FeatureCard
              title="Respond"
              description="Respondents get AI-powered assistance at every step. Translation, grammar fixes, and intelligent suggestions—all with local LLM, keeping costs low."
              icon={<MessageSquare className="h-6 w-6" />}
            />
            <FeatureCard
              title="Analyse"
              description="Drill deep into feedback data with AI-powered analysis. Ask questions, explore insights, and understand patterns—powered by cost-effective local LLM."
              icon={<BarChart3 className="h-6 w-6" />}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-950 dark:text-white sm:text-4xl">
              Why Choose <span style={{ fontFamily: 'var(--font-nunito), sans-serif' }}><span className="text-blue-600">O</span>pen<span className="text-blue-600">F</span>eedback</span>?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Open source, transparent, and built for everyone
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <BenefitItem
              title="Lightweight"
              description="Minimal resource footprint means fast performance and lower costs. Built for efficiency from the ground up."
            />
            <BenefitItem
              title="Does the Work"
              description="Complete feedback solution that handles everything—from form creation to analysis. No compromises."
            />
            <BenefitItem
              title="Near-Free Self-Hosting"
              description="Self-host with almost zero cost on any serverless provider. Keep control of your data without breaking the bank."
            />
            <BenefitItem
              title="Local LLM First"
              description="AI assistance powered by local LLMs means no API costs, better privacy, and complete control over your AI features."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-950/10 dark:border-white/20 bg-white dark:bg-gray-950/50">
        <div className="container mx-auto px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-950 dark:text-white sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
              Create your first feedback form and start collecting valuable insights from your audience today.
            </p>
            <div className="flex items-center justify-center">
              <Button asChild size="lg" className="rounded-full text-base px-8 bg-gray-950 text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                <Link href="/create">
                  Create a Form
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="transition-all hover:border-blue-600/50 hover:shadow-md bg-white dark:bg-gray-950/50 border-gray-950/10 dark:border-white/20">
      <CardHeader>
        <div className="mb-2 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <CardTitle className="text-xl text-gray-950 dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base text-gray-600 dark:text-gray-400">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function BenefitItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 shrink-0">
        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 className="mb-1 text-lg font-semibold text-gray-950 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}
