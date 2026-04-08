
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertCircle, CheckCircle2, XCircle, RefreshCw, TrendingUp } from "lucide-react";

type ServiceStatus = "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN";
type AlertSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface Service {
  id: string;
  name: string;
  type: string;
  status: ServiceStatus;
  url: string | null;
  uptime: number | null;
  lastChecked: string | null;
  activeAlerts: number;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  triggeredAt: string;
  service: {
    name: string;
    type: string;
  };
}

export default function MonitoringDashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    healthy: 0,
    degraded: 0,
    down: 0,
    healthPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch services
      const servicesRes = await fetch("/api/monitoring/services");
      const servicesData = await servicesRes.json();
      
      if (servicesData.success) {
        setServices(servicesData.services);
        setSummary(servicesData.summary);
      }

      // Fetch alerts
      const alertsRes = await fetch("/api/monitoring/alerts?status=ACTIVE");
      const alertsData = await alertsRes.json();
      
      if (alertsData.success) {
        setAlerts(alertsData.alerts);
      }

    } catch (error) {
      console.error("Failed to fetch monitoring data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const runHealthCheck = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/monitoring/services", {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Refresh data after health check
        await fetchData();
      }
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch("/api/monitoring/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          action: "acknowledge",
        }),
      });
      
      // Refresh alerts
      fetchData();
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case "HEALTHY":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "DEGRADED":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "DOWN":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    const variants: Record<ServiceStatus, any> = {
      HEALTHY: "default",
      DEGRADED: "warning",
      DOWN: "destructive",
      UNKNOWN: "secondary",
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    const colors: Record<AlertSeverity, string> = {
      CRITICAL: "bg-red-500",
      ERROR: "bg-orange-500",
      WARNING: "bg-yellow-500",
      INFO: "bg-blue-500",
    };
    
    return (
      <Badge className={colors[severity]}>
        {severity}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of BigData services and infrastructure
          </p>
        </div>
        <Button
          onClick={runHealthCheck}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Run Health Check
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Healthy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {summary.healthy}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Degraded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {summary.degraded}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Down
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {summary.down}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summary.healthPercentage}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Services Status</CardTitle>
          <CardDescription>
            Current status of all BigData infrastructure services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <CardTitle className="text-base">
                        {service.name}
                      </CardTitle>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                  <CardDescription className="uppercase text-xs">
                    {service.type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {service.uptime !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="font-medium">
                        {service.uptime.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  
                  {service.lastChecked && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Check:</span>
                      <span className="font-medium">
                        {new Date(service.lastChecked).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  
                  {service.activeAlerts > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Alerts:</span>
                      <Badge variant="destructive" className="text-xs">
                        {service.activeAlerts}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>
              System alerts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getSeverityBadge(alert.severity)}
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Service: {alert.service.name}</span>
                      <span>•</span>
                      <span>
                        {new Date(alert.triggeredAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
