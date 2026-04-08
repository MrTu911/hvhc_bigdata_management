
/**
 * Instructor Dashboard: Early Warning System
 * AI-powered at-risk student detection
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AtRiskStudentsList } from '@/components/instructor/at-risk-students-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, RefreshCw, Download, TrendingDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RiskStatistics {
  total_students: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  average_risk_score: number;
  at_risk_percentage: number;
}

export default function EarlyWarningPage() {
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [minRiskScore, setMinRiskScore] = useState(50);
  const [students, setStudents] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<RiskStatistics | null>(null);

  // Fetch courses
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/dashboard/instructor/courses');
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
          if (data.courses?.length > 0) {
            setSelectedCourse(data.courses[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        toast.error('Không thể tải danh sách khóa học');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchCourses();
    }
  }, [session]);

  // Fetch at-risk students
  useEffect(() => {
    async function fetchAtRiskStudents() {
      if (!selectedCourse) return;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/ai/predict/at-risk-students?course_id=${selectedCourse}&min_risk_score=${minRiskScore}`
        );
        
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
          setStatistics(data.statistics || null);
        } else {
          toast.error('Không thể tải dữ liệu học viên');
        }
      } catch (error) {
        console.error('Failed to fetch at-risk students:', error);
        toast.error('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }

    fetchAtRiskStudents();
  }, [selectedCourse, minRiskScore]);

  const handleContactStudent = (studentId: number) => {
    // Implement contact functionality
    toast.success(`Tính năng liên hệ học viên ID: ${studentId} đang được phát triển`);
  };

  const handleViewDetails = (studentId: number) => {
    // Navigate to student details
    window.location.href = `/dashboard/instructor/students/${studentId}`;
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleExport = () => {
    if (students.length === 0) return;

    const csvContent = [
      ['Tên học viên', 'Điểm rủi ro', 'Mức độ', 'Yếu tố chính', 'Đề xuất'],
      ...students.map(s => [
        s.student_name,
        s.risk_score,
        s.risk_level,
        s.factors.map((f: any) => f.factor).join('; '),
        s.recommendations.join('; ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `hoc-vien-rui-ro-${selectedCourse}-${Date.now()}.csv`;
    link.click();

    toast.success('Đã xuất báo cáo');
  };

  if (loading && !students.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            Hệ thống cảnh báo sớm
          </h1>
          <p className="text-muted-foreground mt-1">
            AI phát hiện học viên có nguy cơ học tập
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button onClick={handleExport} disabled={students.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chọn khóa học</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn khóa học..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ngưỡng điểm rủi ro tối thiểu</CardTitle>
            <CardDescription>
              Hiện: {minRiskScore}/100
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Slider
              value={[minRiskScore]}
              onValueChange={(value) => setMinRiskScore(value[0])}
              min={0}
              max={100}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>0 (Tất cả)</span>
              <span>50 (Trung bình)</span>
              <span>100 (Chỉ cao nhất)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Thống kê tổng quan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <div className="text-2xl font-bold">{statistics.total_students}</div>
                <p className="text-xs text-muted-foreground">Tổng học viên</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{statistics.critical}</div>
                <p className="text-xs text-muted-foreground">Nguy cơ cao</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{statistics.high}</div>
                <p className="text-xs text-muted-foreground">Rủi ro cao</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{statistics.medium}</div>
                <p className="text-xs text-muted-foreground">Rủi ro TB</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{statistics.low}</div>
                <p className="text-xs text-muted-foreground">Rủi ro thấp</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Điểm rủi ro TB:</span>
                <span className="text-lg font-semibold">{statistics.average_risk_score}/100</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Tỷ lệ rủi ro cao:</span>
                <span className="text-lg font-semibold text-orange-600">
                  {statistics.at_risk_percentage}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert for high risk */}
      {statistics && statistics.at_risk_percentage > 20 && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Cảnh báo:</strong> {statistics.at_risk_percentage}% học viên có nguy cơ cao. 
            Khuyến nghị can thiệp sớm để cải thiện kết quả học tập.
          </AlertDescription>
        </Alert>
      )}

      {/* Students List */}
      <AtRiskStudentsList
        students={students}
        onContactStudent={handleContactStudent}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}
