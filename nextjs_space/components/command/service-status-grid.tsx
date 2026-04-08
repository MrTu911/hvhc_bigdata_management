
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface ServiceData {
  performance: {
    services: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      uptime: string;
      responseTime: number;
      lastCheck: Date;
    }>;
  };
}

interface Props {
  data: ServiceData;
}

export function ServiceStatusGrid({ data }: Props) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'DEGRADED':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'DOWN':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'DEGRADED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'DOWN':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Trạng thái các dịch vụ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.performance.services.slice(0, 9).map((service) => (
            <div
              key={service.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <h4 className="font-medium text-sm">{service.name}</h4>
                </div>
                <Badge variant="outline" className={`text-xs ${getStatusColor(service.status)}`}>
                  {service.status}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-medium">{service.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Response:</span>
                  <span className="font-medium">{service.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{service.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
