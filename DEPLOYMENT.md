# Deployment Guide - AI-Powered Outage Detective

Complete step-by-step guide to deploy your application to Cloudflare.

## Prerequisites Checklist

- [ ] Cloudflare account created
- [ ] Node.js 16.17.0+ installed
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] Git installed (optional, for version control)

## Step 1: Install Dependencies

```bash
# Install project dependencies
npm install

# Verify wrangler is installed
npx wrangler --version
```

## Step 2: Login to Cloudflare

```bash
# This will open your browser for authentication
npx wrangler login
```

## Step 3: Get Your Account ID

1. Go to https://dash.cloudflare.com/
2. Select any website or go to Workers & Pages
3. Your account ID is in the URL: `dash.cloudflare.com/<ACCOUNT_ID>/...`
4. Or find it in the right sidebar under "Account ID"

## Step 4: Configure wrangler.toml

Edit `wrangler.toml` and replace `YOUR_ACCOUNT_ID_HERE`:

```toml
account_id = "abc123def456..."  # Your actual account ID
```

## Step 5: Deploy Worker & Workflows

```bash
# Deploy everything (Worker, Workflows, Durable Objects)
npx wrangler deploy
```

Expected output:
```
✨ Built successfully
🌎 Deploying...
✨ Uploaded cf_ai_outage-detective
✨ Deployed cf_ai_outage-detective
   https://cf_ai_outage-detective.<YOUR_SUBDOMAIN>.workers.dev
```

**Save your Worker URL!** You'll need it for the next step.

## Step 6: Update Frontend Configuration

Edit `public/app.js` and update the API_URL:

```javascript
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8787'
    : 'https://cf_ai_outage-detective.YOUR_SUBDOMAIN.workers.dev';  // Update this!
```

Replace `YOUR_SUBDOMAIN` with your actual subdomain from Step 5.

## Step 7: Deploy Pages Frontend

```bash
# Deploy the frontend to Cloudflare Pages
npx wrangler pages deploy public --project-name=outage-detective
```

Expected output:
```
✨ Compiled Worker successfully
🌎 Uploading...
✨ Deployment complete!
   https://outage-detective.pages.dev
```

**Your app is now live!** 🎉

## Step 8: Verify Deployment

### Test the Worker API

```bash
# Health check
curl https://cf_ai_outage-detective.YOUR_SUBDOMAIN.workers.dev/health

# Should return: {"status":"healthy"}
```

### Test the Pages Frontend

1. Open: `https://outage-detective.pages.dev`
2. You should see the dashboard
3. Click "Start Monitoring" to test

## Step 9: Test Workflows

```bash
# Trigger a test workflow
npx wrangler workflows trigger monitor-workflow \
  --params='{"service": "test.example.com", "simulate": true}'
```

Expected output:
```
✨ Workflow instance created
   Instance ID: monitor-test.example.com-1234567890
   Status: queued
```

## Troubleshooting

### Error: "Account ID not found"

**Solution**: Make sure you've updated `wrangler.toml` with your account ID.

```bash
# Get your account ID
npx wrangler whoami
```

### Error: "Class not found: IncidentStore"

**Solution**: Durable Objects need migrations. Redeploy:

```bash
npx wrangler deploy
```

### Error: "Workers AI binding not found"

**Solution**: Workers AI is automatically available. Check your wrangler.toml has:

```toml
[ai]
binding = "AI"
```

### Error: "CORS error in browser"

**Solution**: Update your Worker URL in `public/app.js` to match your actual deployment URL.

### Error: "Workflow not found"

**Solution**: Ensure workflows are configured in wrangler.toml:

```toml
[[workflows]]
name = "monitor-workflow"
class_name = "MonitorWorkflow"
binding = "MONITOR_WORKFLOW"
```

## Custom Domain Setup (Optional)

### For Worker:

1. Go to Cloudflare Dashboard > Workers & Pages
2. Select your worker: `cf_ai_outage-detective`
3. Go to Triggers > Custom Domains
4. Add your domain: `api.yourdomain.com`

### For Pages:

1. Go to Cloudflare Dashboard > Workers & Pages
2. Select your Pages project: `outage-detective`
3. Go to Custom domains
4. Add your domain: `outage.yourdomain.com`

## Environment Variables (Optional)

If you want to add environment variables:

```bash
# Set a variable
npx wrangler secret put API_KEY

# List secrets
npx wrangler secret list
```

Then access in your code:
```typescript
env.API_KEY
```

## Monitoring Your Deployment

### View Logs

```bash
# Tail worker logs in real-time
npx wrangler tail
```

### View in Dashboard

1. Go to https://dash.cloudflare.com/
2. Navigate to Workers & Pages
3. Click on your worker
4. View metrics, logs, and analytics

## Update Deployment

When you make code changes:

```bash
# Update Worker
npx wrangler deploy

# Update Pages
npx wrangler pages deploy public --project-name=outage-detective
```

## Rollback (If Needed)

### Worker Rollback:

1. Go to Dashboard > Workers & Pages > Your Worker
2. Click "Deployments"
3. Find previous version
4. Click "..." > "Rollback to this deployment"

### Pages Rollback:

1. Go to Dashboard > Workers & Pages > Your Pages Project
2. Click "Deployments"
3. Find previous deployment
4. Click "Rollback to this deployment"

## Cost Estimation

### Free Tier Includes:

- **Workers**: 100,000 requests/day
- **Durable Objects**: 1M requests/month
- **Workers AI**: 10,000 neurons/day (Llama 3.3)
- **Workflows**: 10,000 step executions/month
- **Pages**: Unlimited static requests

### Typical Usage (Demo):

- Monitoring 5 services hourly
- ~120 workflow executions/day
- ~500 AI requests/day
- **Cost: $0/month** (within free tier)

### Production Usage:

- Monitoring 50 services every 5 minutes
- ~14,400 workflow executions/day
- ~2,000 AI requests/day
- **Estimated: $5-10/month**

Exact pricing at: https://developers.cloudflare.com/workers/platform/pricing/

## Production Checklist

Before going to production:

- [ ] Set up custom domains
- [ ] Configure alerts (email/Slack/PagerDuty)
- [ ] Add authentication (Cloudflare Access)
- [ ] Set up rate limiting
- [ ] Enable analytics
- [ ] Configure backups (Durable Objects PITR)
- [ ] Set up monitoring (Sentry, Datadog, etc.)
- [ ] Update API URLs in frontend
- [ ] Test workflows thoroughly
- [ ] Review security settings

## Security Best Practices

1. **Enable Cloudflare Access** for the dashboard
2. **Add API authentication** for production
3. **Use secrets** for sensitive data
4. **Enable CORS** only for your domain
5. **Set up rate limiting** to prevent abuse
6. **Regular security audits**

## Support

- **Cloudflare Community**: https://community.cloudflare.com/
- **Discord**: https://discord.gg/cloudflaredev
- **Documentation**: https://developers.cloudflare.com/
- **Status Page**: https://www.cloudflarestatus.com/

## Next Steps

1. ✅ Deployment complete
2. 🧪 Test all features
3. 📊 Monitor metrics
4. 🔒 Add authentication (optional)
5. 🎨 Customize UI (optional)
6. 🚀 Share your project!

---

**Congratulations! Your AI-Powered Outage Detective is live!** 🎉

Visit your app at:
- Worker: `https://cf_ai_outage-detective.YOUR_SUBDOMAIN.workers.dev`
- Pages: `https://outage-detective.pages.dev`