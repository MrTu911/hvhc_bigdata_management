'use client';

import { useLanguage } from '@/components/providers/language-provider';
import { 
  Brain, TrendingUp, AlertTriangle, Lightbulb, MessageSquare,
  BarChart3, Target, Sparkles, ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AICapabilitiesSection() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);

  const translations = {
    vi: {
      badge: 'Trí tuệ nhân tạo',
      title: 'TÍCH HỢP AI/ML TIÊN TIẾN',
      subtitle: '4 Engine AI phục vụ phân tích, dự báo và hỗ trợ ra quyết định',
      cta: 'Khám phá AI Dashboard',
      engines: [
        {
          icon: AlertTriangle,
          title: 'Risk Prediction',
          subtitle: 'Dự báo rủi ro học tập',
          description: 'Phân tích GPA, điểm danh, tỷ lệ trượt môn để dự báo học viên có nguy cơ yếu. Đề xuất can thiệp tự động.',
          features: ['5-tier risk scoring', 'Auto intervention', 'Pattern analysis'],
          color: 'from-red-500 to-orange-600',
          demo: {
            input: 'GPA: 4.2, Attendance: 72%, Failed: 2',
            output: 'Risk Level: HIGH (78%)',
            suggestion: '→ Gợi ý: Tăng giám sát, hỗ trợ học thuật'
          }
        },
        {
          icon: TrendingUp,
          title: 'Trend Analysis',
          subtitle: 'Phân tích xu hướng',
          description: 'Linear regression dự báo GPA 6 tháng tới với confidence intervals. Phát hiện seasonality.',
          features: ['6-month forecast', 'Confidence scoring', 'Seasonality detection'],
          color: 'from-blue-500 to-indigo-600',
          demo: {
            input: 'Lịch sử GPA: 6.5 → 6.8 → 7.2',
            output: 'Predicted GPA: 7.6 (±0.3)',
            suggestion: '→ Trend: Tăng đều, đạt mục tiêu'
          }
        },
        {
          icon: Lightbulb,
          title: 'Recommendations',
          subtitle: 'Gợi ý học tập',
          description: 'Đề xuất cá nhân hóa dựa trên pattern matching và historical data. Prioritized by confidence.',
          features: ['Personalized tips', 'Career guidance', 'Resource suggestions'],
          color: 'from-emerald-500 to-teal-600',
          demo: {
            input: 'Profile: GV năm 2, chuyên ngành CNTT',
            output: '3 gợi ý với confidence 85%+',
            suggestion: '→ Nên tham gia NCKH về AI'
          }
        },
        {
          icon: MessageSquare,
          title: 'Sentiment Analysis',
          subtitle: 'Phân tích cảm xúc',
          description: 'Batch analysis phản hồi, báo cáo. Keyword extraction và summarization tự động.',
          features: ['Multi-document', 'Keyword extraction', 'Auto summarization'],
          color: 'from-purple-500 to-violet-600',
          demo: {
            input: '50 feedback từ sinh viên',
            output: 'Positive: 78%, Neutral: 15%',
            suggestion: '→ Keyword: "helpful", "clear"'
          }
        },
      ]
    },
    en: {
      badge: 'Artificial Intelligence',
      title: 'ADVANCED AI/ML INTEGRATION',
      subtitle: '4 AI Engines for analysis, forecasting and decision support',
      cta: 'Explore AI Dashboard',
      engines: [
        {
          icon: AlertTriangle,
          title: 'Risk Prediction',
          subtitle: 'Learning risk forecast',
          description: 'Analyze GPA, attendance, failure rate to predict at-risk students. Auto intervention suggestions.',
          features: ['5-tier risk scoring', 'Auto intervention', 'Pattern analysis'],
          color: 'from-red-500 to-orange-600',
          demo: {
            input: 'GPA: 4.2, Attendance: 72%, Failed: 2',
            output: 'Risk Level: HIGH (78%)',
            suggestion: '→ Suggestion: Increase monitoring'
          }
        },
        {
          icon: TrendingUp,
          title: 'Trend Analysis',
          subtitle: 'Trend forecasting',
          description: 'Linear regression predicts 6-month GPA with confidence intervals. Seasonality detection.',
          features: ['6-month forecast', 'Confidence scoring', 'Seasonality detection'],
          color: 'from-blue-500 to-indigo-600',
          demo: {
            input: 'GPA History: 6.5 → 6.8 → 7.2',
            output: 'Predicted GPA: 7.6 (±0.3)',
            suggestion: '→ Trend: Steady increase'
          }
        },
        {
          icon: Lightbulb,
          title: 'Recommendations',
          subtitle: 'Learning suggestions',
          description: 'Personalized suggestions based on pattern matching and historical data. Prioritized by confidence.',
          features: ['Personalized tips', 'Career guidance', 'Resource suggestions'],
          color: 'from-emerald-500 to-teal-600',
          demo: {
            input: 'Profile: Year 2 IT Faculty',
            output: '3 suggestions with 85%+ confidence',
            suggestion: '→ Should join AI research'
          }
        },
        {
          icon: MessageSquare,
          title: 'Sentiment Analysis',
          subtitle: 'Feedback analysis',
          description: 'Batch analysis of feedback, reports. Auto keyword extraction and summarization.',
          features: ['Multi-document', 'Keyword extraction', 'Auto summarization'],
          color: 'from-purple-500 to-violet-600',
          demo: {
            input: '50 student feedbacks',
            output: 'Positive: 78%, Neutral: 15%',
            suggestion: '→ Keywords: "helpful", "clear"'
          }
        },
      ]
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;
  const activeEngine = tr.engines[activeTab];

  return (
    <section id="ai" className="py-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full px-4 py-2 mb-4">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">{tr.badge}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {tr.title}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {tr.subtitle}
          </p>
        </div>

        {/* AI Engines Showcase */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Tabs */}
          <div className="space-y-4">
            {tr.engines.map((engine, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${
                  activeTab === index 
                    ? 'bg-white dark:bg-slate-800 shadow-lg border-2 border-purple-500/50' 
                    : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${engine.color} flex items-center justify-center flex-shrink-0`}>
                    <engine.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                      {engine.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {engine.subtitle}
                    </p>
                    {activeTab === index && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {engine.features.map((feature, i) => (
                          <span key={i} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {activeTab === index && (
                    <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Right: Demo Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${activeEngine.color} p-6`}>
              <div className="flex items-center gap-3">
                <activeEngine.icon className="w-8 h-8 text-white" />
                <div>
                  <h3 className="text-xl font-bold text-white">{activeEngine.title}</h3>
                  <p className="text-white/80 text-sm">{activeEngine.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <p className="text-slate-600 dark:text-slate-300">
                {activeEngine.description}
              </p>

              {/* Demo simulation */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-3 font-mono text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">INPUT:</span>
                  <span className="text-slate-700 dark:text-slate-300">{activeEngine.demo.input}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500">OUTPUT:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{activeEngine.demo.output}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500">AI:</span>
                  <span className="text-slate-700 dark:text-slate-300">{activeEngine.demo.suggestion}</span>
                </div>
              </div>

              {/* CTA */}
              <Link href="/dashboard/ai">
                <Button className={`w-full bg-gradient-to-r ${activeEngine.color} hover:opacity-90 text-white`}>
                  {tr.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
