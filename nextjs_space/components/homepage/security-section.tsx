'use client';

import { useLanguage } from '@/components/providers/language-provider';
import { 
  Shield, Lock, Key, Eye, FileText, Users, 
  Database, CheckCircle, AlertCircle, Activity
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SecuritySection() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const translations = {
    vi: {
      badge: 'Bảo mật & Phân quyền',
      title: 'HỆ THỐNG RBAC FUNCTION-BASED',
      subtitle: 'Kiểm soát truy cập chi tiết đến từng chức năng, bảo vệ dữ liệu đa lớp',
      features: [
        {
          icon: Key,
          title: '88+ Function Codes',
          description: 'Mã chức năng chi tiết: VIEW, CREATE, UPDATE, DELETE, APPROVE cho mỗi module.',
          stats: '88 mã'
        },
        {
          icon: Users,
          title: '14+ Positions',
          description: 'Từ System Admin đến Học viên, mỗi vị trí có bộ quyền riêng.',
          stats: '14 vị trí'
        },
        {
          icon: Eye,
          title: 'Data Scoping',
          description: 'ACADEMY scope (toàn học viện) hoặc UNIT scope (chỉ đơn vị mình).',
          stats: '2 phạm vi'
        },
        {
          icon: FileText,
          title: 'Audit Logging',
          description: 'Ghi log mọi thao tác: ai, làm gì, khi nào, từ đâu, kết quả.',
          stats: '100% log'
        },
      ],
      diagram: {
        title: 'RBAC Flow',
        steps: [
          { label: 'User', desc: 'Đăng nhập' },
          { label: 'Position', desc: 'Xác định vị trí' },
          { label: 'Functions', desc: 'Lấy quyền' },
          { label: 'Scope', desc: 'Giới hạn data' },
        ]
      },
      securityLayers: [
        { icon: Lock, title: 'Password Hashing', status: 'active' },
        { icon: Shield, title: 'API Middleware', status: 'active' },
        { icon: Database, title: 'Data Encryption', status: 'active' },
        { icon: Activity, title: 'Rate Limiting', status: 'active' },
      ]
    },
    en: {
      badge: 'Security & Authorization',
      title: 'FUNCTION-BASED RBAC SYSTEM',
      subtitle: 'Fine-grained access control to each function, multi-layer data protection',
      features: [
        {
          icon: Key,
          title: '88+ Function Codes',
          description: 'Detailed function codes: VIEW, CREATE, UPDATE, DELETE, APPROVE per module.',
          stats: '88 codes'
        },
        {
          icon: Users,
          title: '14+ Positions',
          description: 'From System Admin to Student, each position has unique permissions.',
          stats: '14 positions'
        },
        {
          icon: Eye,
          title: 'Data Scoping',
          description: 'ACADEMY scope (whole academy) or UNIT scope (own department only).',
          stats: '2 scopes'
        },
        {
          icon: FileText,
          title: 'Audit Logging',
          description: 'Log every action: who, what, when, where, result.',
          stats: '100% logged'
        },
      ],
      diagram: {
        title: 'RBAC Flow',
        steps: [
          { label: 'User', desc: 'Login' },
          { label: 'Position', desc: 'Identify position' },
          { label: 'Functions', desc: 'Get permissions' },
          { label: 'Scope', desc: 'Limit data' },
        ]
      },
      securityLayers: [
        { icon: Lock, title: 'Password Hashing', status: 'active' },
        { icon: Shield, title: 'API Middleware', status: 'active' },
        { icon: Database, title: 'Data Encryption', status: 'active' },
        { icon: Activity, title: 'Rate Limiting', status: 'active' },
      ]
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  return (
    <section id="security" className="py-20 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full px-4 py-2 mb-4">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">{tr.badge}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {tr.title}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {tr.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Features */}
          <div className="space-y-6">
            {tr.features.map((feature, index) => (
              <div 
                key={index}
                className={`flex items-start gap-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all duration-500 ${
                  mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                      {feature.stats}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Diagram */}
          <div className="space-y-8">
            {/* RBAC Flow Diagram */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
              <h3 className="text-xl font-bold mb-6 text-center">{tr.diagram.title}</h3>
              
              <div className="flex items-center justify-between">
                {tr.diagram.steps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                        {index + 1}
                      </div>
                      <p className="font-semibold text-sm">{step.label}</p>
                      <p className="text-xs text-slate-400">{step.desc}</p>
                    </div>
                    {index < tr.diagram.steps.length - 1 && (
                      <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-rose-600 mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Security Status */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                Security Layers
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {tr.securityLayers.map((layer, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl">
                    <layer.icon className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{layer.title}</span>
                    <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
