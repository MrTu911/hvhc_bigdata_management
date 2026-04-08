"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Search, Download } from "lucide-react";
import { toast } from "sonner";

interface LoginLog {
  id: number;
  user_id: number | null;
  email: string;
  ip_address: string;
  user_agent: string;
  location: string | null;
  status: string;
  failure_reason: string | null;
  login_method: string | null;
  created_at: string;
}

interface Stats {
  dailyStats: any[];
  suspiciousLogins: any[];
  overallStats: {
    total_attempts: number;
    successful_logins: number;
    failed_logins: number;
    blocked_attempts: number;
    unique_users: number;
    unique_ips: number;
  };
  topUsers: any[];
  topIPs: any[];
}

export default function LoginAuditPage() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filterStatus, searchEmail, offset]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (filterStatus && filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      if (searchEmail) {
        params.append("email", searchEmail);
      }

      const response = await fetch(`/api/auth/audit?${params}`);
      if (!response.ok) throw new Error("Failed to fetch logs");

      const data = await response.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error("Failed to load login logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/auth/audit/stats?days=30");
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case "blocked":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Blocked
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportLogs = () => {
    // Convert logs to CSV
    const headers = ["Date", "Email", "IP Address", "Status", "Location", "User Agent"];
    const rows = logs.map((log) => [
      new Date(log.created_at).toLocaleString("vi-VN"),
      log.email,
      log.ip_address || "-",
      log.status,
      log.location || "-",
      log.user_agent || "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `login-audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast.success("Logs exported successfully");
  };

  const successRate =
    stats?.overallStats
      ? (
          (stats.overallStats.successful_logins / stats.overallStats.total_attempts) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Login Audit</h1>
          <p className="text-muted-foreground">Monitor and analyze login activities</p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats?.overallStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overallStats.total_attempts}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.overallStats.successful_logins} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overallStats.failed_logins}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overallStats.unique_users}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suspicious Activity Alert */}
      {stats?.suspiciousLogins && stats.suspiciousLogins.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700 dark:text-red-400">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Suspicious Activity Detected
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              {stats.suspiciousLogins.length} suspicious login patterns detected in the last hour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.suspiciousLogins.slice(0, 3).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.email}</span>
                  <span className="text-red-600 dark:text-red-400">{item.failed_attempts} failed attempts</span>
                  <span className="text-muted-foreground">{item.ip_address}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>View and filter all login attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchLogs} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="font-medium">{log.email}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ip_address || "-"}</TableCell>
                      <TableCell>{log.location || "-"}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="capitalize">{log.login_method || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} logs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
