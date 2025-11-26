/**
 * AI-Powered Internet Outage Detective
 * Main Worker Entry Point
 */

import { MonitorWorkflow, AnalysisWorkflow } from './workflow';
import { IncidentStore, ServiceMonitor } from './incident-store';
import { analyzeError, generateReport, chatWithAI } from './ai-analyzer';

export { MonitorWorkflow, AnalysisWorkflow, IncidentStore, ServiceMonitor };

interface Env {
  AI: Ai;
  INCIDENT_STORE: DurableObjectNamespace;
  SERVICE_MONITOR: DurableObjectNamespace;
  MONITOR_WORKFLOW: Workflow;
  ANALYSIS_WORKFLOW: Workflow;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Routes
      if (path === '/api/monitor' && request.method === 'POST') {
        return await handleMonitor(request, env, corsHeaders);
      }

      if (path === '/api/incidents') {
        return await handleGetIncidents(request, env, corsHeaders);
      }

      if (path === '/api/chat' && request.method === 'POST') {
        return await handleChat(request, env, corsHeaders);
      }

      if (path === '/api/status') {
        return await handleStatus(request, env, corsHeaders);
      }

      if (path === '/api/workflow/status') {
        return await handleWorkflowStatus(request, env, corsHeaders);
      }

      // Health check
      if (path === '/health') {
        return new Response(JSON.stringify({ status: 'healthy' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Default response
      return new Response(
        JSON.stringify({
          message: 'AI-Powered Outage Detective API',
          endpoints: {
            'POST /api/monitor': 'Start monitoring a service',
            'GET /api/incidents': 'Get incident history',
            'POST /api/chat': 'Chat with AI about incidents',
            'GET /api/status': 'Get current service status',
            'GET /api/workflow/status': 'Get workflow status',
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

// Handler: Start monitoring workflow
async function handleMonitor(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  const body = await request.json() as { service: string; simulate?: boolean };
  const { service, simulate = false } = body;

  if (!service) {
    return new Response(JSON.stringify({ error: 'Service name required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create workflow instance
  const instanceId = `monitor-${service}-${Date.now()}`;
  const instance = await env.MONITOR_WORKFLOW.create({
    id: instanceId,
    params: { service, simulate },
  });

  return new Response(
    JSON.stringify({
      success: true,
      instanceId,
      message: `Started monitoring ${service}`,
      status: instance.status,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Handler: Get incident history
async function handleGetIncidents(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  const id = env.INCIDENT_STORE.idFromName('global');
  const stub = env.INCIDENT_STORE.get(id);
  
  const incidents = await stub.getIncidents();

  return new Response(JSON.stringify({ incidents }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Chat with AI
async function handleChat(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  const body = await request.json() as { message: string };
  const { message } = body;

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get recent incidents for context
  const id = env.INCIDENT_STORE.idFromName('global');
  const stub = env.INCIDENT_STORE.get(id);
  const incidents = await stub.getIncidents();

  // Get service status
  const monitorId = env.SERVICE_MONITOR.idFromName('global');
  const monitorStub = env.SERVICE_MONITOR.get(monitorId);
  const status = await monitorStub.getStatus();

  // Chat with AI
  const response = await chatWithAI(env.AI, message, incidents, status);

  return new Response(
    JSON.stringify({ response }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Handler: Get service status
async function handleStatus(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  const id = env.SERVICE_MONITOR.idFromName('global');
  const stub = env.SERVICE_MONITOR.get(id);
  const status = await stub.getStatus();

  return new Response(JSON.stringify(status), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Get workflow status
async function handleWorkflowStatus(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  const url = new URL(request.url);
  const instanceId = url.searchParams.get('id');

  if (!instanceId) {
    return new Response(JSON.stringify({ error: 'Instance ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const instance = await env.MONITOR_WORKFLOW.get(instanceId);

  return new Response(
    JSON.stringify({
      id: instanceId,
      status: instance.status,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}