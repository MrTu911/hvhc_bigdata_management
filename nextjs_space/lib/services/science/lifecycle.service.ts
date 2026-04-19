import 'server-only'
import prisma from '@/lib/db'
import { NckhProposalStatus, NckhExtensionStatus, NckhReportStatus } from '@prisma/client'
import { notifyProposalEvent } from './proposal-notification.service'

// Trạng thái cho phép reviewer/approver tác động
const REVIEWABLE_STATUSES = ['SUBMITTED', 'REVIEWING'] as const
const APPROVABLE_STATUSES = ['SUBMITTED', 'REVIEWING', 'UNIT_APPROVED', 'DEPT_APPROVED'] as const

// ─── Proposal ────────────────────────────────────────────────────────────────

export async function listProposals(filters: {
  status?: NckhProposalStatus
  unitId?: string
  piId?: string
  year?: number
  page?: number
  pageSize?: number
}) {
  const { status, unitId, piId, year, page = 1, pageSize = 20 } = filters
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (unitId) where.unitId = unitId
  if (piId) where.piId = piId
  if (year) {
    where.createdAt = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    }
  }

  const [items, total] = await Promise.all([
    prisma.nckhProposal.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        pi: { select: { id: true, fullName: true } },
        unit: { select: { id: true, name: true } },
        reviews: { select: { id: true, recommendation: true, score: true } },
      },
    }),
    prisma.nckhProposal.count({ where }),
  ])

  return { items, total, page, pageSize }
}

export async function getProposal(id: string) {
  return prisma.nckhProposal.findUnique({
    where: { id },
    include: {
      pi: { select: { id: true, fullName: true, email: true } },
      unit: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, fullName: true } },
      unitApprovedBy: { select: { id: true, fullName: true } },
      deptApprovedBy: { select: { id: true, fullName: true } },
      reviews: {
        include: {
          reviewer: { select: { id: true, fullName: true } },
        },
      },
      project: { select: { id: true, projectCode: true, status: true } },
    },
  })
}

export async function createProposal(data: {
  title: string
  titleEn?: string
  abstract?: string
  keywords?: string[]
  researchType: string
  category: string
  field: string
  budgetRequested: number
  durationMonths: number
  piId: string
  unitId?: string
  reviewDeadline?: Date
}) {
  return prisma.nckhProposal.create({
    data: {
      title: data.title,
      titleEn: data.titleEn,
      abstract: data.abstract,
      keywords: data.keywords ?? [],
      researchType: data.researchType as never,
      category: data.category as never,
      field: data.field as never,
      budgetRequested: data.budgetRequested,
      durationMonths: data.durationMonths,
      piId: data.piId,
      unitId: data.unitId,
      reviewDeadline: data.reviewDeadline,
    },
    include: {
      pi: { select: { id: true, fullName: true } },
    },
  })
}

export async function updateProposal(
  id: string,
  data: Partial<{
    title: string
    titleEn: string
    abstract: string
    keywords: string[]
    budgetRequested: number
    durationMonths: number
    reviewDeadline: Date
  }>
) {
  return prisma.nckhProposal.update({ where: { id }, data })
}

export async function submitProposal(id: string) {
  const proposal = await prisma.nckhProposal.findUniqueOrThrow({
    where: { id },
    include: { pi: { select: { id: true, email: true, fullName: true } } },
  })
  if (proposal.status !== 'DRAFT' && proposal.status !== 'REVISION_REQUESTED') {
    throw new Error('Chỉ đề xuất ở trạng thái DRAFT hoặc REVISION_REQUESTED mới có thể nộp')
  }
  const updated = await prisma.nckhProposal.update({
    where: { id },
    data: { status: 'SUBMITTED', submittedAt: new Date(), currentLevel: 'UNIT' },
  })

  // Notify: tìm user có quyền duyệt cấp UNIT trong cùng unit
  await notifyProposalEvent('SUBMITTED', updated, proposal.unitId ?? null).catch(() => {})

  return updated
}

// REVISION flow: PI nộp lại sau khi được yêu cầu sửa
export async function resubmitProposal(id: string, piId: string) {
  const proposal = await prisma.nckhProposal.findUniqueOrThrow({ where: { id } })
  if (proposal.status !== 'REVISION_REQUESTED') {
    throw new Error('Chỉ đề xuất ở trạng thái REVISION_REQUESTED mới có thể nộp lại')
  }
  if (proposal.piId !== piId) {
    throw new Error('Chỉ PI của đề xuất mới có thể nộp lại')
  }
  return prisma.nckhProposal.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      revisionCount: { increment: 1 },
      revisedAt: new Date(),
      currentLevel: 'UNIT',
      revisionNote: null, // Xóa note cũ sau khi nộp lại
    },
  })
}

export async function reviewProposal(data: {
  proposalId: string
  reviewerId: string
  score?: number
  comment?: string
  recommendation: 'APPROVE' | 'REJECT' | 'REVISE'
}) {
  const proposal = await prisma.nckhProposal.findUniqueOrThrow({ where: { id: data.proposalId } })
  if (!(REVIEWABLE_STATUSES as readonly string[]).includes(proposal.status)) {
    throw new Error('Đề xuất không ở trạng thái có thể nhận xét')
  }

  // Khi reviewer yêu cầu sửa: chuyển sang REVISION_REQUESTED, lưu note
  if (data.recommendation === 'REVISE') {
    const updated = await prisma.nckhProposal.update({
      where: { id: data.proposalId },
      data: {
        status: 'REVISION_REQUESTED',
        revisionNote: data.comment ?? null,
      },
    })
    await notifyProposalEvent('REVISION_REQUESTED', updated, null).catch(() => {})
    return updated
  }

  const review = await prisma.nckhProposalReview.upsert({
    where: { proposalId_reviewerId: { proposalId: data.proposalId, reviewerId: data.reviewerId } },
    create: {
      proposalId: data.proposalId,
      reviewerId: data.reviewerId,
      score: data.score,
      comment: data.comment,
      recommendation: data.recommendation,
    },
    update: {
      score: data.score,
      comment: data.comment,
      recommendation: data.recommendation,
      reviewedAt: new Date(),
    },
  })

  if (proposal.status === 'SUBMITTED') {
    await prisma.nckhProposal.update({
      where: { id: data.proposalId },
      data: { status: 'REVIEWING' },
    })
  }

  return review
}

// Multi-level approval:
// SUBMITTED/REVIEWING  → (DEPT approver) → UNIT_APPROVED  (currentLevel: UNIT→DEPT)
// UNIT_APPROVED        → (DEPT approver) → DEPT_APPROVED  (currentLevel: DEPT→ACADEMY)
// DEPT_APPROVED        → (ACADEMY approver) → APPROVED → tạo NckhProject + M07 ResearchProject
// Bất kỳ cấp nào cũng có thể REJECT
export async function approveProposal(data: {
  proposalId: string
  approverId: string
  approverLevel: 'DEPT' | 'ACADEMY' // map từ function code của caller
  rejectReason?: string
  action: 'APPROVE' | 'REJECT'
}) {
  const proposal = await prisma.nckhProposal.findUniqueOrThrow({
    where: { id: data.proposalId },
    include: { pi: { select: { id: true, email: true, fullName: true, facultyProfile: true } } },
  })

  if (!(APPROVABLE_STATUSES as readonly string[]).includes(proposal.status)) {
    throw new Error('Đề xuất không ở trạng thái có thể phê duyệt')
  }

  if (data.action === 'REJECT') {
    const updated = await prisma.nckhProposal.update({
      where: { id: data.proposalId },
      data: { status: 'REJECTED', rejectedAt: new Date(), rejectReason: data.rejectReason },
    })
    await notifyProposalEvent('REJECTED', updated, null).catch(() => {})
    return updated
  }

  const now = new Date()
  const currentLevel = proposal.currentLevel ?? 'UNIT'

  // Cấp 1: UNIT (Trưởng Bộ môn, cần DEPT function code)
  if ((currentLevel === 'UNIT') && data.approverLevel === 'DEPT' &&
      (REVIEWABLE_STATUSES as readonly string[]).includes(proposal.status)) {
    const updated = await prisma.nckhProposal.update({
      where: { id: data.proposalId },
      data: {
        status: 'UNIT_APPROVED',
        currentLevel: 'DEPT',
        unitApprovedAt: now,
        unitApprovedById: data.approverId,
      },
    })
    await notifyProposalEvent('UNIT_APPROVED', updated, null).catch(() => {})
    return updated
  }

  // Cấp 2: DEPT (Trưởng Khoa, cần DEPT function code)
  if (currentLevel === 'DEPT' && data.approverLevel === 'DEPT' && proposal.status === 'UNIT_APPROVED') {
    const updated = await prisma.nckhProposal.update({
      where: { id: data.proposalId },
      data: {
        status: 'DEPT_APPROVED',
        currentLevel: 'ACADEMY',
        deptApprovedAt: now,
        deptApprovedById: data.approverId,
      },
    })
    await notifyProposalEvent('DEPT_APPROVED', updated, null).catch(() => {})
    return updated
  }

  // Cấp 3: ACADEMY (Ban Giám hiệu, cần ACADEMY function code) → APPROVED + tạo project
  if (currentLevel === 'ACADEMY' && data.approverLevel === 'ACADEMY' && proposal.status === 'DEPT_APPROVED') {
    const year = now.getFullYear()

    const result = await prisma.$transaction(async (tx) => {
      const seq = await tx.scienceIdSequence.upsert({
        where: { entityType_year: { entityType: 'PROJECT', year } },
        create: { entityType: 'PROJECT', year, lastSeq: 1 },
        update: { lastSeq: { increment: 1 } },
      })
      const projectCode = `HVHC-${year}-PRJ-${String(seq.lastSeq).padStart(3, '0')}`

      const project = await tx.nckhProject.create({
        data: {
          projectCode,
          title: proposal.title,
          researchType: proposal.researchType,
          category: proposal.category,
          field: proposal.field,
          principalInvestigatorId: proposal.piId,
          unitId: proposal.unitId,
          startDate: now,
          status: 'ACTIVE' as never,
        },
      })

      await tx.nckhProposal.update({
        where: { id: data.proposalId },
        data: {
          status: 'APPROVED',
          approvedAt: now,
          approvedById: data.approverId,
          projectId: project.id,
        },
      })

      // P5: Auto-create M07 ResearchProject nếu PI có FacultyProfile
      const facultyProfile = proposal.pi?.facultyProfile
      if (facultyProfile) {
        await tx.researchProject.create({
          data: {
            facultyId: facultyProfile.id,
            projectName: project.title,
            projectCode: project.projectCode,
            level: mapNckhCategoryToLevel(proposal.category as string),
            status: 'Đang thực hiện',
            workflowStatus: 'APPROVED' as never,
            nckhProjectId: project.id,
          },
        })
      }

      return project
    })

    await notifyProposalEvent('APPROVED', await prisma.nckhProposal.findUniqueOrThrow({ where: { id: data.proposalId } }), null).catch(() => {})
    return result
  }

  throw new Error(`Không thể phê duyệt: level hiện tại=${currentLevel}, approverLevel=${data.approverLevel}, status=${proposal.status}`)
}

function mapNckhCategoryToLevel(category: string): string {
  const map: Record<string, string> = {
    CAP_HOC_VIEN: 'HVHC',
    CAP_TONG_CUC: 'BQP',
    CAP_BO_QUOC_PHONG: 'BQP',
    CAP_NHA_NUOC: 'Nhà nước',
    SANG_KIEN_CO_SO: 'HVHC',
  }
  return map[category] ?? 'HVHC'
}

// ─── Progress Reports ─────────────────────────────────────────────────────────

export async function listProgressReports(projectId: string) {
  return prisma.nckhProgressReport.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      submittedBy: { select: { id: true, fullName: true } },
      reviewedBy: { select: { id: true, fullName: true } },
    },
  })
}

export async function getProgressReport(reportId: string) {
  return prisma.nckhProgressReport.findUnique({
    where: { id: reportId },
    include: {
      submittedBy: { select: { id: true, fullName: true } },
      reviewedBy: { select: { id: true, fullName: true } },
      project: { select: { id: true, projectCode: true, title: true } },
    },
  })
}

export async function createProgressReport(data: {
  projectId: string
  reportPeriod: string
  reportType: string
  content?: string
  completionPercent?: number
  issues?: string
  nextSteps?: string
  attachmentUrl?: string
  submittedById: string
}) {
  return prisma.nckhProgressReport.create({
    data: {
      projectId: data.projectId,
      reportPeriod: data.reportPeriod,
      reportType: data.reportType as never,
      content: data.content,
      completionPercent: data.completionPercent ?? 0,
      issues: data.issues,
      nextSteps: data.nextSteps,
      attachmentUrl: data.attachmentUrl,
      submittedById: data.submittedById,
    },
  })
}

export async function updateProgressReport(
  reportId: string,
  data: Partial<{
    content: string
    completionPercent: number
    issues: string
    nextSteps: string
    attachmentUrl: string
    status: NckhReportStatus
    reviewNote: string
    reviewedById: string
    reviewedAt: Date
    submittedAt: Date
  }>
) {
  return prisma.nckhProgressReport.update({ where: { id: reportId }, data })
}

// ─── Midterm Review ───────────────────────────────────────────────────────────

export async function getMidtermReview(projectId: string) {
  return prisma.nckhMidtermReview.findUnique({
    where: { projectId },
    include: {
      council: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  })
}

export async function createMidtermReview(data: {
  projectId: string
  councilId?: string
  reviewDate: Date
  overallScore?: number
  scientificScore?: number
  progressScore?: number
  budgetScore?: number
  recommendation: string
  adjustmentRequired?: boolean
  adjustmentNote?: string
  conclusionText?: string
  approvedById?: string
}) {
  const existing = await prisma.nckhMidtermReview.findUnique({ where: { projectId: data.projectId } })
  if (existing) throw new Error('Đề tài đã có đánh giá giữa kỳ')

  return prisma.nckhMidtermReview.create({
    data: {
      projectId: data.projectId,
      councilId: data.councilId,
      reviewDate: data.reviewDate,
      overallScore: data.overallScore,
      scientificScore: data.scientificScore,
      progressScore: data.progressScore,
      budgetScore: data.budgetScore,
      recommendation: data.recommendation as never,
      adjustmentRequired: data.adjustmentRequired ?? false,
      adjustmentNote: data.adjustmentNote,
      conclusionText: data.conclusionText,
      approvedById: data.approvedById,
    },
  })
}

// ─── Extensions ──────────────────────────────────────────────────────────────

export async function listExtensions(projectId: string) {
  return prisma.nckhExtension.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      requestedBy: { select: { id: true, fullName: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  })
}

export async function createExtension(data: {
  projectId: string
  originalEndDate: Date
  requestedEndDate: Date
  extensionMonths: number
  reason: string
  requestedById: string
}) {
  // Kiểm tra không có yêu cầu PENDING nào đang chờ
  const pending = await prisma.nckhExtension.findFirst({
    where: { projectId: data.projectId, status: 'PENDING' },
  })
  if (pending) throw new Error('Đang có yêu cầu gia hạn chờ phê duyệt')

  return prisma.nckhExtension.create({ data })
}

export async function resolveExtension(data: {
  extensionId: string
  approverId: string
  action: 'APPROVE' | 'REJECT'
  rejectReason?: string
}) {
  const ext = await prisma.nckhExtension.findUniqueOrThrow({ where: { id: data.extensionId } })
  if (ext.status !== 'PENDING') throw new Error('Yêu cầu gia hạn không ở trạng thái chờ')

  const updateData: Record<string, unknown> = {
    status: data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
    approvedById: data.approverId,
    approvedAt: new Date(),
  }
  if (data.action === 'REJECT') updateData.rejectReason = data.rejectReason

  return prisma.$transaction(async (tx) => {
    const updated = await tx.nckhExtension.update({
      where: { id: data.extensionId },
      data: updateData,
    })
    // Nếu approve → cập nhật endDate của project
    if (data.action === 'APPROVE') {
      await tx.nckhProject.update({
        where: { id: ext.projectId },
        data: { endDate: ext.requestedEndDate },
      })
    }
    return updated
  })
}

// ─── Closure ──────────────────────────────────────────────────────────────────

export async function getClosure(projectId: string) {
  return prisma.nckhClosure.findUnique({
    where: { projectId },
    include: {
      closedBy: { select: { id: true, fullName: true } },
    },
  })
}

export async function createClosure(data: {
  projectId: string
  closureType: string
  closureDate: Date
  finalScore?: number
  finalGrade?: string
  archiveLocation?: string
  notes?: string
  closedById: string
}) {
  const existing = await prisma.nckhClosure.findUnique({ where: { projectId: data.projectId } })
  if (existing) throw new Error('Đề tài đã được đóng')

  const projectStatusMap: Record<string, string> = {
    COMPLETED: 'COMPLETED',
    TERMINATED: 'CANCELLED',
    TRANSFERRED: 'COMPLETED',
  }

  return prisma.$transaction(async (tx) => {
    const closure = await tx.nckhClosure.create({ data: data as never })
    await tx.nckhProject.update({
      where: { id: data.projectId },
      data: { status: (projectStatusMap[data.closureType] ?? 'COMPLETED') as never },
    })
    return closure
  })
}

// ─── Lessons Learned ──────────────────────────────────────────────────────────

export async function listLessons(projectId: string) {
  return prisma.nckhLessonLearned.findMany({
    where: { projectId },
    orderBy: [{ impact: 'asc' }, { createdAt: 'desc' }],
    include: {
      addedBy: { select: { id: true, fullName: true } },
    },
  })
}

export async function createLesson(data: {
  projectId: string
  category: string
  title: string
  description: string
  impact: string
  recommendation?: string
  addedById: string
}) {
  return prisma.nckhLessonLearned.create({ data: data as never })
}

// ─── Council Meetings ─────────────────────────────────────────────────────────

export async function listMeetings(councilId: string) {
  return prisma.nckhCouncilMeeting.findMany({
    where: { councilId },
    orderBy: { meetingDate: 'desc' },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      _count: { select: { votes: true } },
    },
  })
}

export async function getMeeting(meetingId: string) {
  return prisma.nckhCouncilMeeting.findUnique({
    where: { id: meetingId },
    include: {
      council: { select: { id: true, name: true } },
      createdBy: { select: { id: true, fullName: true } },
      votes: true,
    },
  })
}

export async function createMeeting(data: {
  councilId: string
  meetingDate: Date
  location?: string
  agenda?: string
  minutesContent?: string
  minutesUrl?: string
  attendanceCount?: number
  createdById: string
}) {
  return prisma.nckhCouncilMeeting.create({ data })
}

export async function updateMeeting(
  meetingId: string,
  data: Partial<{
    meetingDate: Date
    location: string
    agenda: string
    minutesContent: string
    minutesUrl: string
    attendanceCount: number
  }>
) {
  return prisma.nckhCouncilMeeting.update({ where: { id: meetingId }, data })
}

// ─── Meeting Votes ────────────────────────────────────────────────────────────

export async function castVote(data: {
  meetingId: string
  memberId: string
  voteType: string
  vote: string
  score?: number
  comment?: string
}) {
  return prisma.nckhMeetingVote.upsert({
    where: {
      meetingId_memberId_voteType: {
        meetingId: data.meetingId,
        memberId: data.memberId,
        voteType: data.voteType,
      },
    },
    create: {
      meetingId: data.meetingId,
      memberId: data.memberId,
      voteType: data.voteType,
      vote: data.vote as never,
      score: data.score,
      comment: data.comment,
    },
    update: {
      vote: data.vote as never,
      score: data.score,
      comment: data.comment,
      votedAt: new Date(),
    },
  })
}

// ─── Formal Acceptance (NckhAcceptance) ──────────────────────────────────────

export async function getFormalAcceptance(projectId: string) {
  return prisma.nckhAcceptance.findUnique({
    where: { projectId },
    include: {
      council: { select: { id: true, type: true } },
      acceptedBy: { select: { id: true, fullName: true } },
      scores: true,
    },
  })
}

export async function createFormalAcceptance(data: {
  projectId: string
  acceptanceDate: Date
  acceptanceType: string
  result: string
  finalScore?: number
  grade?: string
  conditions?: string
  signedMinutesUrl?: string
  councilId?: string
  acceptedById: string
}) {
  return prisma.nckhAcceptance.create({
    data: {
      projectId:       data.projectId,
      acceptanceDate:  data.acceptanceDate,
      acceptanceType:  data.acceptanceType as never,
      result:          data.result as never,
      finalScore:      data.finalScore,
      grade:           data.grade,
      conditions:      data.conditions,
      signedMinutesUrl: data.signedMinutesUrl,
      councilId:       data.councilId,
      acceptedById:    data.acceptedById,
    },
    include: {
      acceptedBy: { select: { id: true, fullName: true } },
    },
  })
}

export async function getVoteSummary(meetingId: string) {
  const votes = await prisma.nckhMeetingVote.findMany({
    where: { meetingId },
  })

  const summary = votes.reduce(
    (acc, v) => {
      acc.total++
      if (v.vote === 'APPROVE') acc.approve++
      else if (v.vote === 'REJECT') acc.reject++
      else acc.abstain++
      if (v.score != null) {
        acc.scoreSum += v.score
        acc.scoreCount++
      }
      return acc
    },
    { total: 0, approve: 0, reject: 0, abstain: 0, scoreSum: 0, scoreCount: 0 }
  )

  return {
    ...summary,
    averageScore: summary.scoreCount > 0 ? summary.scoreSum / summary.scoreCount : null,
  }
}

export const lifecycleService = {
  // Proposals
  listProposals,
  getProposal,
  createProposal,
  updateProposal,
  submitProposal,
  resubmitProposal,
  reviewProposal,
  approveProposal,
  // Progress Reports
  listProgressReports,
  getProgressReport,
  createProgressReport,
  updateProgressReport,
  // Midterm
  getMidtermReview,
  createMidtermReview,
  // Extensions
  listExtensions,
  createExtension,
  resolveExtension,
  // Closure
  getClosure,
  createClosure,
  // Lessons
  listLessons,
  createLesson,
  // Council Meetings
  listMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  // Votes
  castVote,
  getVoteSummary,
  // Formal Acceptance
  getFormalAcceptance,
  createFormalAcceptance,
}
