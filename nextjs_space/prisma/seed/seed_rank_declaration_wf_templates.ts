/**
 * Seed: Workflow Templates cho Khai báo Quân hàm (M02 Extension)
 *
 * Tạo 2 WorkflowTemplate + version PUBLISHED:
 *  - RANK_DECLARATION_CAN_BO    → Trưởng Ban Cán bộ duyệt (personnel.managingOrgan != BAN_QUAN_LUC)
 *  - RANK_DECLARATION_QUAN_LUC  → Trưởng Ban Quân lực duyệt (personnel.managingOrgan == BAN_QUAN_LUC)
 *
 * Idempotent: chạy nhiều lần an toàn.
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_rank_declaration_wf_templates.ts
 */

import { PrismaClient, WorkflowVersionStatus } from '@prisma/client';
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
  requiresSignature?: boolean;
  configJson?: Record<string, unknown>;
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
  entityType: string;
  steps: StepDef[];
  transitions: TransitionDef[];
}

const byPosition = (positionCode: string) => ({
  approverPolicy: { type: 'BY_POSITION', positionCode, fallbackToInitiator: true },
});

const initiator = () => ({ approverPolicy: { type: 'INITIATOR' } });

const WORKFLOW_DEFINITIONS: WorkflowDef[] = [
  {
    code: 'RANK_DECLARATION_CAN_BO',
    name: 'Khai báo Thăng quân hàm — Ban Cán bộ duyệt',
    moduleKey: 'PROMOTION',
    description: 'Quy trình cán bộ khai báo/khai hộ thăng quân hàm, trưởng Ban Cán bộ phê duyệt',
    entityType: 'RankDeclaration',
    steps: [
      { code: 'START',        name: 'Bắt đầu',                   stepType: 'START',    orderIndex: 0 },
      {
        code: 'DRAFT',
        name: 'Cán bộ hoàn thiện bản khai',
        stepType: 'TASK',
        orderIndex: 1,
        slaHours: 48,
        configJson: initiator(),
      },
      {
        code: 'REVIEW_CAN_BO',
        name: 'Ban Cán bộ xem xét, phê duyệt',
        stepType: 'APPROVAL',
        orderIndex: 2,
        slaHours: 72,
        configJson: byPosition('TRUONG_BAN_CAN_BO'),
      },
      { code: 'END', name: 'Bản khai được chấp thuận', stepType: 'END', orderIndex: 3 },
    ],
    transitions: [
      { fromStepCode: 'START',        actionCode: 'SUBMIT',  toStepCode: 'DRAFT',        priority: 1 },
      { fromStepCode: 'DRAFT',        actionCode: 'SUBMIT',  toStepCode: 'REVIEW_CAN_BO', priority: 1 },
      { fromStepCode: 'REVIEW_CAN_BO', actionCode: 'APPROVE', toStepCode: 'END',           priority: 1 },
      { fromStepCode: 'REVIEW_CAN_BO', actionCode: 'RETURN',  toStepCode: 'DRAFT',         priority: 2 },
      { fromStepCode: 'REVIEW_CAN_BO', actionCode: 'REJECT',  toStepCode: 'END',           priority: 3 },
    ],
  },

  {
    code: 'RANK_DECLARATION_QUAN_LUC',
    name: 'Khai báo Thăng quân hàm — Ban Quân lực duyệt',
    moduleKey: 'PROMOTION',
    description: 'Quy trình khai báo thăng quân hàm cho quân nhân do Ban Quân lực phụ trách',
    entityType: 'RankDeclaration',
    steps: [
      { code: 'START',        name: 'Bắt đầu',                     stepType: 'START',    orderIndex: 0 },
      {
        code: 'DRAFT',
        name: 'Cán bộ hoàn thiện bản khai',
        stepType: 'TASK',
        orderIndex: 1,
        slaHours: 48,
        configJson: initiator(),
      },
      {
        code: 'REVIEW_QUAN_LUC',
        name: 'Ban Quân lực xem xét, phê duyệt',
        stepType: 'APPROVAL',
        orderIndex: 2,
        slaHours: 72,
        configJson: byPosition('TRUONG_BAN_QUAN_LUC'),
      },
      { code: 'END', name: 'Bản khai được chấp thuận', stepType: 'END', orderIndex: 3 },
    ],
    transitions: [
      { fromStepCode: 'START',           actionCode: 'SUBMIT',  toStepCode: 'DRAFT',           priority: 1 },
      { fromStepCode: 'DRAFT',           actionCode: 'SUBMIT',  toStepCode: 'REVIEW_QUAN_LUC',  priority: 1 },
      { fromStepCode: 'REVIEW_QUAN_LUC', actionCode: 'APPROVE', toStepCode: 'END',              priority: 1 },
      { fromStepCode: 'REVIEW_QUAN_LUC', actionCode: 'RETURN',  toStepCode: 'DRAFT',            priority: 2 },
      { fromStepCode: 'REVIEW_QUAN_LUC', actionCode: 'REJECT',  toStepCode: 'END',              priority: 3 },
    ],
  },
];

async function seedWorkflow(def: WorkflowDef) {
  console.log(`\n  📋 Seeding: ${def.code} — ${def.name}`);

  const template = await prisma.workflowTemplate.upsert({
    where: { code: def.code },
    update: {
      name: def.name,
      moduleKey: def.moduleKey,
      description: def.description,
      isActive: true,
    },
    create: {
      code: def.code,
      name: def.name,
      moduleKey: def.moduleKey,
      description: def.description,
      isActive: true,
      createdBy: SEED_USER,
    },
  });

  const existingPublished = await prisma.workflowTemplateVersion.findFirst({
    where: { templateId: template.id, status: WorkflowVersionStatus.PUBLISHED },
  });

  if (existingPublished) {
    console.log(`    ⏩ Đã có version PUBLISHED (v${existingPublished.versionNo}) — bỏ qua`);
    return;
  }

  const version = await prisma.workflowTemplateVersion.create({
    data: {
      templateId: template.id,
      versionNo: 1,
      status: WorkflowVersionStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.workflowStepTemplate.createMany({
    data: def.steps.map((s) => ({
      templateVersionId: version.id,
      code: s.code,
      name: s.name,
      stepType: s.stepType,
      orderIndex: s.orderIndex,
      slaHours: s.slaHours ?? null,
      requiresSignature: s.requiresSignature ?? false,
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
  console.log('\n🚀 Rank Declaration Workflow Templates Seed');
  console.log('━'.repeat(60));

  for (const def of WORKFLOW_DEFINITIONS) {
    await seedWorkflow(def);
  }

  console.log('\n✅ Hoàn thành seed workflow templates thăng quân hàm.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
