/**
 * Durable Objects for State Management
 * Persistent storage for incidents and service monitoring
 */

import { DurableObject } from 'cloudflare:workers';

interface Incident {
  id: string;
  service: string;
  timestamp: number;
  statusCode: number;
  errorMessage: string;
  analysis?: string;
  report?: string;
  resolved?: boolean;
}

// IncidentStore - Stores incident history
export class IncidentStore extends DurableObject {
  async addIncident(incident: Incident): Promise<void> {
    await this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        statusCode INTEGER NOT NULL,
        errorMessage TEXT NOT NULL,
        analysis TEXT,
        report TEXT,
        resolved INTEGER DEFAULT 0
      )`
    );

    await this.ctx.storage.sql.exec(
      `INSERT INTO incidents (id, service, timestamp, statusCode, errorMessage, analysis, report, resolved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      incident.id,
      incident.service,
      incident.timestamp,
      incident.statusCode,
      incident.errorMessage,
      incident.analysis || null,
      incident.report || null,
      incident.resolved ? 1 : 0
    );
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.analysis !== undefined) {
      fields.push('analysis = ?');
      values.push(updates.analysis);
    }
    if (updates.report !== undefined) {
      fields.push('report = ?');
      values.push(updates.report);
    }
    if (updates.resolved !== undefined) {
      fields.push('resolved = ?');
      values.push(updates.resolved ? 1 : 0);
    }

    if (fields.length > 0) {
      values.push(id);
      await this.ctx.storage.sql.exec(
        `UPDATE incidents SET ${fields.join(', ')} WHERE id = ?`,
        ...values
      );
    }
  }

  async getIncidents(limit: number = 50): Promise<Incident[]> {
    await this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        statusCode INTEGER NOT NULL,
        errorMessage TEXT NOT NULL,
        analysis TEXT,
        report TEXT,
        resolved INTEGER DEFAULT 0
      )`
    );

    const cursor = this.ctx.storage.sql.exec(
      `SELECT * FROM incidents ORDER BY timestamp DESC LIMIT ?`,
      limit
    );

    const incidents: Incident[] = [];
    for (const row of cursor) {
      incidents.push({
        id: row.id as string,
        service: row.service as string,
        timestamp: row.timestamp as number,
        statusCode: row.statusCode as number,
        errorMessage: row.errorMessage as string,
        analysis: row.analysis as string | undefined,
        report: row.report as string | undefined,
        resolved: (row.resolved as number) === 1,
      });
    }

    return incidents;
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    const cursor = this.ctx.storage.sql.exec(
      `SELECT * FROM incidents WHERE id = ? LIMIT 1`,
      id
    );

    for (const row of cursor) {
      return {
        id: row.id as string,
        service: row.service as string,
        timestamp: row.timestamp as number,
        statusCode: row.statusCode as number,
        errorMessage: row.errorMessage as string,
        analysis: row.analysis as string | undefined,
        report: row.report as string | undefined,
        resolved: (row.resolved as number) === 1,
      };
    }

    return null;
  }

  async getStats(): Promise<{ total: number; unresolved: number; byService: Record<string, number> }> {
    await this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        statusCode INTEGER NOT NULL,
        errorMessage TEXT NOT NULL,
        analysis TEXT,
        report TEXT,
        resolved INTEGER DEFAULT 0
      )`
    );

    const totalCursor = this.ctx.storage.sql.exec(`SELECT COUNT(*) as count FROM incidents`);
    let total = 0;
    for (const row of totalCursor) {
      total = row.count as number;
    }

    const unresolvedCursor = this.ctx.storage.sql.exec(
      `SELECT COUNT(*) as count FROM incidents WHERE resolved = 0`
    );
    let unresolved = 0;
    for (const row of unresolvedCursor) {
      unresolved = row.count as number;
    }

    const byServiceCursor = this.ctx.storage.sql.exec(
      `SELECT service, COUNT(*) as count FROM incidents GROUP BY service`
    );
    const byService: Record<string, number> = {};
    for (const row of byServiceCursor) {
      byService[row.service as string] = row.count as number;
    }

    return { total, unresolved, byService };
  }
}

interface ServiceStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: number;
  errorCount: number;
}

// ServiceMonitor - Tracks current service status
export class ServiceMonitor extends DurableObject {
  async updateStatus(service: string, status: ServiceStatus): Promise<void> {
    await this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS service_status (
        service TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        lastCheck INTEGER NOT NULL,
        errorCount INTEGER DEFAULT 0
      )`
    );

    await this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO service_status (service, status, lastCheck, errorCount)
       VALUES (?, ?, ?, ?)`,
      service,
      status.status,
      status.lastCheck,
      status.errorCount
    );
  }

  async getStatus(): Promise<ServiceStatus[]> {
    await this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS service_status (
        service TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        lastCheck INTEGER NOT NULL,
        errorCount INTEGER DEFAULT 0
      )`
    );

    const cursor = this.ctx.storage.sql.exec(
      `SELECT * FROM service_status ORDER BY lastCheck DESC`
    );

    const statuses: ServiceStatus[] = [];
    for (const row of cursor) {
      statuses.push({
        service: row.service as string,
        status: row.status as 'healthy' | 'degraded' | 'down',
        lastCheck: row.lastCheck as number,
        errorCount: row.errorCount as number,
      });
    }

    return statuses;
  }

  async getServiceStatus(service: string): Promise<ServiceStatus | null> {
    const cursor = this.ctx.storage.sql.exec(
      `SELECT * FROM service_status WHERE service = ? LIMIT 1`,
      service
    );

    for (const row of cursor) {
      return {
        service: row.service as string,
        status: row.status as 'healthy' | 'degraded' | 'down',
        lastCheck: row.lastCheck as number,
        errorCount: row.errorCount as number,
      };
    }

    return null;
  }

  async incrementErrorCount(service: string): Promise<void> {
    await this.ctx.storage.sql.exec(
      `UPDATE service_status SET errorCount = errorCount + 1 WHERE service = ?`,
      service
    );
  }

  async resetErrorCount(service: string): Promise<void> {
    await this.ctx.storage.sql.exec(
      `UPDATE service_status SET errorCount = 0 WHERE service = ?`,
      service
    );
  }
}