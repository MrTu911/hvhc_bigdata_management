
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { NLPSentimentPanel } from '@/components/dashboard/instructor/nlp-sentiment-panel';
import { InstructorStudentsView } from '@/components/dashboard/instructor/students-view';
import { InstructorPerformanceView } from '@/components/dashboard/instructor/performance-view';

export default function InstructorDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Giảng viên</h1>
          <p className="text-muted-foreground mt-1">Quản lý và theo dõi học viên với AI</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="students" className="gap-2">
            <Users className="w-4 h-4" />
            Học viên
          </TabsTrigger>
          <TabsTrigger value="nlp" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Phân tích AI
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Hiệu suất
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <InstructorStudentsView />
        </TabsContent>

        <TabsContent value="nlp">
          <NLPSentimentPanel />
        </TabsContent>

        <TabsContent value="performance">
          <InstructorPerformanceView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
