/**
 * Seed — ML Models / Training Jobs / Predictions (M12 Big Data — lớp AI/ML)
 *
 * Phủ CSDL còn thiếu: MLModel + TrainingJob + ModelPrediction (trước đây chỉ có
 * MLModel rải rác trong seed_missing_data.ts đã deprecate; TrainingJob/ModelPrediction = 0).
 *
 * Idempotent:
 *   - MLModel upsert theo id cố định
 *   - TrainingJob / ModelPrediction: deleteMany theo modelId rồi tạo lại (không nhân đôi)
 *
 * Tiền đề: có User admin (role QUAN_TRI_HE_THONG) làm owner.
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_ml_models.ts
 */

import { PrismaClient, ModelType, ModelFramework, ModelStatus, ClassificationLevel, JobStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface ModelSpec {
  id: string;
  name: string;
  description: string;
  modelType: ModelType;
  framework: ModelFramework;
  status: ModelStatus;
  classification: ClassificationLevel;
  researchArea: string;
  accuracy?: number;
  f1Score?: number;
  loss?: number;
  deploymentUrl?: string;
  predictionCount: number;
  tags: string[];
  // TrainingJob đi kèm
  job: {
    jobName: string;
    status: JobStatus;
    progress: number;
    totalEpochs: number;
    currentEpoch: number;
    gpuAllocated: number;
    durationSec?: number;
  };
  // ModelPrediction mẫu
  predictions: { input: object; output: object; inferenceTime: number; isCorrect?: boolean }[];
}

const MODELS: ModelSpec[] = [
  {
    id: 'ml-doc-classifier-001',
    name: 'Phân loại văn bản hành chính (NĐ30)',
    description: 'Phân loại tự động loại văn bản hành chính đầu vào theo Nghị định 30/2020.',
    modelType: ModelType.NLP,
    framework: ModelFramework.HUGGINGFACE,
    status: ModelStatus.DEPLOYED,
    classification: ClassificationLevel.INTERNAL,
    researchArea: 'NLP văn bản tiếng Việt',
    accuracy: 0.942,
    f1Score: 0.938,
    loss: 0.187,
    deploymentUrl: 'http://ml.hvhc.local/v1/doc-classifier',
    predictionCount: 2,
    tags: ['nlp', 'phobert', 'van-ban', 'nd30'],
    job: { jobName: 'doc-classifier fine-tune PhoBERT', status: JobStatus.COMPLETED, progress: 100, totalEpochs: 10, currentEpoch: 10, gpuAllocated: 1, durationSec: 4820 },
    predictions: [
      { input: { text: 'V/v báo cáo kết quả công tác quý' }, output: { label: 'BAO_CAO', confidence: 0.96 }, inferenceTime: 42.5, isCorrect: true },
      { input: { text: 'Quyết định khen thưởng cá nhân' }, output: { label: 'QUYET_DINH', confidence: 0.91 }, inferenceTime: 38.1, isCorrect: true },
    ],
  },
  {
    id: 'ml-grade-predictor-002',
    name: 'Dự báo kết quả học tập học viên',
    description: 'Dự báo điểm trung bình học kỳ dựa trên lịch sử học tập và điểm chuyên cần.',
    modelType: ModelType.REGRESSION,
    framework: ModelFramework.XGBOOST,
    status: ModelStatus.TRAINED,
    classification: ClassificationLevel.INTERNAL,
    researchArea: 'Phân tích dữ liệu đào tạo',
    accuracy: 0.871,
    loss: 0.412,
    predictionCount: 1,
    tags: ['regression', 'xgboost', 'dao-tao', 'gpa'],
    job: { jobName: 'grade-predictor train v2', status: JobStatus.COMPLETED, progress: 100, totalEpochs: 200, currentEpoch: 200, gpuAllocated: 0, durationSec: 640 },
    predictions: [
      { input: { gpaPrev: 7.2, attendance: 0.95, credits: 18 }, output: { predictedGpa: 7.45 }, inferenceTime: 5.3, isCorrect: true },
    ],
  },
  {
    id: 'ml-nckh-dupcheck-003',
    name: 'Phát hiện trùng lặp công trình NCKH',
    description: 'Tính độ tương đồng ngữ nghĩa giữa các đề tài/ấn phẩm để cảnh báo trùng lặp.',
    modelType: ModelType.NLP,
    framework: ModelFramework.PYTORCH,
    status: ModelStatus.DEPLOYED,
    classification: ClassificationLevel.CONFIDENTIAL,
    researchArea: 'Semantic similarity',
    accuracy: 0.903,
    f1Score: 0.897,
    deploymentUrl: 'http://ml.hvhc.local/v1/nckh-dupcheck',
    predictionCount: 1,
    tags: ['nlp', 'sentence-transformers', 'nckh', 'duplicate'],
    job: { jobName: 'dupcheck embeddings fine-tune', status: JobStatus.COMPLETED, progress: 100, totalEpochs: 5, currentEpoch: 5, gpuAllocated: 2, durationSec: 7210 },
    predictions: [
      { input: { titleA: 'Ứng dụng AI trong hậu cần', titleB: 'Ứng dụng trí tuệ nhân tạo quản lý hậu cần' }, output: { similarity: 0.88, flag: 'HIGH' }, inferenceTime: 61.2, isCorrect: true },
    ],
  },
  {
    id: 'ml-health-classifier-004',
    name: 'Phân loại sức khỏe quân nhân',
    description: 'Phân loại nhóm sức khỏe (loại 1–4) dựa trên chỉ số khám định kỳ.',
    modelType: ModelType.CLASSIFICATION,
    framework: ModelFramework.SCIKIT_LEARN,
    status: ModelStatus.TRAINING,
    classification: ClassificationLevel.CONFIDENTIAL,
    researchArea: 'Phân tích y tế',
    predictionCount: 0,
    tags: ['classification', 'random-forest', 'y-te'],
    job: { jobName: 'health-classifier train', status: JobStatus.RUNNING, progress: 64, totalEpochs: 100, currentEpoch: 64, gpuAllocated: 1 },
    predictions: [],
  },
  {
    id: 'ml-logistics-forecast-005',
    name: 'Dự báo nhu cầu hậu cần',
    description: 'Dự báo nhu cầu vật tư hậu cần theo chuỗi thời gian phục vụ lập kế hoạch.',
    modelType: ModelType.TIME_SERIES,
    framework: ModelFramework.LIGHTGBM,
    status: ModelStatus.DRAFT,
    classification: ClassificationLevel.INTERNAL,
    researchArea: 'Time-series forecasting',
    predictionCount: 0,
    tags: ['time-series', 'lightgbm', 'hau-can', 'forecast'],
    job: { jobName: 'logistics-forecast baseline', status: JobStatus.QUEUED, progress: 0, totalEpochs: 150, currentEpoch: 0, gpuAllocated: 0 },
    predictions: [],
  },
];

async function findOwnerId(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { role: 'QUAN_TRI_HE_THONG' },
    select: { id: true },
  });
  if (!admin) {
    throw new Error('Không tìm thấy User role QUAN_TRI_HE_THONG để làm owner cho MLModel (chạy step 04 users trước).');
  }
  return admin.id;
}

async function main() {
  console.log('🤖 Seed ML Models / Training Jobs / Predictions (M12)...');
  const ownerId = await findOwnerId();

  let models = 0, jobs = 0, preds = 0;

  for (const m of MODELS) {
    const trainingCompletedAt = m.job.status === JobStatus.COMPLETED ? new Date(Date.now() - 86_400_000) : null;
    await prisma.mLModel.upsert({
      where: { id: m.id },
      update: {
        name: m.name, description: m.description, modelType: m.modelType, framework: m.framework,
        status: m.status, classification: m.classification, researchArea: m.researchArea,
        accuracy: m.accuracy ?? null, f1Score: m.f1Score ?? null, loss: m.loss ?? null,
        deploymentUrl: m.deploymentUrl ?? null, predictionCount: m.predictionCount, tags: m.tags,
        ownerId,
      },
      create: {
        id: m.id, name: m.name, description: m.description, modelType: m.modelType, framework: m.framework,
        status: m.status, classification: m.classification, researchArea: m.researchArea,
        accuracy: m.accuracy ?? null, f1Score: m.f1Score ?? null, loss: m.loss ?? null,
        deploymentUrl: m.deploymentUrl ?? null, predictionCount: m.predictionCount, tags: m.tags,
        trainingCompletedAt,
        ownerId,
      },
    });
    models++;

    // Idempotent: xóa job/prediction cũ của model này rồi tạo lại
    await prisma.trainingJob.deleteMany({ where: { modelId: m.id } });
    await prisma.modelPrediction.deleteMany({ where: { modelId: m.id } });

    const j = m.job;
    await prisma.trainingJob.create({
      data: {
        modelId: m.id,
        jobName: j.jobName,
        status: j.status,
        progress: j.progress,
        currentEpoch: j.currentEpoch,
        totalEpochs: j.totalEpochs,
        gpuAllocated: j.gpuAllocated,
        startedAt: j.status === JobStatus.QUEUED ? null : new Date(Date.now() - 7_200_000),
        completedAt: j.status === JobStatus.COMPLETED ? new Date(Date.now() - 3_600_000) : null,
        duration: j.durationSec ?? null,
      },
    });
    jobs++;

    for (const pr of m.predictions) {
      await prisma.modelPrediction.create({
        data: {
          modelId: m.id,
          userId: ownerId,
          inputData: pr.input,
          outputData: pr.output,
          inferenceTime: pr.inferenceTime,
          isCorrect: pr.isCorrect ?? null,
        },
      });
      preds++;
    }
  }

  console.log(`✅ ML seed: ${models} models, ${jobs} training jobs, ${preds} predictions`);
}

main()
  .catch((e) => { console.error('❌ Seed ML failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
