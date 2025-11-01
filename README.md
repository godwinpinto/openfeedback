# OpenFeedback

> ⚠️ **Early Preview**: This project is currently in early preview. It is not recommended for production use. Please use at your own risk.

An open-source, AI-powered feedback platform that's powerful, easy to use, and built with transparency and extensibility in mind.

## 🌟 Features

### Create
Build feedback forms quickly with an intuitive builder. AI assistance helps you craft better questions powered by local LLM—keeping costs minimal.

### Respond
Respondents get AI-powered assistance at every step. Translation, grammar fixes, and intelligent suggestions—all with local LLM, keeping costs low while maintaining privacy.

### Analyse
Drill deep into feedback data with AI-powered analysis. Ask questions, explore insights, and understand patterns—powered by cost-effective local LLM.

## ✨ Key Benefits

- **Lightweight**: Minimal resource footprint means fast performance and lower costs
- **Complete Solution**: Handles everything from form creation to analysis
- **Near-Free Self-Hosting**: Self-host with almost zero cost on any serverless provider
- **Local LLM First**: AI assistance powered by local LLMs means no API costs, better privacy, and complete control

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, shadcn/ui
- **AI**: 
  - Local LLM (primary, cost-effective)
  - Google Generative AI / Gemini (optional, for remote chat transport)
  - Chrome Origin Trial APIs (Prompt, Writer, Rewriter, Proofreader)
- **Package Manager**: pnpm (workspace)

## 📁 Project Structure

This is a monorepo using pnpm workspaces:

```
openfeedback/
├── apps/
│   ├── openfeedback/      # Main feedback application
│   └── gencn-ui/          # UI component library & documentation
├── package.json           # Root workspace configuration
└── pnpm-workspace.yaml    # Workspace definition
```

### Main Application (`apps/openfeedback`)

The core feedback platform featuring:
- Form creation and builder
- Feedback form responses
- Reports and analytics
- AI-powered assistance (translation, proofreading, rewriting, summarization)

### UI Library (`apps/gencn-ui`)

Component library documentation and registry built with Fumadocs.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
- pnpm 10.20.0+ (specified in package.json)
- PostgreSQL database
- Chrome Origin Trial tokens (for Chrome APIs)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd openfeedback
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cd apps/openfeedback
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Chrome Origin Trial Tokens
PROMPT_API_ORIGIN_TRIAL_TOKEN=<your-token>
WRITER_API_ORIGIN_TRIAL_TOKEN=<your-token>
REWRITER_API_ORIGIN_TRIAL_TOKEN=<your-token>
PROOFREADER_API_ORIGIN_TRIAL_TOKEN=<your-token>

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/openfeedback

# Google Generative AI (optional, for remote transport)
GOOGLE_GENERATIVE_AI_API_KEY=<your-key>

# Public Configuration
NEXT_PUBLIC_GET_STARTED_URL=
```

4. Set up the database:
```bash
cd apps/openfeedback
pnpm db:generate  # Generate migrations
pnpm db:push      # Push schema to database
# or
pnpm db:migrate   # Run migrations
```

5. Start the development server:
```bash
# From root directory
pnpm --filter openfeedback dev

# Or from apps/openfeedback
cd apps/openfeedback
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Available Scripts

### Root Level
```bash
pnpm install              # Install all workspace dependencies
```

### Application (`apps/openfeedback`)
```bash
pnpm dev                 # Start development server
pnpm build               # Build for production
pnpm start               # Start production server
pnpm lint                # Run ESLint
pnpm db:generate         # Generate Drizzle migrations
pnpm db:migrate          # Run migrations
pnpm db:push             # Push schema to database
pnpm db:studio           # Open Drizzle Studio
```

### UI Library (`apps/gencn-ui`)
```bash
pnpm dev                 # Start development server
pnpm build               # Build for production
pnpm registry:build      # Build component registry
```

## 🌐 Chrome Origin Trial APIs

OpenFeedback leverages Chrome's experimental APIs for enhanced AI features:
- **Prompt API**: Interactive prompting capabilities
- **Writer API**: Content writing assistance
- **Rewriter API**: Content rewriting and improvement
- **Proofreader API**: Grammar and spell checking

To use these APIs, you need to register for Origin Trial tokens at [Chrome Origin Trials](https://developer.chrome.com/origintrials/).

## 🗄️ Database

The project uses Drizzle ORM with PostgreSQL. The schema is defined in `apps/openfeedback/lib/openfeedback/schema.ts`.

Use Drizzle Studio for database management:
```bash
pnpm db:studio
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

See [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Chrome Origin Trials](https://developer.chrome.com/origintrials/)
- [Google Generative AI](https://makersuite.google.com/app/apikey)

---

Built with ❤️ by the OpenFeedback community
