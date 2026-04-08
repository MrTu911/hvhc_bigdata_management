import prisma from '@/lib/db';

export async function buildPartyMemberProfile360(memberId: string) {
  const member = await prisma.partyMember.findFirst({
    where: { id: memberId, deletedAt: null },
    include: {
      organization: {
        select: {
          id: true,
          code: true,
          name: true,
          organizationType: true,
          unitId: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          militaryId: true,
          rank: true,
          position: true,
          phone: true,
          dateOfBirth: true,
          unitId: true,
          unitRelation: {
            select: { id: true, code: true, name: true },
          },
          personnelProfile: {
            select: {
              id: true,
              personnelCode: true,
              fullName: true,
              dateOfBirth: true,
              gender: true,
              category: true,
              status: true,
              unitId: true,
            },
          },
        },
      },
    },
  });

  if (!member) return null;

  const personnelId = member.user.personnelProfile?.id ?? null;

  const [
    annualReviews,
    meetingAttendances,
    feePayments,
    awards,
    disciplines,
    transfers,
    inspections,
    officerCareer,
  ] = await Promise.all([
    prisma.partyAnnualReview.findMany({
      where: { partyMemberId: memberId },
      orderBy: { reviewYear: 'desc' },
    }),
    prisma.partyMeetingAttendance.findMany({
      where: { partyMemberId: memberId },
      include: {
        meeting: {
          select: { id: true, title: true, meetingDate: true, meetingType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.partyFeePayment.findMany({
      where: { partyMemberId: memberId },
      orderBy: { paymentMonth: 'desc' },
      take: 60,
    }),
    prisma.partyAward.findMany({
      where: { partyMemberId: memberId },
      orderBy: { decisionDate: 'desc' },
    }),
    prisma.partyDiscipline.findMany({
      where: { partyMemberId: memberId },
      orderBy: { decisionDate: 'desc' },
    }),
    prisma.partyTransfer.findMany({
      where: { partyMemberId: memberId },
      include: {
        fromPartyOrg: { select: { id: true, code: true, name: true } },
        toPartyOrg: { select: { id: true, code: true, name: true } },
      },
      orderBy: { transferDate: 'desc' },
    }),
    prisma.partyInspectionTarget.findMany({
      where: { partyMemberId: memberId },
      orderBy: { openedAt: 'desc' },
    }),
    // Career history từ M02: OfficerCareer gắn với Personnel (không phải User trực tiếp)
    personnelId
      ? prisma.officerCareer.findFirst({
          where: { personnelId },
          select: {
            id: true,
            currentRank: true,
            currentPosition: true,
            commissionedDate: true,
            lastEvaluationDate: true,
            lastEvaluationResult: true,
            commandHistory: true,
            trainingHistory: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    memberId: member.id,
    partyMember: {
      id: member.id,
      userId: member.userId,
      organizationId: member.organizationId,
      partyCardNumber: member.partyCardNumber,
      partyRole: member.partyRole,
      status: member.status,
      joinDate: member.joinDate,
      officialDate: member.officialDate,
      recommender1: member.recommender1,
      recommender2: member.recommender2,
      currentReviewGrade: member.currentReviewGrade,
      currentDebtAmount: member.currentDebtAmount,
      confidentialNote: member.confidentialNote,
      statusChangeDate: member.statusChangeDate,
      statusChangeReason: member.statusChangeReason,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    },
    user: member.user,
    personnel: member.user.personnelProfile,
    organization: member.organization,
    sections: {
      annualReviews,
      meetingAttendances,
      feePayments,
      awards,
      disciplines,
      transfers,
      inspections,
      careerHistory: officerCareer,
    },
  };
}
