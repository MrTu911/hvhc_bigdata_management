import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AI Usage Logs...');

  // Get some existing users to associate with the logs
  const users = await prisma.user.findMany({
    take: 10,
    select: { id: true, name: true }
  });

  if (users.length === 0) {
    console.log('❌ No users found. Please run user seeds first.');
    return;
  }

  const aiModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'gemini-pro', 'llama-2-70b'];
  const samplePrompts = [
    'Analyze personnel data trends',
    'Generate faculty performance report',
    'Create training curriculum outline',
    'Summarize research publications',
    'Draft policy recommendation',
    'Calculate student statistics',
    'Generate party member activity report',
    'Create insurance claim analysis',
    'Draft disciplinary action notice',
    'Generate academic performance insights'
  ];

  // Create AI usage logs for the past 30 days
  const logs = [];
  const now = new Date();

  for (let i = 0; i < 200; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomModel = aiModels[Math.floor(Math.random() * aiModels.length)];
    const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];

    // Random date within last 30 days
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);

    // Random token usage based on model
    let inputTokens, outputTokens, estimatedCost;
    switch (randomModel) {
      case 'gpt-4':
        inputTokens = Math.floor(Math.random() * 2000) + 500;
        outputTokens = Math.floor(Math.random() * 1000) + 200;
        estimatedCost = (inputTokens * 0.00003 + outputTokens * 0.00006);
        break;
      case 'gpt-3.5-turbo':
        inputTokens = Math.floor(Math.random() * 1500) + 300;
        outputTokens = Math.floor(Math.random() * 800) + 150;
        estimatedCost = (inputTokens * 0.000002 + outputTokens * 0.000002);
        break;
      case 'claude-3':
        inputTokens = Math.floor(Math.random() * 1800) + 400;
        outputTokens = Math.floor(Math.random() * 900) + 180;
        estimatedCost = (inputTokens * 0.000008 + outputTokens * 0.000024);
        break;
      case 'gemini-pro':
        inputTokens = Math.floor(Math.random() * 1600) + 350;
        outputTokens = Math.floor(Math.random() * 700) + 140;
        estimatedCost = (inputTokens * 0.0000005 + outputTokens * 0.0000015);
        break;
      default:
        inputTokens = Math.floor(Math.random() * 1000) + 200;
        outputTokens = Math.floor(Math.random() * 500) + 100;
        estimatedCost = (inputTokens * 0.000001 + outputTokens * 0.000002);
    }

    const success = Math.random() > 0.05; // 95% success rate

    logs.push({
      userId: randomUser.id,
      promptVersion: `v${Math.floor(Math.random() * 3) + 1}.0`,
      model: randomModel,
      inputTokens,
      outputTokens,
      inputHash: `hash_${Math.random().toString(36).substring(7)}`,
      success,
      errorMessage: success ? null : 'API rate limit exceeded',
      estimatedCost,
      createdAt
    });
  }

  // Insert logs in batches to avoid memory issues
  const batchSize = 50;
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize);
    await prisma.aIUsageLog.createMany({
      data: batch,
      skipDuplicates: true
    });
    console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(logs.length / batchSize)}`);
  }

  console.log(`✅ Successfully seeded ${logs.length} AI usage logs`);
  console.log('📊 Sample data includes:');
  console.log(`   - ${users.length} users`);
  console.log(`   - ${aiModels.length} AI models`);
  console.log(`   - Date range: last 30 days`);
  console.log(`   - Mixed success/error scenarios`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding AI usage logs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });