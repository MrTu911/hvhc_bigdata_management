
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Archive, Trash2, Shield, CheckCircle } from 'lucide-react';

interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  classification: string;
  retentionDays: number;
  autoArchive: boolean;
  autoDelete: boolean;
  complianceReasons: string[];
}

export default function RetentionPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await fetch('/api/governance/retention');
        const data = await res.json();
        setPolicies(data.policies);
      } catch (error) {
        console.error('Error fetching retention policies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  const formatDuration = (days: number) => {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    
    if (years > 0) {
      return remainingDays > 0 ? `${years} năm ${remainingDays} ngày` : `${years} năm`;
    }
    return `${days} ngày`;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chính sách lưu trữ</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý thời gian lưu trữ và xử lý dữ liệu theo mức độ phân loại
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>{policy.name}</span>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {policy.description}
                  </CardDescription>
                </div>
                <Badge variant="outline">{policy.classification}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Thời gian lưu trữ</span>
                </div>
                <span className="text-sm font-bold">{formatDuration(policy.retentionDays)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border ${policy.autoArchive ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center space-x-2">
                    <Archive className={`w-4 h-4 ${policy.autoArchive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium">Tự động lưu trữ</span>
                  </div>
                  {policy.autoArchive && (
                    <CheckCircle className="w-3 h-3 text-blue-600 mt-1" />
                  )}
                </div>

                <div className={`p-3 rounded-lg border ${policy.autoDelete ? 'bg-red-50 border-red-200 dark:bg-red-900/20' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center space-x-2">
                    <Trash2 className={`w-4 h-4 ${policy.autoDelete ? 'text-red-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium">Tự động xóa</span>
                  </div>
                  {policy.autoDelete && (
                    <CheckCircle className="w-3 h-3 text-red-600 mt-1" />
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Lý do tuân thủ:</h4>
                <div className="flex flex-wrap gap-2">
                  {policy.complianceReasons.map((reason, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
