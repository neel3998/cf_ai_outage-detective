/**
 * AI Analysis Functions
 * Uses Llama 3.3 for error analysis, report generation, and chat
 */

interface ErrorData {
  service: string;
  statusCode: number;
  errorMessage: string;
  timestamp: number;
}

interface ReportData {
  incidentId: string;
  service: string;
  duration: string;
  errorType: string;
  errorCount: number;
  rootCause: string;
  resolution: string;
}

// Analyze error patterns using AI
export async function analyzeError(ai: Ai, errorData: ErrorData): Promise<any> {
  const systemPrompt = `You are an expert Site Reliability Engineer specializing in analyzing internet service outages. 
Your role is to analyze error patterns and system logs to identify root causes and predict cascading failures.

Analyze the provided error data and respond with:
1. Root cause analysis
2. Affected services
3. Potential cascading failures
4. Severity assessment (Critical/High/Medium/Low)

Be concise but thorough. Focus on actionable insights.`;

  const userPrompt = `Analyze this incident data:

Service: ${errorData.service}
Status Code: ${errorData.statusCode}
Error Message: ${errorData.errorMessage}
Timestamp: ${new Date(errorData.timestamp).toISOString()}

Provide analysis in the following format:
ROOT_CAUSE: <brief explanation>
AFFECTED_SERVICES: <list>
CASCADING_RISK: <High/Medium/Low>
SEVERITY: <Critical/High/Medium/Low>
NEXT_STEPS: <recommended actions>`;

  try {
    const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const analysisText = response.response || 'Analysis unavailable';
    
    // Parse structured response
    const parsed = parseAIResponse(analysisText);
    
    return {
      analysis: analysisText,
      rootCause: parsed.ROOT_CAUSE || 'Under investigation',
      severity: parsed.SEVERITY || 'Medium',
      cascadingRisk: parsed.CASCADING_RISK || 'Medium',
      nextSteps: parsed.NEXT_STEPS || 'Monitor closely',
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      analysis: 'AI analysis failed',
      rootCause: 'Unknown',
      severity: 'Medium',
      cascadingRisk: 'Low',
      nextSteps: 'Manual investigation required',
    };
  }
}

// Generate incident report using AI
export async function generateReport(ai: Ai, reportData: ReportData): Promise<string> {
  const systemPrompt = `You are a technical writer specialized in creating clear, concise incident post-mortems. 
Your reports should be informative yet accessible to both technical and non-technical audiences.

Create incident reports that include:
1. Incident summary
2. Timeline of events
3. Root cause explanation
4. Impact assessment
5. Resolution steps
6. Preventive measures

Use a professional yet conversational tone. Format with clear sections.`;

  const userPrompt = `Generate an incident report for:

Incident ID: ${reportData.incidentId}
Service: ${reportData.service}
Duration: ${reportData.duration}
Error Type: ${reportData.errorType}
Total Errors: ${reportData.errorCount}
Root Cause: ${reportData.rootCause}
Resolution: ${reportData.resolution}

Create a detailed post-mortem report explaining what happened in a narrative style, 
similar to how Cloudflare writes their incident reports. Keep it under 300 words.`;

  try {
    const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.5,
    });

    return response.response || 'Report generation failed';
  } catch (error) {
    console.error('Report generation error:', error);
    return `## Incident Report: ${reportData.incidentId}

**Service**: ${reportData.service}
**Duration**: ${reportData.duration}
**Status**: ${reportData.errorType}

An incident occurred affecting ${reportData.service}. The root cause was identified as: ${reportData.rootCause}.

The incident has been resolved. Further analysis is ongoing.`;
  }
}

// Chat with AI about incidents
export async function chatWithAI(
  ai: Ai,
  userMessage: string,
  incidents: any[],
  serviceStatus: any[]
): Promise<string> {
  const systemPrompt = `You are an AI assistant helping users understand internet service outages and incidents. 
You have access to incident history and can explain technical details in simple terms.

When answering:
- Be helpful and empathetic
- Explain technical issues clearly
- Provide context from incident data
- Suggest next steps when appropriate
- If unsure, say so honestly

You can see: incident history, service status, error patterns, and system metrics.`;

  const contextData = `
Available Incident Data (last 10):
${JSON.stringify(incidents.slice(0, 10), null, 2)}

Service Status:
${JSON.stringify(serviceStatus, null, 2)}

Total incidents: ${incidents.length}
Recent incidents: ${incidents.filter((inc: any) => Date.now() - inc.timestamp < 3600000).length} in last hour
`;

  const userPrompt = `User Question: ${userMessage}

${contextData}

Answer the user's question using the provided data. Be concise and helpful.`;

  try {
    const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.4,
    });

    return response.response || 'I apologize, but I am unable to provide an answer at this time.';
  } catch (error) {
    console.error('Chat error:', error);
    return 'Sorry, I encountered an error processing your question. Please try again.';
  }
}

// Helper to parse structured AI responses
function parseAIResponse(response: string): Record<string, string> {
  const lines = response.split('\n');
  const result: Record<string, string> = {};

  for (const line of lines) {
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      if (key && value) {
        result[key.trim()] = value;
      }
    }
  }

  return result;
}