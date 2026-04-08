
/**
 * At-Risk Students List Component
 * Displays students with high risk scores
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertTriangle, 
  TrendingDown, 
  User, 
  Mail, 
  Phone,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react';

interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

interface StudentRiskProfile {
  student_id: number;
  student_name: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
  last_updated: Date;
}

interface AtRiskStudentsListProps {
  students: StudentRiskProfile[];
  onContactStudent?: (studentId: number) => void;
  onViewDetails?: (studentId: number) => void;
}

const RISK_LEVEL_CONFIG = {
  critical: {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: '🚨',
    label: 'Nguy cơ cao'
  },
  high: {
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '⚠️',
    label: 'Rủi ro cao'
  },
  medium: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '⚡',
    label: 'Rủi ro trung bình'
  },
  low: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '✓',
    label: 'Rủi ro thấp'
  }
};

function StudentRiskCard({ student, onContact, onViewDetails }: {
  student: StudentRiskProfile;
  onContact?: (id: number) => void;
  onViewDetails?: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = RISK_LEVEL_CONFIG[student.risk_level];

  return (
    <Card className={`border-l-4 ${config.color}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.student_name}`} />
              <AvatarFallback>{student.student_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{student.student_name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={config.color}>
                  {config.icon} {config.label}
                </Badge>
                <span className="text-sm font-semibold">
                  Điểm rủi ro: {student.risk_score}/100
                </span>
              </CardDescription>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Risk Score Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>Mức độ rủi ro</span>
            <span className="font-medium">{student.risk_score}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                student.risk_score >= 75 ? 'bg-red-500' :
                student.risk_score >= 50 ? 'bg-orange-500' :
                student.risk_score >= 25 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${student.risk_score}%` }}
            />
          </div>
        </div>

        {/* Top Risk Factors */}
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-medium flex items-center gap-1">
            <TrendingDown className="h-4 w-4" />
            Các yếu tố rủi ro chính:
          </h4>
          {student.factors.slice(0, expanded ? undefined : 2).map((factor, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{factor.factor}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      factor.impact >= 70 ? 'bg-red-500' :
                      factor.impact >= 40 ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${factor.impact}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8">{factor.impact}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <>
            {/* All Risk Factors Details */}
            {student.factors.length > 2 && (
              <div className="space-y-2 mb-4 pb-4 border-b">
                <h4 className="text-sm font-medium">Chi tiết:</h4>
                {student.factors.map((factor, index) => (
                  <div key={index} className="text-xs space-y-1 p-2 bg-secondary/30 rounded">
                    <div className="flex justify-between font-medium">
                      <span>{factor.factor}</span>
                      <span>{factor.impact}% impact</span>
                    </div>
                    <p className="text-muted-foreground">{factor.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {student.recommendations.length > 0 && (
              <Alert className="mb-4">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium text-sm mb-2">Đề xuất can thiệp:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {student.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => onContact?.(student.student_id)}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-1" />
                Liên hệ
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails?.(student.student_id)}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-1" />
                Hồ sơ
              </Button>
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          Cập nhật: {new Date(student.last_updated).toLocaleString('vi-VN')}
        </div>
      </CardContent>
    </Card>
  );
}

export function AtRiskStudentsList({ students, onContactStudent, onViewDetails }: AtRiskStudentsListProps) {
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const filteredStudents = students.filter(student => 
    filterLevel === 'all' || student.risk_level === filterLevel
  );

  const stats = {
    total: students.length,
    critical: students.filter(s => s.risk_level === 'critical').length,
    high: students.filter(s => s.risk_level === 'high').length,
    medium: students.filter(s => s.risk_level === 'medium').length
  };

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Không có học viên rủi ro cao</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Tổng học viên</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Nguy cơ cao</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <p className="text-xs text-muted-foreground">Rủi ro cao</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
            <p className="text-xs text-muted-foreground">Rủi ro TB</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filterLevel === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterLevel('all')}
        >
          Tất cả ({stats.total})
        </Button>
        <Button
          size="sm"
          variant={filterLevel === 'critical' ? 'default' : 'outline'}
          onClick={() => setFilterLevel('critical')}
        >
          🚨 Nguy cơ cao ({stats.critical})
        </Button>
        <Button
          size="sm"
          variant={filterLevel === 'high' ? 'default' : 'outline'}
          onClick={() => setFilterLevel('high')}
        >
          ⚠️ Rủi ro cao ({stats.high})
        </Button>
        <Button
          size="sm"
          variant={filterLevel === 'medium' ? 'default' : 'outline'}
          onClick={() => setFilterLevel('medium')}
        >
          ⚡ Rủi ro TB ({stats.medium})
        </Button>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.map(student => (
          <StudentRiskCard
            key={student.student_id}
            student={student}
            onContact={onContactStudent}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}
