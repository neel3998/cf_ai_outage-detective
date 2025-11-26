/**
 * Frontend JavaScript for Outage Detective
 * Interacts with Cloudflare Workers API
 */

// Configuration - Update this with your Worker URL after deployment
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8787'
    : 'https://cf_ai_outage-detective.YOUR_SUBDOMAIN.workers.dev';

// State
let chatHistory = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    await loadStatus();
    await loadIncidents();
    addSystemMessage('Welcome! I can help you understand incidents and outages. Ask me anything!');
}

function setupEventListeners() {
    // Start monitoring button
    document.getElementById('startMonitorBtn').addEventListener('click', startMonitoring);

    // Chat send button
    document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);

    // Enter key in chat input
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // Auto-refresh incidents every 30 seconds
    setInterval(loadIncidents, 30000);
}

// Load service status
async function loadStatus() {
    const statusOverview = document.getElementById('statusOverview');

    try {
        const response = await fetch(`${API_URL}/api/status`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            statusOverview.innerHTML = `
                <div class="status-grid">
                    ${data.map(service => `
                        <div class="status-item ${service.status}">
                            <div class="status-label">${service.service}</div>
                            <div class="status-value">${getStatusEmoji(service.status)} ${service.status.toUpperCase()}</div>
                            <div class="status-label">Errors: ${service.errorCount}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            statusOverview.innerHTML = `
                <div class="status-grid">
                    <div class="status-item">
                        <div class="status-label">System Status</div>
                        <div class="status-value">✅ ALL SYSTEMS OPERATIONAL</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading status:', error);
        statusOverview.innerHTML = `
            <div class="status-item">
                <div class="status-value">⚠️ Unable to load status</div>
            </div>
        `;
    }
}

// Load incidents
async function loadIncidents() {
    const incidentsList = document.getElementById('incidentsList');

    try {
        const response = await fetch(`${API_URL}/api/incidents`);
        const data = await response.json();

        if (data.incidents && data.incidents.length > 0) {
            incidentsList.innerHTML = data.incidents.map(incident => `
                <div class="incident">
                    <div class="incident-header">
                        <span class="incident-id">${incident.id}</span>
                        <span class="incident-time">${formatTime(incident.timestamp)}</span>
                    </div>
                    <div class="incident-service">🔗 ${incident.service}</div>
                    <div class="incident-error">
                        ${incident.statusCode} - ${incident.errorMessage}
                    </div>
                    ${incident.analysis ? `
                        <details style="margin-top: 0.5rem;">
                            <summary style="cursor: pointer; color: var(--primary-color);">View Analysis</summary>
                            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
                                ${incident.analysis}
                            </div>
                        </details>
                    ` : ''}
                </div>
            `).join('');
        } else {
            incidentsList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <p>✨ No incidents recorded yet</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Start monitoring to detect issues</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading incidents:', error);
        incidentsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--danger-color);">
                ⚠️ Unable to load incidents
            </div>
        `;
    }
}

// Start monitoring
async function startMonitoring() {
    const serviceInput = document.getElementById('serviceInput');
    const simulateCheckbox = document.getElementById('simulateCheckbox');
    const statusMessage = document.getElementById('monitorStatus');
    const btn = document.getElementById('startMonitorBtn');

    const service = serviceInput.value.trim();
    if (!service) {
        showStatus('error', 'Please enter a service URL');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Starting...';

    try {
        const response = await fetch(`${API_URL}/api/monitor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service,
                simulate: simulateCheckbox.checked,
            }),
        });

        const data = await response.json();

        if (data.success) {
            showStatus('success', `✅ Monitoring started for ${service}`);
            
            // Reload incidents after a delay to show new data
            setTimeout(() => {
                loadIncidents();
                loadStatus();
            }, 3000);
        } else {
            showStatus('error', 'Failed to start monitoring');
        }
    } catch (error) {
        console.error('Error starting monitoring:', error);
        showStatus('error', '⚠️ Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Start Monitoring';
    }
}

// Send chat message
async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message) return;

    // Add user message to chat
    addChatMessage('user', message);
    chatInput.value = '';

    // Show typing indicator
    addChatMessage('system', 'AI is thinking...');

    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        const data = await response.json();

        // Remove typing indicator
        removeLastSystemMessage();

        // Add AI response
        if (data.response) {
            addChatMessage('ai', data.response);
        } else {
            addChatMessage('ai', 'Sorry, I could not process your request.');
        }
    } catch (error) {
        console.error('Error sending chat:', error);
        removeLastSystemMessage();
        addChatMessage('ai', '⚠️ Sorry, I encountered an error. Please try again.');
    }
}

// Add chat message to UI
function addChatMessage(type, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add system message
function addSystemMessage(message) {
    addChatMessage('system', message);
}

// Remove last system message
function removeLastSystemMessage() {
    const chatMessages = document.getElementById('chatMessages');
    const systemMessages = chatMessages.querySelectorAll('.chat-message.system');
    if (systemMessages.length > 0) {
        systemMessages[systemMessages.length - 1].remove();
    }
}

// Show status message
function showStatus(type, message) {
    const statusMessage = document.getElementById('monitorStatus');
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;

    setTimeout(() => {
        statusMessage.className = 'status-message';
    }, 5000);
}

// Helper: Get status emoji
function getStatusEmoji(status) {
    const emojis = {
        healthy: '✅',
        degraded: '⚠️',
        down: '❌',
    };
    return emojis[status] || '❓';
}

// Helper: Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
        return 'Just now';
    } else if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins} min${mins > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleString();
    }
}

// Initial greeting suggestions
setTimeout(() => {
    const suggestions = [
        "What caused the last outage?",
        "Are we experiencing issues right now?",
        "Show me recent incidents",
        "What should I monitor?",
    ];

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    addSystemMessage(`💡 Try asking: "${randomSuggestion}"`);
}, 2000);