import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const members = await db.partyMember.findMany({ take: 5, where: { deletedAt: null }, select: { id: true, organizationId: true } });
  const seeds = [
    { partyMemberId: members[0].id, organizationId: members[0].organizationId, historyType: 'SUSPENDED' as any, decisionNumber: 'DCI-001/2025', decisionDate: new Date('2025-03-10'), effectiveDate: new Date('2025-03-15'), reason: 'Đình chỉ sinh hoạt Đảng để kiểm tra vi phạm kỷ luật' },
    { partyMemberId: members[1].id, organizationId: members[1].organizationId, historyType: 'SUSPENDED' as any, decisionNumber: 'DCI-002/2025', decisionDate: new Date('2025-06-05'), effectiveDate: new Date('2025-06-10'), reason: 'Đình chỉ sinh hoạt chờ xem xét kỷ luật' },
    { partyMemberId: members[2].id, organizationId: members[2].organizationId, historyType: 'SUSPENDED' as any, decisionNumber: 'DCI-003/2024', decisionDate: new Date('2024-11-20'), effectiveDate: new Date('2024-11-25'), reason: 'Tạm đình chỉ sinh hoạt Đảng theo đề nghị UBKT' },
    { partyMemberId: members[3].id, organizationId: members[3].organizationId, historyType: 'EXPELLED' as any, decisionNumber: 'KT-001/2025', decisionDate: new Date('2025-08-15'), effectiveDate: new Date('2025-08-20'), reason: 'Khai trừ khỏi Đảng do vi phạm nghiêm trọng điều lệ Đảng' },
    { partyMemberId: members[4].id, organizationId: members[4].organizationId, historyType: 'EXPELLED' as any, decisionNumber: 'KT-002/2024', decisionDate: new Date('2024-09-12'), effectiveDate: new Date('2024-09-18'), reason: 'Khai trừ do vi phạm phẩm chất đạo đức nghiêm trọng' },
  ];
  for (const s of seeds) {
    const r = await db.partyMemberHistory.create({ data: s });
    console.log('Created:', s.historyType, s.decisionNumber);
  }
  await db.$disconnect();
}
main();
