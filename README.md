# 🔍 AI-Powered Internet Outage Detective

An intelligent monitoring system that detects, analyzes, and explains internet outages using AI. Built entirely on Cloudflare's serverless platform.
Basically you can monitor services, check system's status, check recent incidents and chat with AI detective to debug the issues.
I have deployed this project on to the cloudflare and here is the working link: https://33cd99a3.outage-detective.pages.dev/

## 🎯 Features

- **Real-time Monitoring**: Continuously monitors simulated service endpoints
- **AI Analysis**: Uses Llama 3.3 to analyze error patterns and predict cascading failures
- **Durable State**: Persists incident history using Durable Objects
- **Multi-Step Workflows**: Orchestrates complex monitoring tasks with automatic retries
- **Interactive Chat**: Web interface to query incidents and get AI-powered explanations
- **Incident Reports**: Auto-generates human-readable post-mortem style reports

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                          │
│                  (Chat Interface UI)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Worker (API)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Workflow Orchestration                      │   │
│  │  • Monitor Endpoint Step                             │   │
│  │  • Analyze Patterns Step (Llama 3.3)                │   │
│  │  • Store Incident Step                               │   │
│  │  • Generate Report Step (Llama 3.3)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────┬──────────────────────────┘
               │                  │
               ▼                  ▼
    ┌──────────────────┐  ┌─────────────────────┐
    │ Durable Objects  │  │   Workers AI        │
    │                  │  │   (Llama 3.3)       │
    │ • Incident Store │  │                     │
    │ • Service State  │  │  • Pattern Analysis │
    │ • Metrics        │  │  • Report Gen       │
    └──────────────────┘  └─────────────────────┘
```

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) 16.17.0 or later
- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login
```

### 2. Configure Your Account

Update `wrangler.toml` with your Cloudflare account ID:

```toml
account_id = "YOUR_ACCOUNT_ID_HERE"
```

Find your account ID at: https://dash.cloudflare.com/ (in the URL after you log in)

### 3. Deploy

```bash
# Deploy the Worker and Workflows
npx wrangler deploy

# Deploy the Pages frontend
npx wrangler pages deploy public --project-name=outage-detective
```

### 4. Access Your App

After deployment, you'll get two URLs:

- **Worker API**: `https://cf_ai_outage-detective.<YOUR_SUBDOMAIN>.workers.dev`
- **Pages UI**: `https://outage-detective.pages.dev`

## 💻 Local Development

```bash
# Start local development server
npx wrangler dev

# In another terminal, serve the Pages frontend
cd public && npx serve
```

The app will be available at:
- Worker: `http://localhost:8787`
- Pages: `http://localhost:3000`

## 🎮 How to Use

### Via Web Interface

1. Open the Pages URL in your browser
2. See real-time monitoring dashboard
3. Click "Start Monitoring" to begin workflow
4. Chat with AI to ask about incidents
5. View auto-generated incident reports

### Via API

```bash
# Start a monitoring workflow
curl -X POST https://YOUR_WORKER.workers.dev/api/monitor \
  -H "Content-Type: application/json" \
  -d '{"service": "api.example.com"}'

# Get incident history
curl https://YOUR_WORKER.workers.dev/api/incidents

# Ask AI about an incident
curl -X POST https://YOUR_WORKER.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What caused the last outage?"}'
```

## 📁 Project Structure

```
cf_ai_outage-detective/
├── src/
│   ├── index.ts              # Main Worker entry point
│   ├── workflow.ts           # Workflow definitions
│   ├── incident-store.ts     # Durable Object for state
│   └── ai-analyzer.ts        # AI analysis helpers
├── public/
│   ├── index.html            # Pages frontend
│   ├── style.css             # Styling
│   └── app.js                # Frontend logic
├── wrangler.toml             # Cloudflare configuration
├── package.json
├── README.md
└── PROMPTS.md                # AI prompts used
```

## 🔧 Configuration

### Environment Variables

No API keys needed! Everything uses Cloudflare's built-in bindings.

### Workflow Settings

Edit `wrangler.toml` to configure:

```toml
[[workflows]]
name = "monitor-workflow"
class_name = "MonitorWorkflow"
script_name = "cf_ai_outage-detective"
```

## 📊 Example Scenarios

### Scenario 1: Simple Service Down
```
User: "Start monitoring api.example.com"
→ Workflow detects 500 errors
→ AI analyzes: "Service experiencing internal server errors"
→ Report: "Incident lasted 5 minutes, likely database connection issue"
```

### Scenario 2: Cascading Failure
```
User: "Check all services"
→ Workflow detects API down → Database timeout → Cache miss
→ AI predicts: "Database failure causing cascading issues"
→ Report: "Root cause identified: Database overload"
```

## 🧪 Testing

```bash
# Run with test data
npm test

# Trigger test workflow
npx wrangler workflows trigger monitor-workflow \
  --params='{"service": "test.example.com", "simulate": "failure"}'
```

## 🐛 Troubleshooting

### "Worker exceeded CPU time limit"
- Workflow steps automatically handle this with retries
- Each step is independently retriable

### "Cannot access Durable Object"
- Ensure migrations are configured in wrangler.toml
- Run `npx wrangler deploy` to apply migrations

### "Workers AI model not found"
- Llama 3.3 model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Check model availability in your region

## 📚 Learn More

- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)

## 📝 License

MIT License - Feel free to use for your projects!

## 🙏 Acknowledgments

Built with:
- Llama 3.3 by Meta
- Cloudflare Developer Platform
- Inspired by real Cloudflare outage analysis

---

**Made with ☁️ on Cloudflare**
