/**
 * Seed: Workflow Templates cho Duyệt cập nhật hồ sơ cán bộ (M02 Extension).
 *
 * Tạo 2 WorkflowTemplate + version PUBLISHED (dùng để TRACKING + thông báo M13;
 * ProfileChangeRequestService tự lái trạng thái, M13 instance chỉ để truy vết/notify):
 *  - PROFILE_CHANGE_CAN_BO    → tier-2 Ban Cán bộ (managingOrgan != BAN_QUAN_LUC)
 *  - PROFILE_CHANGE_QUAN_LUC  → tier-2 Ban Quân lực (managingOrgan == BAN_QUAN_LUC)
 *
 * Vòng đời phản ánh 2 cấp: Chỉ huy đơn vị (tier-1) → Ban cán bộ/Quân lực (tier-2).
 *
 * Idempotent: chạy nhiều lần an toàn.
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_profile_change_wf_templates.ts
 */

import { PrismaClient, Prisma, WorkflowVersionStatus } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SEED_USER = 'system-seed';

interface StepDef {
  code: string;
  name: string;
  stepType: 'START' | 'TASK' | 'APPROVAL' | 'SIGNATURE' | 'END';
  orderIndex: number;
  slaHours?: number;
  configJson?: Prisma.InputJsonValue;
}

interface TransitionDef {
  fromStepCode: string;
  actionCode: string;
  toStepCode: string;
  priority?: number;
}

interface WorkflowDef {
  code: string;
  name: string;
  moduleKey: string;
  description: string;
  steps: StepDef[];
  transitions: TransitionDef[];
}

const byPosition = (positionCode: string) => ({
  approverPolicy: { type: 'BY_POSITION', positionCode, fallbackToInitiator: false },
});
const byUnitCommander = () => ({ approverPolicy: { type: 'UNIT_COMMANDER', fallbackToTier2: true } });
const initiator = () => ({ approverPolicy: { type: 'INITIATOR' } });

/** Tier-1 dùng chung cho cả 2 template; chỉ khác bước tier-2. */
function buildSteps(tier2Code: string, tier2Name: string, tier2Position: string): StepDef[] {
  return [
    { code: 'START', name: 'Bắt đầu', stepType: 'START', orderIndex: 0 },
    { code: 'DRAFT', name: 'Cán bộ hoàn thiện đề nghị', stepType: 'TASK', orderIndex: 1, slaHours: 48, configJson: initiator() },
    { code: 'REVIEW_UNIT', name: 'Chỉ huy đơn vị duyệt (cấp 1)', stepType: 'APPROVAL', orderIndex: 2, slaHours: 72, configJson: byUnitCommander() },
    { code: tier2Code, name: tier2Name, stepType: 'APPROVAL', orderIndex: 3, slaHours: 72, configJson: byPosition(tier2Position) },
    { code: 'END', name: 'Đề nghị được duyệt & cập nhật CSDL', stepType: 'END', orderIndex: 4 },
  ];
}

function buildTransitions(tier2Code: string): TransitionDef[] {
  return [
    { fromStepCode: 'START', actionCode: 'SUBMIT', toStepCode: 'DRAFT', priority: 1 },
    { fromStepCode: 'DRAFT', actionCode: 'SUBMIT', toStepCode: 'REVIEW_UNIT', priority: 1 },
    { fromStepCode: 'REVIEW_UNIT', actionCode: 'APPROVE', toStepCode: tier2Code, priority: 1 },
    { fromStepCode: 'REVIEW_UNIT', actionCode: 'RETURN', toStepCode: 'DRAFT', priority: 2 },
    { fromStepCode: 'REVIEW_UNIT', actionCode: 'REJECT', toStepCode: 'END', priority: 3 },
    { fromStepCode: tier2Code, actionCode: 'APPROVE', toStepCode: 'END', priority: 1 },
    { fromStepCode: tier2Code, actionCode: 'RETURN', toStepCode: 'DRAFT', priority: 2 },
    { fromStepCode: tier2Code, actionCode: 'REJECT', toStepCode: 'END', priority: 3 },
  ];
}

const WORKFLOW_DEFINITIONS: WorkflowDef[] = [
  {
    code: 'PROFILE_CHANGE_CAN_BO',
    name: 'Duyệt cập nhật hồ sơ — Ban Cán bộ duyệt cấp 2',
    moduleKey: 'M02',
    description: 'Cán bộ đề nghị cập nhật hồ sơ → Chỉ huy đơn vị duyệt → Ban Cán bộ duyệt & commit CSDL',
    steps: buildSteps('REVIEW_CAN_BO', 'Ban Cán bộ duyệt & cập nhật CSDL (cấp 2)', 'TRUONG_BAN_CAN_BO'),
    transitions: buildTransitions('REVIEW_CAN_BO'),
  },
  {
    code: 'PROFILE_CHANGE_QUAN_LUC',
    name: 'Duyệt cập nhật hồ sơ — Ban Quân lực duyệt cấp 2',
    moduleKey: 'M02',
    description: 'Cán bộ đề nghị cập nhật hồ sơ → Chỉ huy đơn vị duyệt → Ban Quân lực duyệt & commit CSDL',
    steps: buildSteps('REVIEW_QUAN_LUC', 'Ban Quân lực duyệt & cập nhật CSDL (cấp 2)', 'TRUONG_BAN_QUAN_LUC'),
    transitions: buildTransitions('REVIEW_QUAN_LUC'),
  },
];

async function seedWorkflow(def: WorkflowDef) {
  console.log(`\n  📋 Seeding: ${def.code} — ${def.name}`);

  const template = await prisma.workflowTemplate.upsert({
    where: { code: def.code },
    update: { name: def.name, moduleKey: def.moduleKey, description: def.description, isActive: true },
    create: { code: def.code, name: def.name, moduleKey: def.moduleKey, description: def.description, isActive: true, createdBy: SEED_USER },
  });

  const existingPublished = await prisma.workflowTemplateVersion.findFirst({
    where: { templateId: template.id, status: WorkflowVersionStatus.PUBLISHED },
  });
  if (existingPublished) {
    console.log(`    ⏩ Đã có version PUBLISHED (v${existingPublished.versionNo}) — bỏ qua`);
    return;
  }

  const version = await prisma.workflowTemplateVersion.create({
    data: { templateId: template.id, versionNo: 1, status: WorkflowVersionStatus.PUBLISHED, publishedAt: new Date() },
  });

  await prisma.workflowStepTemplate.createMany({
    data: def.steps.map((s) => ({
      templateVersionId: version.id,
      code: s.code,
      name: s.name,
      stepType: s.stepType,
      orderIndex: s.orderIndex,
      slaHours: s.slaHours ?? null,
      requiresSignature: false,
      isParallel: false,
      configJson: s.configJson ?? undefined,
    })),
  });

  await prisma.workflowTransitionTemplate.createMany({
    data: def.transitions.map((t) => ({
      templateVersionId: version.id,
      fromStepCode: t.fromStepCode,
      actionCode: t.actionCode,
      toStepCode: t.toStepCode,
      priority: t.priority ?? 1,
      conditionExpression: null,
    })),
  });

  console.log(`    ✅ Tạo ${def.steps.length} bước, ${def.transitions.length} transitions → PUBLISHED`);
}

async function main() {
  console.log('\n🚀 Profile Change Workflow Templates Seed');
  console.log('━'.repeat(60));
  for (const def of WORKFLOW_DEFINITIONS) await seedWorkflow(def);
  console.log('\n✅ Hoàn thành seed workflow templates duyệt cập nhật hồ sơ.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
