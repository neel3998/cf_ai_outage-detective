/**
 * Cloudflare Workflows for Outage Detective
 * Multi-step orchestration for monitoring and analysis
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { analyzeError, generateReport } from './ai-analyzer';

interface MonitorParams {
  service: string;
  simulate?: boolean;
}

interface IncidentData {
  id: string;
  service: string;
  timestamp: number;
  statusCode: number;
  errorMessage: string;
  analysis?: string;
  report?: string;
}

// Monitor Workflow - Continuously monitors services
export class MonitorWorkflow extends WorkflowEntrypoint<Env, MonitorParams> {
  async run(event: WorkflowEvent<MonitorParams>, step: WorkflowStep) {
    const { service, simulate = false } = event.payload;
    
    console.log(`[Workflow] Starting monitor for service: ${service}`);

    // Step 1: Check service health
    const healthCheck = await step.do('check-service-health', async () => {
      console.log(`[Step 1] Checking health of ${service}`);
      
      if (simulate) {
        // Simulate a failure for testing
        return {
          healthy: false,
          statusCode: 500,
          error: 'Internal Server Error',
          timestamp: Date.now(),
        };
      }

      // In production, you'd make real HTTP requests
      // For demo, we'll simulate various scenarios
      const scenarios = [
        { healthy: true, statusCode: 200, error: null },
        { healthy: false, statusCode: 500, error: 'Internal Server Error' },
        { healthy: false, statusCode: 503, error: 'Service Unavailable' },
        { healthy: false, statusCode: 504, error: 'Gateway Timeout' },
      ];

      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      return {
        ...scenario,
        timestamp: Date.now(),
      };
    });

    if (!healthCheck.healthy) {
      console.log(`[Workflow] Service unhealthy: ${healthCheck.statusCode}`);

      // Step 2: Analyze error patterns with AI
      const analysis = await step.do('analyze-error-patterns', async () => {
        console.log('[Step 2] Analyzing error patterns with AI');
        
        const analysisResult = await analyzeError(this.env.AI, {
          service,
          statusCode: healthCheck.statusCode,
          errorMessage: healthCheck.error!,
          timestamp: healthCheck.timestamp,
        });

        return analysisResult;
      });

      // Step 3: Store incident in Durable Object
      const incident = await step.do('store-incident', async () => {
        console.log('[Step 3] Storing incident data');
        
        const incidentData: IncidentData = {
          id: `INC-${Date.now()}`,
          service,
          timestamp: healthCheck.timestamp,
          statusCode: healthCheck.statusCode,
          errorMessage: healthCheck.error!,
          analysis: analysis.analysis,
        };

        // Store in Durable Object
        const id = this.env.INCIDENT_STORE.idFromName('global');
        const stub = this.env.INCIDENT_STORE.get(id);
        await stub.addIncident(incidentData);

        return incidentData;
      });

      // Step 4: Generate detailed report
      const report = await step.do('generate-report', async () => {
        console.log('[Step 4] Generating incident report');
        
        const reportText = await generateReport(this.env.AI, {
          incidentId: incident.id,
          service: incident.service,
          duration: '5 minutes', // In real app, calculate actual duration
          errorType: incident.errorMessage,
          errorCount: 1,
          rootCause: analysis.rootCause || 'Under investigation',
          resolution: 'Service monitoring in progress',
        });

        // Update incident with report
        const id = this.env.INCIDENT_STORE.idFromName('global');
        const stub = this.env.INCIDENT_STORE.get(id);
        await stub.updateIncident(incident.id, { report: reportText });

        return reportText;
      });

      // Step 5: Optional - Alert or notification step
      await step.do('notify', async () => {
        console.log('[Step 5] Notification step (placeholder)');
        // In production, send alerts via email, Slack, PagerDuty, etc.
        return { notified: true };
      });

      return {
        success: true,
        incident,
        analysis,
        report,
      };
    }

    return {
      success: true,
      message: `Service ${service} is healthy`,
    };
  }
}

// Analysis Workflow - Deep analysis of patterns
export class AnalysisWorkflow extends WorkflowEntrypoint<Env, { incidentIds: string[] }> {
  async run(event: WorkflowEvent<{ incidentIds: string[] }>, step: WorkflowStep) {
    const { incidentIds } = event.payload;
    
    console.log(`[Analysis Workflow] Analyzing ${incidentIds.length} incidents`);

    // Step 1: Gather incident data
    const incidents = await step.do('gather-incidents', async () => {
      console.log('[Step 1] Gathering incident data');
      
      const id = this.env.INCIDENT_STORE.idFromName('global');
      const stub = this.env.INCIDENT_STORE.get(id);
      const allIncidents = await stub.getIncidents();
      
      return allIncidents.filter((inc: any) => incidentIds.includes(inc.id));
    });

    // Step 2: Perform correlation analysis
    const correlations = await step.do('analyze-correlations', async () => {
      console.log('[Step 2] Analyzing incident correlations');
      
      // Analyze patterns across multiple incidents
      const services = incidents.map((inc: any) => inc.service);
      const statusCodes = incidents.map((inc: any) => inc.statusCode);
      
      return {
        affectedServices: [...new Set(services)],
        commonErrors: [...new Set(statusCodes)],
        pattern: 'Cascading failure detected',
      };
    });

    // Step 3: Generate insights with AI
    const insights = await step.do('generate-insights', async () => {
      console.log('[Step 3] Generating AI insights');
      
      const prompt = `Analyze these correlated incidents and provide insights:
${JSON.stringify(correlations, null, 2)}

Total incidents: ${incidents.length}
Time span: Last hour

Provide:
1. Root cause hypothesis
2. Preventive measures
3. Risk assessment`;

      const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          {
            role: 'system',
            content: 'You are an expert SRE analyzing incident patterns.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 600,
        temperature: 0.4,
      });

      return response.response || 'Analysis complete';
    });

    return {
      success: true,
      incidents: incidents.length,
      correlations,
      insights,
    };
  }
}

interface Env {
  AI: Ai;
  INCIDENT_STORE: DurableObjectNamespace;
  SERVICE_MONITOR: DurableObjectNamespace;
}