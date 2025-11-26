# Quick Reference Guide

## 🚀 Essential Commands

### Setup & Deploy
```bash
npm install                          # Install dependencies
npx wrangler login                   # Login to Cloudflare
npx wrangler deploy                  # Deploy Worker & Workflows
npx wrangler pages deploy public     # Deploy Pages frontend
```

### Development
```bash
npx wrangler dev                     # Start local dev server
npx wrangler tail                    # View live logs
npx wrangler tail --format=pretty    # Pretty logs
```

### Testing
```bash
npm test                                    # Run test workflow
npx wrangler workflows trigger monitor-workflow --params='{"service":"test.com"}'
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/monitor` | Start monitoring a service |
| GET | `/api/incidents` | Get incident history |
| POST | `/api/chat` | Chat with AI |
| GET | `/api/status` | Get service status |
| GET | `/api/workflow/status` | Check workflow status |
| GET | `/health` | Health check |

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `wrangler.toml` | Cloudflare configuration |
| `src/index.ts` | Main Worker entry |
| `src/workflow.ts` | Workflow definitions |
| `src/incident-store.ts` | Durable Objects |
| `src/ai-analyzer.ts` | AI functions |
| `public/index.html` | Frontend UI |
| `public/app.js` | Frontend logic |

## 🤖 AI Models Used

**Model**: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

**Use Cases**:
- Error analysis (temp: 0.3)
- Report generation (temp: 0.5)
- Chat responses (temp: 0.4)

## 💾 Durable Objects

### IncidentStore
- `addIncident(incident)` - Add new incident
- `getIncidents(limit)` - Get incident list
- `updateIncident(id, updates)` - Update incident
- `getStats()` - Get statistics

### ServiceMonitor
- `updateStatus(service, status)` - Update service status
- `getStatus()` - Get all service statuses
- `incrementErrorCount(service)` - Increment error count

## 🔄 Workflow Steps

### MonitorWorkflow
1. Check service health
2. Analyze error patterns (AI)
3. Store incident (Durable Object)
4. Generate report (AI)
5. Notify (placeholder)

### AnalysisWorkflow
1. Gather incident data
2. Analyze correlations
3. Generate insights (AI)

## 📊 Dashboard Features

- ✅ Real-time status monitoring
- 📋 Incident history viewer
- 💬 AI chat interface
- 🎯 Service monitoring controls
- 📊 Statistics overview

## 🔒 Security Best Practices

1. Use Cloudflare Access for authentication
2. Enable rate limiting
3. Add API tokens for production
4. Configure CORS properly
5. Use secrets for sensitive data

## 💰 Pricing Estimate

**Free Tier**:
- 100K Worker requests/day
- 1M Durable Object requests/month
- 10K AI neurons/day
- 10K Workflow steps/month

**Demo Usage**: $0/month (within limits)

**Production**: ~$5-10/month for moderate traffic

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Account ID error | Update in wrangler.toml |
| Durable Object not found | Run `npx wrangler deploy` |
| CORS error | Check API_URL in app.js |
| Workflow timeout | Steps auto-retry, check logs |
| AI model error | Model: llama-3.3-70b-instruct-fp8-fast |

## 📚 Documentation Links

- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Workflows](https://developers.cloudflare.com/workflows/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Pages](https://developers.cloudflare.com/pages/)

## 🎯 Quick Test

```bash
# 1. Deploy
npx wrangler deploy

# 2. Test API
curl https://YOUR_WORKER.workers.dev/health

# 3. Start monitoring
curl -X POST https://YOUR_WORKER.workers.dev/api/monitor \
  -H "Content-Type: application/json" \
  -d '{"service":"test.com","simulate":true}'

# 4. Check incidents
curl https://YOUR_WORKER.workers.dev/api/incidents

# 5. Chat with AI
curl -X POST https://YOUR_WORKER.workers.dev/api/chat \
  -d '{"message":"What happened?"}'
```

## 📞 Support

- **Discord**: https://discord.gg/cloudflaredev
- **Community**: https://community.cloudflare.com/
- **Docs**: https://developers.cloudflare.com/

---

**Last Updated**: November 2024