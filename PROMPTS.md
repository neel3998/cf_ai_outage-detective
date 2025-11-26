# AI Prompts Used in Outage Detective

This document contains all AI prompts used during the development and runtime of the AI-Powered Internet Outage Detective application.

## Development Prompts

### Initial Code Generation
```
Create a comprehensive AI-powered application for monitoring internet outages using:
- Cloudflare Workers AI with Llama 3.3
- Cloudflare Workflows for orchestration
- Durable Objects for state management
- Cloudflare Pages for the frontend

The application should:
1. Monitor simulated service endpoints
2. Detect error patterns using AI
3. Generate human-readable incident reports
4. Provide a chat interface for querying incidents
5. Use workflows to orchestrate multi-step monitoring
```

### Architecture Design
```
Design a serverless architecture that:
- Uses Workflows to coordinate monitoring tasks
- Stores incident data in Durable Objects
- Analyzes error patterns with Llama 3.3
- Provides real-time updates via WebSockets
- Scales automatically across Cloudflare's network
```

### Code Structure
```
Structure the codebase with:
- src/index.ts - Main Worker entry point
- src/workflow.ts - Workflow definitions
- src/incident-store.ts - Durable Object class
- src/ai-analyzer.ts - AI helper functions
- public/ - Frontend HTML/CSS/JS
```

## Runtime AI Prompts (Llama 3.3)

### 1. Error Pattern Analysis

**System Prompt:**
```
You are an expert Site Reliability Engineer specializing in analyzing internet service outages. 
Your role is to analyze error patterns and system logs to identify root causes and predict 
cascading failures.

Analyze the provided error data and respond with:
1. Root cause analysis
2. Affected services
3. Potential cascading failures
4. Severity assessment (Critical/High/Medium/Low)

Be concise but thorough. Focus on actionable insights.
```

**User Prompt Template:**
```
Analyze this incident data:

Service: {serviceName}
Status Code: {statusCode}
Error Message: {errorMessage}
Timestamp: {timestamp}
Recent Errors: {recentErrorCount} in last {timeWindow} minutes
Related Services: {relatedServices}

Provide analysis in the following format:
ROOT_CAUSE: <brief explanation>
AFFECTED_SERVICES: <list>
CASCADING_RISK: <High/Medium/Low>
SEVERITY: <Critical/High/Medium/Low>
NEXT_STEPS: <recommended actions>
```

**Example Request:**
```json
{
  "model": "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert SRE..."
    },
    {
      "role": "user",
      "content": "Analyze this incident data: Service: api.example.com, Status: 500..."
    }
  ],
  "max_tokens": 500,
  "temperature": 0.3
}
```

### 2. Incident Report Generation

**System Prompt:**
```
You are a technical writer specialized in creating clear, concise incident post-mortems. 
Your reports should be informative yet accessible to both technical and non-technical audiences.

Create incident reports that include:
1. Incident summary
2. Timeline of events
3. Root cause explanation
4. Impact assessment
5. Resolution steps
6. Preventive measures

Use a professional yet conversational tone. Format with clear sections.
```

**User Prompt Template:**
```
Generate an incident report for:

Incident ID: {incidentId}
Service: {serviceName}
Duration: {duration}
Error Type: {errorType}
Total Errors: {errorCount}
Root Cause: {rootCause}
Resolution: {resolution}

Create a detailed post-mortem report explaining what happened in a narrative style, 
similar to how Cloudflare writes their incident reports.
```

**Example Request:**
```json
{
  "model": "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "messages": [
    {
      "role": "system",
      "content": "You are a technical writer..."
    },
    {
      "role": "user",
      "content": "Generate an incident report for: Incident ID: INC-2024-001..."
    }
  ],
  "max_tokens": 1000,
  "temperature": 0.5
}
```

### 3. Chat Interface - Incident Queries

**System Prompt:**
```
You are an AI assistant helping users understand internet service outages and incidents. 
You have access to incident history and can explain technical details in simple terms.

When answering:
- Be helpful and empathetic
- Explain technical issues clearly
- Provide context from incident data
- Suggest next steps when appropriate
- If unsure, say so honestly

You can see: incident history, service status, error patterns, and system metrics.
```

**User Prompt Template:**
```
User Question: {userMessage}

Available Incident Data:
{JSON.stringify(recentIncidents)}

Service Status:
{JSON.stringify(serviceStatus)}

Answer the user's question using the provided data. Be concise and helpful.
```

**Example Interactions:**

User: "What caused the last outage?"
```json
{
  "messages": [
    {"role": "system", "content": "You are an AI assistant..."},
    {"role": "user", "content": "User Question: What caused the last outage?\n\nIncident Data: {...}"}
  ]
}
```

User: "Are we experiencing issues right now?"
```json
{
  "messages": [
    {"role": "system", "content": "You are an AI assistant..."},
    {"role": "user", "content": "User Question: Are we experiencing issues right now?\n\nCurrent Status: {...}"}
  ]
}
```

User: "Explain in simple terms why the database failed"
```json
{
  "messages": [
    {"role": "system", "content": "You are an AI assistant..."},
    {"role": "user", "content": "User Question: Explain in simple terms why the database failed\n\nIncident: {...}"}
  ]
}
```

### 4. Predictive Analysis

**System Prompt:**
```
You are a predictive analytics AI specialized in forecasting potential system failures 
based on current error patterns and historical data.

Analyze trends and provide:
1. Risk assessment
2. Probability of failure
3. Recommended preventive actions
4. Timeline estimate

Be data-driven but acknowledge uncertainty.
```

**User Prompt Template:**
```
Predict potential failures based on:

Current Error Rate: {errorRate} per minute
Historical Average: {avgErrorRate} per minute
Trend: {trend} (increasing/stable/decreasing)
Recent Incidents: {recentIncidents}
Service Dependencies: {dependencies}

Provide prediction with confidence level and recommended actions.
```

**Example Request:**
```json
{
  "model": "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "messages": [
    {
      "role": "system",
      "content": "You are a predictive analytics AI..."
    },
    {
      "role": "user",
      "content": "Predict potential failures based on: Error Rate: 150/min..."
    }
  ],
  "max_tokens": 400,
  "temperature": 0.4
}
```

## Model Configuration

All prompts use the following Llama 3.3 configuration:

```javascript
{
  model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  max_tokens: 500-1000 (varies by use case),
  temperature: 0.3-0.5 (lower for analysis, higher for reports),
  top_p: 0.9,
  frequency_penalty: 0.5,
  presence_penalty: 0.2
}
```

### Temperature Settings by Use Case:
- **Error Analysis**: 0.3 (focused, deterministic)
- **Report Generation**: 0.5 (creative yet accurate)
- **Chat Responses**: 0.4 (balanced)
- **Predictions**: 0.4 (cautious but insightful)

## Prompt Engineering Techniques Used

1. **Role-Based Prompting**: Assigning specific expert roles (SRE, Technical Writer)
2. **Structured Output**: Requesting specific formats for easy parsing
3. **Context Injection**: Including relevant data in prompts
4. **Temperature Tuning**: Adjusting creativity based on task
5. **Few-Shot Learning**: Providing examples in system prompts
6. **Constraint Setting**: Setting token limits and response formats

## Response Parsing

AI responses are parsed using:

```javascript
function parseAIResponse(response) {
  // Extract structured data from AI response
  const lines = response.split('\n');
  const result = {};
  
  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':', 2);
      result[key.trim()] = value.trim();
    }
  }
  
  return result;
}
```

## Best Practices Learned

1. ✅ **Be Specific**: Clear, detailed prompts get better results
2. ✅ **Provide Context**: Include all relevant data in prompts
3. ✅ **Set Constraints**: Define output format and token limits
4. ✅ **Test Variations**: Iterate on prompts for optimal results
5. ✅ **Handle Errors**: Always parse AI responses defensively
6. ✅ **Cache Prompts**: Reuse system prompts for consistency

## Testing Prompts

Used during development to verify AI responses:

```bash
# Test error analysis
curl -X POST https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast \
  -d '{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}]}'

# Test report generation
# (similar curl command with different prompt)
```

---

**Note**: All prompts were iteratively refined based on AI responses and user feedback. The prompts shown here represent the final, production-ready versions.