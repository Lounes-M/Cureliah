import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  AlertTriangle,
  Shield,
  Clock,
  Target
} from 'lucide-react';
import { useBusinessIntelligence, type BIMetrics, type PredictiveInsight } from '@/utils/businessIntelligence';

interface DashboardProps {
  userRole: 'admin' | 'doctor' | 'establishment';
  userId: string;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, trend, icon, subtitle }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const InsightCard: React.FC<{ insight: PredictiveInsight }> = ({ insight }) => {
  const getTypeColor = () => {
    switch (insight.type) {
      case 'opportunity': return 'bg-green-50 border-green-200';
      case 'risk': return 'bg-red-50 border-red-200';
      case 'trend': return 'bg-blue-50 border-blue-200';
      case 'anomaly': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = () => {
    switch (insight.type) {
      case 'opportunity': return <Target className="w-5 h-5 text-green-600" />;
      case 'risk': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'trend': return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'anomaly': return <Activity className="w-5 h-5 text-yellow-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Card className={`${getTypeColor()} border-l-4`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {getTypeIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{insight.title}</h4>
              <Badge variant="outline" className="text-xs">
                {Math.round(insight.confidence * 100)}% confidence
              </Badge>
            </div>
            <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
            
            {insight.recommendations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Recommendations:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {insight.recommendations.slice(0, 2).map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AdvancedDashboard: React.FC<DashboardProps> = ({ userRole, userId }) => {
  const { metrics, insights, loading, trackEvent } = useBusinessIntelligence();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock chart data based on metrics
    if (metrics) {
      const data = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bookings: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 5000) + 2000,
        users: Math.floor(Math.random() * 100) + 50,
        satisfaction: Math.random() * 2 + 3.5,
      }));
      setChartData(data);
    }
  }, [metrics]);

  const handleActionClick = (action: string, context: any) => {
    trackEvent(`dashboard_action_${action}`, 1, context);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-gray-500 p-8">
        <p>Unable to load dashboard data. Please try refreshing the page.</p>
      </div>
    );
  }

  const kpiData = [
    {
      title: 'Active Users',
      value: metrics.activeUsers.toLocaleString(),
      change: metrics.userGrowthRate,
      trend: metrics.userGrowthRate > 0 ? 'up' as const : 'down' as const,
      icon: <Users className="w-6 h-6 text-blue-600" />,
      subtitle: `${metrics.newUsersToday} new today`
    },
    {
      title: 'Bookings This Week',
      value: metrics.bookingsWeek,
      change: 12.5,
      trend: 'up' as const,
      icon: <Calendar className="w-6 h-6 text-green-600" />,
      subtitle: `${metrics.bookingsToday} today`
    },
    {
      title: 'Revenue',
      value: `$${metrics.revenue.toLocaleString()}`,
      change: 8.2,
      trend: 'up' as const,
      icon: <DollarSign className="w-6 h-6 text-yellow-600" />,
      subtitle: 'This month'
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversionRate}%`,
      change: -2.1,
      trend: 'down' as const,
      icon: <Target className="w-6 h-6 text-purple-600" />,
      subtitle: 'Last 30 days'
    }
  ];

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {userRole === 'admin' ? 'Admin Dashboard' : 
             userRole === 'doctor' ? 'Doctor Dashboard' : 
             'Establishment Dashboard'}
          </h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button 
            onClick={() => handleActionClick('refresh', { timeRange: selectedTimeRange })}
            variant="outline" 
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke={chartColors[0]} 
                  fill={`${chartColors[0]}20`} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={chartColors[1]} 
                  strokeWidth={2}
                  dot={{ fill: chartColors[1] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="medical">Medical Metrics</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Average Session Duration</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.sessionDuration} min</p>
                  <Progress value={75} className="w-full" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Pages per Session</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.pageViewsPerSession}</p>
                  <Progress value={65} className="w-full" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.bounceRate}%</p>
                  <Progress value={metrics.bounceRate} className="w-full" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill={chartColors[2]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="medical" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Doctor Utilization</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={metrics.doctorUtilization} className="flex-1" />
                      <span className="text-sm font-medium">{metrics.doctorUtilization}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Vaccine Completion Rate</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={metrics.vaccineCompletionRate} className="flex-1" />
                      <span className="text-sm font-medium">{metrics.vaccineCompletionRate}%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Establishment Satisfaction</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-3xl font-bold text-yellow-600">
                      {metrics.establishmentSatisfaction}
                    </span>
                    <span className="text-sm text-gray-500">/ 5.0</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Average Booking Value: ${metrics.averageBookingValue}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Security Status</p>
                        <p className="text-lg font-bold text-green-900">Secure</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Alerts</p>
                        <p className="text-lg font-bold text-yellow-900">3 Active</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Uptime</p>
                        <p className="text-lg font-bold text-blue-900">99.9%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-6 h-6" />
              <span>AI-Powered Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.slice(0, 4).map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </div>
            {insights.length > 4 && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => handleActionClick('view_all_insights', { count: insights.length })}
                >
                  View All {insights.length} Insights
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => handleActionClick('export_data', { type: 'csv' })}
            >
              <Activity className="w-6 h-6 mb-2" />
              Export Data
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => handleActionClick('generate_report', { type: 'monthly' })}
            >
              <Clock className="w-6 h-6 mb-2" />
              Generate Report
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => handleActionClick('view_alerts', {})}
            >
              <AlertTriangle className="w-6 h-6 mb-2" />
              View Alerts
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => handleActionClick('system_health', {})}
            >
              <Shield className="w-6 h-6 mb-2" />
              System Health
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedDashboard;
