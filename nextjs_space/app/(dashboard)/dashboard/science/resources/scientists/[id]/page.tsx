'use client';

/**
 * M21 — Science Resources: Scientist Detail
 * Hồ sơ chi tiết nhà khoa học: thông tin cá nhân, học vị, công tác, khen thưởng, chỉ số KH.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft, GraduationCap, Briefcase, Award,
  BookOpen, FlaskConical, User, ExternalLink,
  RefreshCw, Globe, UserSquare2,
} from 'lucide-react';

const DEGREE_COLORS: Record<string, string> = {
  TSKH: 'bg-purple-100 text-purple-700',
  TS:   'bg-blue-100 text-blue-700',
  ThS:  'bg-teal-100 text-teal-700',
  CN:   'bg-gray-100 text-gray-600',
  KS:   'bg-gray-100 text-gray-600',
  CK1:  'bg-orange-100 text-orange-700',
  CK2:  'bg-amber-100 text-amber-700',
};

const AWARD_LEVEL_LABELS: Record<string, string> = {
  MINISTRY:      'Cấp Bộ',
  ACADEMY:       'Cấp HV',
  DEPARTMENT:    'Cấp Khoa',
  INTERNATIONAL: 'Quốc tế',
};

interface Education {
  id: string;
  degree: string;
  major: string;
  institution: string;
  country: string;
  yearFrom: number;
  yearTo: number;
  thesisTitle?: string;
}

interface Career {
  id: string;
  position: string;
  unitName: string;
  yearFrom: number;
  yearTo?: number;
  isCurrent: boolean;
}

interface ScientistAward {
  id: string;
  awardName: string;
  level: string;
  year: number;
  description?: string;
}

interface ScientistProfile {
  id: string;
  userId: string;
  hIndex?: number;
  i10Index?: number;
  totalCitations?: number;
  totalPublications?: number;
  primaryField?: string;
  secondaryFields?: string[];
  researchKeywords?: string[];
  specialization?: string;
  bio?: string;
  degree?: string;
  academicRank?: string;
  orcidId?: string;
  scopusAuthorId?: string;
  googleScholarId?: string;
  projectLeadCount?: number;
  projectMemberCount?: number;
  sensitivityLevel: string;
  maso?: string;
  user: {
    id: string;
    name: string;
    rank?: string;
    militaryId?: string;
    email?: string;
    phone?: string;
    academicTitle?: string;
    unitRelation?: { id: string; name: string; code: string };
  };
  education: Education[];
  career: Career[];
  scientistAwards: ScientistAward[];
}

export default function ScientistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [profile, setProfile] = useState<ScientistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/science/scientists/${id}`)
      .then(r => r.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error ?? 'Không tìm thấy hồ sơ');
        setProfile(res.data);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSyncOrcid = async () => {
    if (!profile?.orcidId) {
      toast.error('Hồ sơ chưa có ORCID ID');
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch(`/api/science/scientists/${id}/sync-orcid`, { method: 'POST' }).then(r => r.json());
      if (!res.success) throw new Error(res.error ?? 'Lỗi đồng bộ ORCID');
      toast.success('Đã đưa vào hàng chờ đồng bộ ORCID');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!profile) return (
    <div className="py-20 text-center text-gray-400">
      <User className="h-12 w-12 mx-auto mb-3 opacity-40" />
      <p>Không tìm thấy hồ sơ nhà khoa học.</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>Quay lại</Button>
    </div>
  );

  const u = profile.user;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/science/resources/scientists')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Danh sách
        </Button>
        {profile.sensitivityLevel === 'CONFIDENTIAL' && (
          <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 font-medium border border-red-200">Hồ sơ Mật</span>
        )}
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                {profile.degree && (
                  <span className={`text-sm px-2 py-0.5 rounded font-semibold ${DEGREE_COLORS[profile.degree] ?? 'bg-gray-100 text-gray-600'}`}>
                    {profile.degree}
                  </span>
                )}
                {profile.academicRank && (
                  <span className="text-sm text-gray-600">{profile.academicRank}</span>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {u.rank ? `${u.rank} ` : ''}{u.name}
              </h1>
              {u.academicTitle && <p className="text-sm text-gray-600 mt-0.5">{u.academicTitle}</p>}
              {u.unitRelation && <p className="text-sm text-gray-500 mt-0.5">{u.unitRelation.name}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                {u.militaryId && <span>Mã: {u.militaryId}</span>}
                {profile.maso && <span>MSNC: {profile.maso}</span>}
                {u.email && <span>{u.email}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <Link href={`/dashboard/personnel/${profile.userId}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <UserSquare2 className="h-3.5 w-3.5" />
                  Hồ sơ nhân sự
                </Button>
              </Link>
              {profile.orcidId && (
                <Button variant="outline" size="sm" onClick={handleSyncOrcid} disabled={syncing} className="gap-1">
                  {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                  Sync ORCID
                </Button>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t pt-4">{profile.bio}</p>
          )}

          {/* Research fields */}
          {(profile.primaryField || (profile.researchKeywords?.length ?? 0) > 0) && (
            <div className="mt-4 flex items-start gap-2 flex-wrap">
              <FlaskConical className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {profile.primaryField && (
                  <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">
                    {profile.primaryField}
                  </span>
                )}
                {profile.researchKeywords?.map((kw, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{kw}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'H-index', value: profile.hIndex ?? 0, color: 'text-violet-700' },
          { label: 'i10-index', value: profile.i10Index ?? 0, color: 'text-blue-700' },
          { label: 'Trích dẫn', value: profile.totalCitations ?? 0, color: 'text-teal-700' },
          { label: 'Công trình', value: profile.totalPublications ?? 0, color: 'text-amber-700' },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* External IDs */}
      {(profile.orcidId || profile.scopusAuthorId || profile.googleScholarId) && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" /> Hồ sơ học thuật
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex flex-wrap gap-3 text-sm">
              {profile.orcidId && (
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="font-medium text-gray-700">ORCID:</span> {profile.orcidId}
                </span>
              )}
              {profile.scopusAuthorId && (
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="font-medium text-gray-700">Scopus:</span> {profile.scopusAuthorId}
                </span>
              )}
              {profile.googleScholarId && (
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="font-medium text-gray-700">Scholar:</span> {profile.googleScholarId}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-700">{profile.projectLeadCount ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Đề tài chủ nhiệm</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{profile.projectMemberCount ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Đề tài tham gia</p>
          </CardContent>
        </Card>
      </div>

      {/* Education */}
      {profile.education.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Quá trình đào tạo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            {profile.education.map((e) => (
              <div key={e.id} className="flex items-start gap-3">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 flex-shrink-0 ${DEGREE_COLORS[e.degree] ?? 'bg-gray-100 text-gray-600'}`}>
                  {e.degree}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.major}</p>
                  <p className="text-xs text-gray-500">{e.institution} — {e.country}</p>
                  <p className="text-xs text-gray-400">{e.yearFrom}–{e.yearTo}</p>
                  {e.thesisTitle && <p className="text-xs text-gray-400 italic mt-0.5">"{e.thesisTitle}"</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Career */}
      {profile.career.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Quá trình công tác
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            {profile.career.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${c.isCurrent ? 'bg-violet-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.position}</p>
                  <p className="text-xs text-gray-500">{c.unitName}</p>
                  <p className="text-xs text-gray-400">
                    {c.yearFrom}–{c.isCurrent ? 'nay' : c.yearTo ?? '?'}
                    {c.isCurrent && <span className="ml-2 text-violet-500 font-medium">Hiện tại</span>}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Awards */}
      {profile.scientistAwards.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Award className="h-4 w-4" /> Khen thưởng khoa học
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {profile.scientistAwards.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium flex-shrink-0 mt-0.5">
                  {AWARD_LEVEL_LABELS[a.level] ?? a.level}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.awardName}</p>
                  <p className="text-xs text-gray-400">{a.year}</p>
                  {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
