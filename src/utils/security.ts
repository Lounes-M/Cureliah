// Use Web Crypto API for browser compatibility
const crypto = globalThis.crypto;
import { monitoring } from './monitoring';
import Logger from './logger';

const logger = Logger.getInstance();

// Security Event Types
type SecurityEventType = 
  | 'login_attempt'
  | 'failed_login'
  | 'suspicious_activity'
  | 'data_access'
  | 'privilege_escalation'
  | 'api_abuse'
  | 'data_breach_attempt'
  | 'security_scan_detected';

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  description: string;
  metadata: Record<string, any>;
  blocked: boolean;
}

interface SecurityRule {
  id: string;
  name: string;
  type: 'rate_limit' | 'geo_block' | 'behavioral' | 'content_filter';
  enabled: boolean;
  conditions: SecurityCondition[];
  actions: SecurityAction[];
  priority: number;
}

interface SecurityCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'matches';
  value: any;
}

interface SecurityAction {
  type: 'block' | 'alert' | 'log' | 'throttle' | 'require_mfa';
  parameters?: Record<string, any>;
}

interface ThreatIntelligence {
  ip: string;
  reputation: 'good' | 'suspicious' | 'malicious';
  categories: string[];
  lastSeen: Date;
  confidence: number;
}

class SecurityService {
  private static instance: SecurityService;
  private securityRules: Map<string, SecurityRule> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: Date }> = new Map();
  private failedAttempts: Map<string, number> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  
  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  constructor() {
    this.initializeSecurityRules();
    this.startSecurityMonitoring();
  }

  // Initialize security rules
  private initializeSecurityRules(): void {
    const defaultRules: SecurityRule[] = [
      {
        id: 'rate_limit_api',
        name: 'API Rate Limiting',
        type: 'rate_limit',
        enabled: true,
        conditions: [
          { field: 'path', operator: 'contains', value: '/api/' }
        ],
        actions: [
          { type: 'throttle', parameters: { limit: 100, window: 60000 } }
        ],
        priority: 1
      },
      {
        id: 'failed_login_protection',
        name: 'Failed Login Protection',
        type: 'behavioral',
        enabled: true,
        conditions: [
          { field: 'failed_attempts', operator: 'greater_than', value: 5 }
        ],
        actions: [
          { type: 'block', parameters: { duration: 900000 } }, // 15 minutes
          { type: 'alert', parameters: { severity: 'high' } }
        ],
        priority: 2
      },
      {
        id: 'medical_data_access',
        name: 'Medical Data Access Control',
        type: 'content_filter',
        enabled: true,
        conditions: [
          { field: 'path', operator: 'contains', value: '/medical-records' }
        ],
        actions: [
          { type: 'require_mfa' },
          { type: 'log', parameters: { level: 'security' } }
        ],
        priority: 3
      }
    ];

    defaultRules.forEach(rule => {
      this.securityRules.set(rule.id, rule);
    });
  }

  // Main security check function
  async checkSecurity(request: {
    ip: string;
    userAgent: string;
    path: string;
    method: string;
    userId?: string;
    headers: Record<string, string>;
  }): Promise<{ allowed: boolean; reason?: string; action?: string }> {
    
    try {
      // Check threat intelligence
      const threatLevel = await this.checkThreatIntelligence(request.ip);
      if (threatLevel === 'malicious') {
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'critical',
          ip: request.ip,
          userAgent: request.userAgent,
          description: 'Request from known malicious IP',
          metadata: { threatLevel },
          blocked: true
        });
        return { allowed: false, reason: 'Malicious IP detected' };
      }

      // Check rate limiting
      const rateLimitResult = this.checkRateLimit(request.ip, request.path);
      if (!rateLimitResult.allowed) {
        return { allowed: false, reason: 'Rate limit exceeded', action: 'throttle' };
      }

      // Check failed login attempts
      if (request.path.includes('/auth/login')) {
        const failedAttempts = this.failedAttempts.get(request.ip) || 0;
        if (failedAttempts > 5) {
          return { allowed: false, reason: 'Too many failed login attempts' };
        }
      }

      // Check for suspicious patterns
      const suspiciousActivity = this.detectSuspiciousActivity(request);
      if (suspiciousActivity.detected) {
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          severity: suspiciousActivity.severity,
          ip: request.ip,
          userAgent: request.userAgent,
          description: suspiciousActivity.description,
          metadata: suspiciousActivity.metadata,
          blocked: suspiciousActivity.shouldBlock
        });
        
        if (suspiciousActivity.shouldBlock) {
          return { allowed: false, reason: suspiciousActivity.description };
        }
      }

      // Check medical data access
      if (request.path.includes('/medical') || request.path.includes('/health')) {
        const mfaRequired = await this.checkMedicalDataAccess(request);
        if (mfaRequired) {
          return { allowed: false, reason: 'MFA required for medical data access', action: 'require_mfa' };
        }
      }

      return { allowed: true };
      
    } catch (error) {
      // TODO: Replace with logger.error('Security check failed:', error);
      // Fail secure - deny access on error
      return { allowed: false, reason: 'Security check failed' };
    }
  }

  // Rate limiting
  private checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number } {
    const key = `${ip}:${path}`;
    const now = new Date();
    
    let limiter = this.rateLimiters.get(key);
    
    if (!limiter || now > limiter.resetTime) {
      // Reset or create new limiter
      limiter = {
        count: 1,
        resetTime: new Date(now.getTime() + 60000) // 1 minute window
      };
      this.rateLimiters.set(key, limiter);
      return { allowed: true, remaining: 99 };
    }

    limiter.count++;
    
    if (limiter.count > 100) { // 100 requests per minute
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: 100 - limiter.count };
  }

  // Detect suspicious activity
  private detectSuspiciousActivity(request: any): {
    detected: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    shouldBlock: boolean;
    metadata: Record<string, any>;
  } {
    const suspiciousPatterns = [
      // SQL Injection attempts
      { pattern: /union\s+select|drop\s+table|exec\s+xp_/i, severity: 'high' as const, description: 'SQL injection attempt detected' },
      
      // XSS attempts
      { pattern: /<script|javascript:|onload=|onerror=/i, severity: 'high' as const, description: 'XSS attempt detected' },
      
      // Path traversal
      { pattern: /\.\.\/|\.\.\\|%2e%2e%2f/i, severity: 'medium' as const, description: 'Path traversal attempt detected' },
      
      // Medical data scraping
      { pattern: /bot|crawler|scraper/i, severity: 'medium' as const, description: 'Automated scraping detected' },
      
      // Suspicious user agents
      { pattern: /sqlmap|nmap|nikto|burp|owasp/i, severity: 'high' as const, description: 'Security scanning tool detected' }
    ];

    // Check URL and headers for suspicious patterns
    const checkText = `${request.path} ${request.userAgent} ${JSON.stringify(request.headers)}`;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.pattern.test(checkText)) {
        const severity = pattern.severity;
        const shouldBlock = ['high', 'critical'].includes(severity);
        return {
          detected: true,
          severity,
          description: pattern.description,
          shouldBlock,
          metadata: { pattern: pattern.pattern.toString(), matchedText: checkText.match(pattern.pattern)?.[0] }
        };
      }
    }

    // Check for rapid requests from same IP
    const recentRequests = this.getRecentRequestCount(request.ip);
    if (recentRequests > 50) { // More than 50 requests in last minute
      return {
        detected: true,
        severity: 'medium',
        description: 'Rapid request pattern detected',
        shouldBlock: recentRequests > 100,
        metadata: { requestCount: recentRequests }
      };
    }

    return {
      detected: false,
      severity: 'low',
      description: '',
      shouldBlock: false,
      metadata: {}
    };
  }

  // Check threat intelligence
  private async checkThreatIntelligence(ip: string): Promise<'good' | 'suspicious' | 'malicious'> {
    try {
      // In production: integrate with threat intelligence API
      // For now, check against known malicious patterns
      
      // Check if IP is in suspicious list
      if (this.suspiciousIPs.has(ip)) {
        return 'suspicious';
      }

      // Basic checks for common malicious IP patterns
      const ipParts = ip.split('.');
      
      // Check for private/local IPs (should not be blocked)
      if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('127.')) {
        return 'good';
      }

      // Check for known malicious ranges (simplified example)
      const suspiciousRanges = ['103.', '185.', '91.'];
      if (suspiciousRanges.some(range => ip.startsWith(range))) {
        return 'suspicious';
      }

      return 'good';
      
    } catch (error) {
      // TODO: Replace with logger.error('Threat intelligence check failed:', error);
      return 'good'; // Fail open for availability
    }
  }

  // Check medical data access requirements
  private async checkMedicalDataAccess(request: any): Promise<boolean> {
    // Medical data requires additional security
    if (!request.userId) {
      return true; // Require authentication first
    }

    // Check if user has proper medical data permissions
    // In production: check user roles and permissions
    const hasPermission = await this.checkMedicalDataPermissions(request.userId);
    
    if (!hasPermission) {
      return true; // Require MFA if no proper permissions
    }

    // Check if MFA was recently completed
    const mfaStatus = await this.checkRecentMFA(request.userId);
    
    return !mfaStatus.completed || mfaStatus.expired;
  }

  // Log security events
  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...event
    };

    try {
      // Log to console for now (monitoring system doesn't have security logging method)
      console.log('Security Event:', {
        type: securityEvent.type,
        severity: securityEvent.severity,
        blocked: securityEvent.blocked,
        ip: securityEvent.ip,
        description: securityEvent.description,
        ...securityEvent.metadata
      });

      // Store security event
      // TODO: Replace with logger.info('Security Event:', securityEvent);

      // Send alerts for high/critical events
      if (securityEvent.severity === 'high' || securityEvent.severity === 'critical') {
        await this.sendSecurityAlert(securityEvent);
      }

      // Update IP reputation
      if (securityEvent.blocked) {
        this.suspiciousIPs.add(securityEvent.ip);
      }

    } catch (error) {
      // TODO: Replace with logger.error('Failed to log security event:', error);
    }
  }

  // Security monitoring and cleanup
  private startSecurityMonitoring(): void {
    // Clean up old rate limiters every 5 minutes
    setInterval(() => {
      const now = new Date();
      for (const [key, limiter] of this.rateLimiters.entries()) {
        if (now > limiter.resetTime) {
          this.rateLimiters.delete(key);
        }
      }
    }, 5 * 60 * 1000);

    // Reset failed attempts every hour
    setInterval(() => {
      this.failedAttempts.clear();
    }, 60 * 60 * 1000);

    // Clean up suspicious IPs every day
    setInterval(() => {
      this.suspiciousIPs.clear();
    }, 24 * 60 * 60 * 1000);
  }

  // Helper methods
  private getRecentRequestCount(ip: string): number {
    // In production: check request logs/cache
    return Math.floor(Math.random() * 30); // Mock data
  }

  private async checkMedicalDataPermissions(userId: string): Promise<boolean> {
    // In production: check user permissions in database
    return true; // Mock: assume user has permissions
  }

  private async checkRecentMFA(userId: string): Promise<{ completed: boolean; expired: boolean }> {
    // In production: check MFA completion status
    return { completed: false, expired: true }; // Mock: require MFA
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // In production: send to security team via email/Slack/PagerDuty
    console.warn('SECURITY ALERT:', {
      type: event.type,
      severity: event.severity,
      description: event.description,
      ip: event.ip,
      timestamp: event.timestamp
    });
  }

  // Public methods for tracking security events
  public recordFailedLogin(ip: string): void {
    const current = this.failedAttempts.get(ip) || 0;
    this.failedAttempts.set(ip, current + 1);
    
    this.logSecurityEvent({
      type: 'failed_login',
      severity: current > 3 ? 'high' : 'medium',
      ip,
      userAgent: '',
      description: `Failed login attempt ${current + 1}`,
      metadata: { attemptCount: current + 1 },
      blocked: current > 5
    });
  }

  public recordSuccessfulLogin(ip: string, userId: string): void {
    // Reset failed attempts on successful login
    this.failedAttempts.delete(ip);
    
    this.logSecurityEvent({
      type: 'login_attempt',
      severity: 'low',
      ip,
      userAgent: '',
      description: 'Successful login',
      metadata: { userId },
      blocked: false
    });
  }

  public recordDataAccess(userId: string, dataType: string, recordCount: number): void {
    this.logSecurityEvent({
      type: 'data_access',
      severity: 'low',
      userId,
      ip: '',
      userAgent: '',
      description: `Accessed ${dataType} data`,
      metadata: { dataType, recordCount },
      blocked: false
    });
  }
}

// Data Loss Prevention (DLP) Service
class DLPService {
  private static instance: DLPService;
  private sensitivePatterns: RegExp[] = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit Card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{10}\b/g, // Phone numbers
    /\b(?:patient|medical|health)\s+(?:id|number|record)\s*:?\s*[\w-]+/gi // Medical IDs
  ];

  static getInstance(): DLPService {
    if (!DLPService.instance) {
      DLPService.instance = new DLPService();
    }
    return DLPService.instance;
  }

  // Scan content for sensitive data
  scanContent(content: string): {
    hasSensitiveData: boolean;
    findings: Array<{ type: string; value: string; position: number }>;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const findings: Array<{ type: string; value: string; position: number }> = [];
    
    this.sensitivePatterns.forEach((pattern, index) => {
      const matches = [...content.matchAll(pattern)];
      const types = ['SSN', 'Credit Card', 'Email', 'Phone', 'Medical ID'];
      
      matches.forEach(match => {
        findings.push({
          type: types[index] || 'Unknown',
          value: match[0],
          position: match.index || 0
        });
      });
    });

    const riskLevel = this.calculateRiskLevel(findings);
    
    if (findings.length > 0) {
      // Log DLP event
      const securityService = SecurityService.getInstance();
      securityService.recordDataAccess('system', 'sensitive_data_scan', findings.length);
    }

    return {
      hasSensitiveData: findings.length > 0,
      findings,
      riskLevel
    };
  }

  // Redact sensitive data from content
  redactContent(content: string): string {
    let redactedContent = content;
    
    this.sensitivePatterns.forEach(pattern => {
      redactedContent = redactedContent.replace(pattern, '[REDACTED]');
    });

    return redactedContent;
  }

  private calculateRiskLevel(findings: Array<any>): 'low' | 'medium' | 'high' {
    if (findings.length === 0) return 'low';
    if (findings.length <= 2) return 'medium';
    return 'high';
  }
}

export {
  SecurityService,
  DLPService,
  type SecurityEvent,
  type SecurityRule,
  type ThreatIntelligence
};
