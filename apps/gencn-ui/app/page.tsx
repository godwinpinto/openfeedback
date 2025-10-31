import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container mx-auto px-6 py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground">
              <span className="mr-2">✨</span>
              AI-Powered Component Library
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              GenCN UI
            </h1>
            <p className="mb-8 text-xl text-muted-foreground sm:text-2xl">
              The Generative AI based Shadcn UI Component Library
            </p>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Build modern, intelligent UI components powered by Chrome AI APIs. Get access to
              Summarizer, Writer, Rewriter, and Language Detector functionality with beautiful,
              accessible components built on Shadcn UI.
            </p>
            <div className="flex items-center justify-center">
              <Link
                href="/docs"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Powerful Features
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Everything you need to build intelligent, AI-powered user interfaces
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="AI Summarization"
              description="Integrate intelligent text summarization capabilities into your components with the GenUI Summarizer."
              icon="📝"
            />
            <FeatureCard
              title="Chrome AI APIs"
              description="Seamlessly integrate Chrome AI APIs including Writer, Rewriter, and Language Detector."
              icon="🤖"
            />
            <FeatureCard
              title="Shadcn UI Based"
              description="Built on top of Shadcn UI, ensuring beautiful, accessible, and customizable components."
              icon="🎨"
            />
            <FeatureCard
              title="Type-Safe"
              description="Full TypeScript support with auto-generated types and comprehensive type definitions."
              icon="🔒"
            />
            <FeatureCard
              title="Easy Installation"
              description="Install components via CLI or manually. Works with npm, pnpm, yarn, and bun."
              icon="⚡"
            />
            <FeatureCard
              title="Dark Mode"
              description="Full dark mode support out of the box with beautiful color schemes."
              icon="🌙"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border">
        <div className="container mx-auto px-6 py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
              Ready to Get Started?
            </h2>
            <p className="mb-6 text-base text-muted-foreground">
              Start building with GenCN UI today. Check out our documentation to learn more.
            </p>
            <Link
              href="/docs"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Read Documentation
            </Link>
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
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md">
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

