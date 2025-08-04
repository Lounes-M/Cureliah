import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { monitoring } from '@/utils/monitoring';

// A/B Test configuration
interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABVariant[];
  trafficAllocation: number; // Percentage of users to include
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  targetMetrics: string[];
  segmentation?: UserSegment;
}

interface ABVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage of test traffic
  config: Record<string, any>;
}

interface UserSegment {
  userType?: ('doctor' | 'establishment' | 'admin')[];
  newUsers?: boolean;
  geography?: string[];
  deviceType?: ('mobile' | 'tablet' | 'desktop')[];
}

interface ExperimentResult {
  testId: string;
  variantId: string;
  userId: string;
  timestamp: Date;
  metric: string;
  value: number;
  metadata?: Record<string, any>;
}

// Business Intelligence Metrics
interface BIMetrics {
  // User Acquisition
  newUsersToday: number;
  newUsersWeek: number;
  userGrowthRate: number;
  
  // User Engagement
  activeUsers: number;
  sessionDuration: number;
  pageViewsPerSession: number;
  bounceRate: number;
  
  // Business Metrics
  bookingsToday: number;
  bookingsWeek: number;
  revenue: number;
  conversionRate: number;
  
  // Medical Platform Specific
  doctorUtilization: number;
  establishmentSatisfaction: number;
  averageBookingValue: number;
  vaccineCompletionRate: number;
}

interface PredictiveInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
  data: Record<string, any>;
}

class ABTestingService {
  private static instance: ABTestingService;
  private activeTests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map();
  
  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  // Initialize A/B tests from configuration
  async initializeTests(): Promise<void> {
    try {
      // In production: fetch from A/B testing service
      const tests = await this.fetchActiveTests();
      
      tests.forEach(test => {
        this.activeTests.set(test.id, test);
      });
      
      console.log('A/B tests initialized:', tests.length);
    } catch (error) {
      console.error('Failed to initialize A/B tests:', error);
    }
  }

  // Assign user to test variant
  assignUserToTest(testId: string, userId: string, userSegment?: any): string | null {
    const test = this.activeTests.get(testId);
    
    if (!test || !test.isActive) {
      return null;
    }

    // Check if user is in target segment
    if (!this.isUserInSegment(userSegment, test.segmentation)) {
      return null;
    }

    // Check traffic allocation
    if (Math.random() > test.trafficAllocation / 100) {
      return null;
    }

    // Get or create user assignments for this test
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }

    const userTests = this.userAssignments.get(userId)!;
    
    // Return existing assignment if available
    if (userTests.has(testId)) {
      return userTests.get(testId)!;
    }

    // Assign to variant based on weights
    const variant = this.selectVariantByWeight(test.variants);
    userTests.set(testId, variant.id);

    // Track the assignment
    monitoring.trackUserActivity({
      page: 'ab_test',
      action: 'user_assigned',
      timestamp: Date.now(),
      userId,
      metadata: {
        testId,
        variantId: variant.id,
        testName: test.name
      }
    });

    return variant.id;
  }

  // Get test configuration for user
  getTestConfig(testId: string, userId: string): Record<string, any> | null {
    const userTests = this.userAssignments.get(userId);
    if (!userTests?.has(testId)) {
      return null;
    }

    const variantId = userTests.get(testId)!;
    const test = this.activeTests.get(testId);
    const variant = test?.variants.find(v => v.id === variantId);

    return variant?.config || null;
  }

  // Track experiment result
  async trackResult(result: Omit<ExperimentResult, 'timestamp'>): Promise<void> {
    const experimentResult: ExperimentResult = {
      ...result,
      timestamp: new Date(),
    };

    try {
      // Send to analytics service
      console.log('Experiment result:', experimentResult);
      
      // Track with monitoring service
      monitoring.trackBusinessMetric(
        `ab_test.${result.metric}`,
        result.value,
        {
          testId: result.testId,
          variantId: result.variantId,
        }
      );

      // In production: send to A/B testing analytics
      await this.sendResultToAnalytics(experimentResult);
      
    } catch (error) {
      console.error('Failed to track experiment result:', error);
    }
  }

  // Private helper methods
  private async fetchActiveTests(): Promise<ABTest[]> {
    // Mock tests for demonstration
    return [
      {
        id: 'booking_flow_v2',
        name: 'Enhanced Booking Flow',
        description: 'Test new simplified booking process',
        variants: [
          {
            id: 'control',
            name: 'Current Flow',
            description: 'Existing booking process',
            weight: 50,
            config: { useNewFlow: false }
          },
          {
            id: 'simplified',
            name: 'Simplified Flow',
            description: 'New streamlined booking',
            weight: 50,
            config: { useNewFlow: true }
          }
        ],
        trafficAllocation: 20,
        isActive: true,
        startDate: new Date(),
        targetMetrics: ['conversion_rate', 'completion_time'],
        segmentation: { userType: ['establishment'] }
      }
    ];
  }

  private isUserInSegment(userSegment: any, testSegment?: UserSegment): boolean {
    if (!testSegment) return true;

    if (testSegment.userType && !testSegment.userType.includes(userSegment?.userType)) {
      return false;
    }

    // Add more segmentation logic as needed
    return true;
  }

  private selectVariantByWeight(variants: ABVariant[]): ABVariant {
    const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant;
      }
    }

    return variants[0]; // Fallback
  }

  private async sendResultToAnalytics(result: ExperimentResult): Promise<void> {
    // In production: send to analytics service
  }
}

class BusinessIntelligenceService {
  private static instance: BusinessIntelligenceService;

  static getInstance(): BusinessIntelligenceService {
    if (!BusinessIntelligenceService.instance) {
      BusinessIntelligenceService.instance = new BusinessIntelligenceService();
    }
    return BusinessIntelligenceService.instance;
  }

  // Get current business metrics
  async getBIMetrics(): Promise<BIMetrics> {
    try {
      // In production: fetch from analytics database
      const metrics = await this.fetchMetricsFromDB();
      
      return metrics;
    } catch (error) {
      console.error('Failed to fetch BI metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  // Generate predictive insights
  async generateInsights(): Promise<PredictiveInsight[]> {
    try {
      const metrics = await this.getBIMetrics();
      const insights: PredictiveInsight[] = [];

      // Trend analysis
      if (metrics.userGrowthRate > 20) {
        insights.push({
          type: 'trend',
          title: 'Strong User Growth Detected',
          description: `User growth rate of ${metrics.userGrowthRate}% indicates strong market adoption`,
          confidence: 0.85,
          impact: 'high',
          recommendations: [
            'Increase marketing budget to capitalize on growth',
            'Prepare infrastructure for scaling',
            'Implement user onboarding optimization'
          ],
          data: { growthRate: metrics.userGrowthRate }
        });
      }

      // Conversion optimization
      if (metrics.conversionRate < 5) {
        insights.push({
          type: 'opportunity',
          title: 'Conversion Rate Optimization Opportunity',
          description: `Current conversion rate of ${metrics.conversionRate}% is below industry average`,
          confidence: 0.75,
          impact: 'medium',
          recommendations: [
            'A/B test simplified booking flow',
            'Improve page load speeds',
            'Add social proof elements'
          ],
          data: { conversionRate: metrics.conversionRate }
        });
      }

      // Medical platform specific insights
      if (metrics.doctorUtilization < 70) {
        insights.push({
          type: 'risk',
          title: 'Low Doctor Utilization Risk',
          description: `Doctor utilization at ${metrics.doctorUtilization}% may indicate supply-demand imbalance`,
          confidence: 0.80,
          impact: 'high',
          recommendations: [
            'Increase establishment outreach',
            'Implement dynamic pricing',
            'Improve doctor profile visibility'
          ],
          data: { utilization: metrics.doctorUtilization }
        });
      }

      return insights;
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return [];
    }
  }

  // Track custom business event
  async trackBusinessEvent(
    eventType: string,
    value: number,
    properties?: Record<string, any>
  ): Promise<void> {
    try {
      monitoring.trackBusinessMetric(eventType, value, properties);
      
      // Store for BI analysis
      await this.storeBusinessEvent({
        eventType,
        value,
        properties,
        timestamp: new Date(),
      });
      
    } catch (error) {
      console.error('Failed to track business event:', error);
    }
  }

  // Private methods
  private async fetchMetricsFromDB(): Promise<BIMetrics> {
    // Mock data for demonstration
    return {
      newUsersToday: 45,
      newUsersWeek: 312,
      userGrowthRate: 25.3,
      activeUsers: 1247,
      sessionDuration: 18.5,
      pageViewsPerSession: 4.2,
      bounceRate: 32.1,
      bookingsToday: 23,
      bookingsWeek: 156,
      revenue: 18450,
      conversionRate: 3.8,
      doctorUtilization: 68.4,
      establishmentSatisfaction: 4.2,
      averageBookingValue: 185,
      vaccineCompletionRate: 94.2,
    };
  }

  private getDefaultMetrics(): BIMetrics {
    return {
      newUsersToday: 0,
      newUsersWeek: 0,
      userGrowthRate: 0,
      activeUsers: 0,
      sessionDuration: 0,
      pageViewsPerSession: 0,
      bounceRate: 0,
      bookingsToday: 0,
      bookingsWeek: 0,
      revenue: 0,
      conversionRate: 0,
      doctorUtilization: 0,
      establishmentSatisfaction: 0,
      averageBookingValue: 0,
      vaccineCompletionRate: 0,
    };
  }

  private async storeBusinessEvent(event: any): Promise<void> {
    // In production: store in analytics database
  }
}

// React Context for A/B Testing
const ABTestContext = createContext<{
  getVariant: (testId: string) => string | null;
  trackConversion: (testId: string, metric: string, value: number) => void;
} | null>(null);

export const ABTestProvider: React.FC<{ children: ReactNode; userId: string; userSegment?: any }> = ({ 
  children, 
  userId, 
  userSegment 
}) => {
  const [abService] = useState(() => ABTestingService.getInstance());

  useEffect(() => {
    abService.initializeTests();
  }, [abService]);

  const getVariant = (testId: string): string | null => {
    return abService.assignUserToTest(testId, userId, userSegment);
  };

  const trackConversion = (testId: string, metric: string, value: number) => {
    const variantId = abService.getTestConfig(testId, userId);
    if (variantId) {
      abService.trackResult({
        testId,
        variantId: variantId.toString(),
        userId,
        metric,
        value,
      });
    }
  };

  return (
    <ABTestContext.Provider value={{ getVariant, trackConversion }}>
      {children}
    </ABTestContext.Provider>
  );
};

// Hooks for A/B Testing and BI
export const useABTest = (testId: string) => {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTest must be used within ABTestProvider');
  }

  const variant = context.getVariant(testId);
  const trackConversion = (metric: string, value: number = 1) => {
    context.trackConversion(testId, metric, value);
  };

  return { variant, trackConversion };
};

export const useBusinessIntelligence = () => {
  const [metrics, setMetrics] = useState<BIMetrics | null>(null);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const biService = BusinessIntelligenceService.getInstance();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsData, insightsData] = await Promise.all([
          biService.getBIMetrics(),
          biService.generateInsights(),
        ]);

        setMetrics(metricsData);
        setInsights(insightsData);
      } catch (error) {
        console.error('Failed to fetch BI data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [biService]);

  const trackEvent = (eventType: string, value: number, properties?: Record<string, any>) => {
    biService.trackBusinessEvent(eventType, value, properties);
  };

  return {
    metrics,
    insights,
    loading,
    trackEvent,
  };
};

export { ABTestingService, BusinessIntelligenceService };
export type { ABTest, ABVariant, BIMetrics, PredictiveInsight };
