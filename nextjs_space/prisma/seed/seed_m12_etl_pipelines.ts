/**
 * M12 – Seed: ETL Pipeline Definitions
 *
 * Tạo 2 PipelineDefinition thực tế cho Sprint 3:
 *   1. personnel_etl  — PostgreSQL (FacultyProfile + WorkHistory) → ClickHouse dim_personnel
 *   2. education_etl  — PostgreSQL (HocVien + KetQuaHocTap)     → ClickHouse fact_grade_records
 *
 * Các DAG ID tương ứng cần được deploy trong Airflow:
 *   - hvhc_personnel_etl
 *   - hvhc_education_etl
 *
 * Chạy: npx tsx prisma/seed/seed_m12_etl_pipelines.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ETL_PIPELINES = [
  {
    id:            'pipeline-personnel-etl',
    name:          'Personnel ETL: PG → ClickHouse',
    description:   'Đồng bộ dữ liệu nhân sự (FacultyProfile, WorkHistory, EducationHistory) từ PostgreSQL sang ClickHouse dim_personnel. Chạy incremental mỗi giờ dựa trên updatedAt watermark.',
    pipelineType:  'ETL_PG_TO_CLICKHOUSE' as const,
    sourceDataset: 'faculty_profiles,work_histories,education_histories',
    targetDataset: 'dim_personnel',
    scheduleCron:  '0 * * * *',   // mỗi giờ đúng
    steps: [
      { name: 'extract_personnel',    type: 'EXTRACT', config: { tables: ['faculty_profiles', 'work_histories', 'education_histories'], mode: 'INCREMENTAL', watermarkField: 'updated_at' } },
      { name: 'transform_personnel',  type: 'TRANSFORM', config: { targetSchema: 'dim_personnel', nullHandling: 'FILL_DEFAULT' } },
      { name: 'load_clickhouse',      type: 'LOAD', config: { target: 'clickhouse', dataset: 'dim_personnel', writeMode: 'UPSERT' } },
      { name: 'update_watermark',     type: 'CHECKPOINT', config: { field: 'updated_at' } },
    ],
    parameters: {
      dagId:              'hvhc_personnel_etl',
      batchSize:          1000,
      maxRetries:         3,
      retryDelaySeconds:  60,
      clickhouseDatabase: 'hvhc_warehouse',
    },
    createdById: 'system',
  },
  {
    id:            'pipeline-education-etl',
    name:          'Education ETL: PG → ClickHouse',
    description:   'Đồng bộ kết quả học tập (HocVien, KetQuaHocTap, ClassEnrollment) từ PostgreSQL sang ClickHouse fact_grade_records. Chạy full refresh theo học kỳ hoặc incremental hằng ngày.',
    pipelineType:  'ETL_PG_TO_CLICKHOUSE' as const,
    sourceDataset: 'hoc_viens,ket_qua_hoc_taps,class_enrollments',
    targetDataset: 'fact_grade_records',
    scheduleCron:  '30 2 * * *',  // 2:30 sáng mỗi ngày
    steps: [
      { name: 'extract_grades',       type: 'EXTRACT', config: { tables: ['hoc_viens', 'ket_qua_hoc_taps', 'class_enrollments'], mode: 'INCREMENTAL', watermarkField: 'created_at' } },
      { name: 'validate_scores',      type: 'VALIDATE', config: { rules: ['score_range_0_10', 'required_student_id', 'valid_class_ref'] } },
      { name: 'transform_grades',     type: 'TRANSFORM', config: { targetSchema: 'fact_grade_records', aggregations: ['avg_score_by_class', 'pass_rate_by_subject'] } },
      { name: 'load_clickhouse',      type: 'LOAD', config: { target: 'clickhouse', dataset: 'fact_grade_records', writeMode: 'APPEND' } },
      { name: 'refresh_materialized', type: 'POST_PROCESS', config: { views: ['mv_class_performance', 'mv_student_ranking'] } },
    ],
    parameters: {
      dagId:              'hvhc_education_etl',
      batchSize:          5000,
      maxRetries:         2,
      retryDelaySeconds:  120,
      clickhouseDatabase: 'hvhc_warehouse',
      academicYear:       'current',
    },
    createdById: 'system',
  },
];

async function main() {
  console.log('🚀 Seeding ETL pipeline definitions...');

  for (const p of ETL_PIPELINES) {
    await prisma.pipelineDefinition.upsert({
      where: { id: p.id },
      update: {
        name:          p.name,
        description:   p.description,
        scheduleCron:  p.scheduleCron,
        steps:         p.steps,
        parameters:    p.parameters,
        isActive:      true,
      },
      create: {
        id:            p.id,
        name:          p.name,
        description:   p.description,
        pipelineType:  p.pipelineType,
        sourceDataset: p.sourceDataset,
        targetDataset: p.targetDataset,
        scheduleCron:  p.scheduleCron,
        steps:         p.steps,
        parameters:    p.parameters,
        isActive:      true,
        createdById:   p.createdById,
      },
    });

    const dagId = (p.parameters as { dagId: string }).dagId;
    console.log(`  ✅ ${p.name} (dag=${dagId})`);
  }

  console.log('\n✅ ETL pipeline seed hoàn thành!');
  console.log('\nĐể trigger thủ công, dùng API:');
  console.log('  POST /api/infrastructure/pipelines');
  console.log('  { "action": "trigger", "definitionId": "pipeline-personnel-etl" }');
  console.log('\nAirflow DAG IDs cần deploy:');
  ETL_PIPELINES.forEach(p => {
    console.log(`  - ${(p.parameters as { dagId: string }).dagId}`);
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
