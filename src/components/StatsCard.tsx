
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
  };
}

const StatsCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  iconColor = "text-muted-foreground",
  trend 
}: StatsCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <span className={trend.value >= 0 ? "text-green-600" : "text-red-600"}>
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
            <span className="ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
