# Usage Examples - AI-Powered Outage Detective

Complete examples and use cases for the Outage Detective application.

## Quick Start Example

### 1. Start Monitoring a Service

```bash
curl -X POST https://YOUR_WORKER.workers.dev/api/monitor \
  -H "Content-Type: application/json" \
  -d '{
    "service": "api.example.com",
    "simulate": true
  }'
```

**Response:**
```json
{
  "success": true,
  "instanceId": "monitor-api.example.com-1701234567890",
  "message": "Started monitoring api.example.com",
  "status": "queued"
}
```

### 2. Check Incident History

```bash
curl https://YOUR_WORKER.workers.dev/api/incidents
```

**Response:**
```json
{
  "incidents": [
    {
      "id": "INC-1701234567890",
      "service": "api.example.com",
      "timestamp": 1701234567890,
      "statusCode": 500,
      "errorMessage": "Internal Server Error",
      "analysis": "ROOT_CAUSE: Service experiencing internal server errors...",
      "report": "## Incident Report: INC-1701234567890...",
      "resolved": false
    }
  ]
}
```

### 3. Chat with AI

```bash
curl -X POST https://YOUR_WORKER.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What caused the last outage?"
  }'
```

**Response:**
```json
{
  "response": "Based on the latest incident data, the last outage was caused by an Internal Server Error (500) on api.example.com. The root cause analysis suggests this was likely due to a database connection issue..."
}
```

## Web Interface Examples

### Scenario 1: Basic Service Monitoring

1. **Open the web interface**
   - Navigate to: `https://outage-detective.pages.dev`

2. **Start monitoring**
   - Enter service: `api.example.com`
   - Check "Simulate failure"
   - Click "Start Monitoring"

3. **View results**
   - Wait 5-10 seconds
   - See new incident appear in "Recent Incidents"
   - View AI analysis by expanding details

### Scenario 2: Chat Queries

**Example conversations:**

#### Query 1: Recent Status
```
User: "Are we experiencing any issues right now?"

AI: "Currently, the system shows 1 recent incident from the last hour. 
The api.example.com service experienced a 500 Internal Server Error. 
The issue appears to be isolated and monitoring is in progress."
```

#### Query 2: Root Cause
```
User: "What caused the error on api.example.com?"

AI: "The 500 Internal Server Error on api.example.com was likely caused 
by a database connection timeout. This type of error typically indicates 
backend infrastructure issues. The system has logged this incident and 
is monitoring for recurring patterns."
```

#### Query 3: Recommendations
```
User: "What should I do about these errors?"

AI: "Based on the current incident pattern, I recommend:
1. Check database connection pools
2. Review backend service logs
3. Monitor for cascading failures
4. Consider implementing retry logic
The system will continue monitoring and alert on new incidents."
```

## API Examples

### Get Service Status

```bash
curl https://YOUR_WORKER.workers.dev/api/status
```

**Response:**
```json
[
  {
    "service": "api.example.com",
    "status": "down",
    "lastCheck": 1701234567890,
    "errorCount": 3
  },
  {
    "service": "cdn.example.com",
    "status": "healthy",
    "lastCheck": 1701234567890,
    "errorCount": 0
  }
]
```

### Check Workflow Status

```bash
curl "https://YOUR_WORKER.workers.dev/api/workflow/status?id=monitor-api.example.com-1701234567890"
```

**Response:**
```json
{
  "id": "monitor-api.example.com-1701234567890",
  "status": "complete"
}
```

## Workflow Examples

### Trigger Monitor Workflow Manually

```bash
npx wrangler workflows trigger monitor-workflow \
  --params='{
    "service": "api.example.com",
    "simulate": true
  }'
```

**Output:**
```
✨ Workflow instance created
   Instance ID: monitor-api.example.com-1701234567890
   Status: queued
```

### Trigger Analysis Workflow

```bash
npx wrangler workflows trigger analysis-workflow \
  --params='{
    "incidentIds": [
      "INC-1701234567890",
      "INC-1701234568000"
    ]
  }'
```

## Advanced Examples

### Example 1: Monitoring Multiple Services

```javascript
// Monitor multiple services simultaneously
const services = [
  'api.example.com',
  'cdn.example.com', 
  'auth.example.com',
  'db.example.com'
];

for (const service of services) {
  await fetch('https://YOUR_WORKER.workers.dev/api/monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service, simulate: false })
  });
}
```

### Example 2: Polling for Incidents

```javascript
// Poll for new incidents every 30 seconds
setInterval(async () => {
  const response = await fetch('https://YOUR_WORKER.workers.dev/api/incidents');
  const data = await response.json();
  
  const newIncidents = data.incidents.filter(inc => 
    Date.now() - inc.timestamp < 60000 // Last minute
  );
  
  if (newIncidents.length > 0) {
    console.log(`⚠️ ${newIncidents.length} new incidents detected`);
    // Handle incidents (send alert, etc.)
  }
}, 30000);
```

### Example 3: Custom Alert Integration

```javascript
// Check status and send to Slack
async function checkAndAlert() {
  const response = await fetch('https://YOUR_WORKER.workers.dev/api/status');
  const services = await response.json();
  
  const downServices = services.filter(s => s.status === 'down');
  
  if (downServices.length > 0) {
    // Send to Slack webhook
    await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 Alert: ${downServices.length} services down`,
        attachments: downServices.map(s => ({
          color: 'danger',
          text: `${s.service}: ${s.errorCount} errors`
        }))
      })
    });
  }
}
```

## Testing Examples

### Test 1: Simulate Service Failure

```bash
# Start monitoring with simulation
curl -X POST http://localhost:8787/api/monitor \
  -H "Content-Type: application/json" \
  -d '{
    "service": "test.example.com",
    "simulate": true
  }'

# Wait a few seconds, then check incidents
curl http://localhost:8787/api/incidents
```

### Test 2: AI Analysis Quality

```bash
# Create an incident and ask AI about it
curl -X POST http://localhost:8787/api/monitor \
  -d '{"service": "api.test.com", "simulate": true}'

sleep 5

# Ask AI for analysis
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What happened to api.test.com?"}'
```

### Test 3: Workflow Execution

```bash
# Trigger workflow and check logs
npx wrangler workflows trigger monitor-workflow \
  --params='{"service": "test.com", "simulate": true}'

# View logs
npx wrangler tail
```

## Real-World Use Cases

### Use Case 1: E-Commerce Platform

**Scenario**: Monitor checkout, payment, and inventory APIs

```bash
# Monitor critical services
for service in checkout.shop.com payment.shop.com inventory.shop.com; do
  curl -X POST https://YOUR_WORKER.workers.dev/api/monitor \
    -d "{\"service\": \"$service\"}"
done

# Set up hourly checks with cron trigger (in wrangler.toml):
[triggers]
crons = ["0 * * * *"]  # Every hour
```

### Use Case 2: SaaS Application

**Scenario**: Monitor API endpoints and database connections

```javascript
// Monitor health endpoints
const endpoints = [
  'https://api.yourapp.com/health',
  'https://api.yourapp.com/db/health',
  'https://api.yourapp.com/cache/health'
];

// Check all endpoints
for (const endpoint of endpoints) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      // Trigger monitoring workflow
      await triggerMonitoring(endpoint);
    }
  } catch (error) {
    await triggerMonitoring(endpoint, error);
  }
}
```

### Use Case 3: Microservices Architecture

**Scenario**: Monitor service mesh and detect cascading failures

```bash
# Monitor all microservices
services=("auth" "users" "products" "orders" "payments")

for service in "${services[@]}"; do
  curl -X POST https://YOUR_WORKER.workers.dev/api/monitor \
    -H "Content-Type: application/json" \
    -d "{\"service\": \"${service}-service.internal\"}"
done

# Run correlation analysis
curl -X POST https://YOUR_WORKER.workers.dev/api/workflow/trigger \
  -d '{"workflow": "analysis-workflow"}'
```

## Integration Examples

### Integrate with PagerDuty

```javascript
async function sendToPagerDuty(incident) {
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Token token=YOUR_PAGERDUTY_TOKEN'
    },
    body: JSON.stringify({
      routing_key: 'YOUR_ROUTING_KEY',
      event_action: 'trigger',
      payload: {
        summary: `Incident: ${incident.service}`,
        severity: 'error',
        source: incident.service,
        custom_details: {
          error: incident.errorMessage,
          analysis: incident.analysis
        }
      }
    })
  });
}
```

### Integrate with DataDog

```javascript
async function sendToDataDog(incident) {
  await fetch('https://api.datadoghq.com/api/v1/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': 'YOUR_DATADOG_API_KEY'
    },
    body: JSON.stringify({
      title: `Outage: ${incident.service}`,
      text: incident.analysis,
      alert_type: 'error',
      tags: [`service:${incident.service}`, 'source:outage-detective']
    })
  });
}
```

## Performance Examples

### Benchmark Workflow Execution

```bash
# Time workflow execution
time npx wrangler workflows trigger monitor-workflow \
  --params='{"service": "test.com", "simulate": true}'

# Typical results:
# real    0m2.345s
# user    0m0.123s
# sys     0m0.045s
```

### Load Testing

```bash
# Test 100 concurrent monitoring requests
for i in {1..100}; do
  curl -X POST https://YOUR_WORKER.workers.dev/api/monitor \
    -d "{\"service\": \"test-${i}.com\"}" &
done
wait
```

## Troubleshooting Examples

### Debug Workflow Execution

```bash
# View workflow logs
npx wrangler tail --format=pretty

# Filter for specific workflow
npx wrangler tail --format=pretty | grep "monitor-workflow"
```

### Check Durable Object State

```bash
# Query incidents via API
curl https://YOUR_WORKER.workers.dev/api/incidents

# Check stats
curl https://YOUR_WORKER.workers.dev/api/status
```

---

## Tips & Best Practices

1. **Rate Limiting**: Monitor services at appropriate intervals (5-60 minutes)
2. **Simulation Mode**: Use `simulate: true` for testing without real requests
3. **Chat Context**: Provide clear, specific questions for better AI responses
4. **Workflow Retries**: Workflows automatically retry failed steps
5. **State Persistence**: Durable Objects persist data across deployments

## Next Steps

- 📖 Read the full [README.md](README.md)
- 🚀 Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment
- 💬 Join [Cloudflare Discord](https://discord.gg/cloudflaredev)
- 🐛 Report issues on [GitHub](https://github.com/yourusername/cf_ai_outage-detective)

Happy monitoring! 🔍