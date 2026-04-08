/**
 * Backfill Script Template
 * 
 * SAFE MIGRATION: Expand → Backfill → Contract
 * 
 * Usage:
 * 1. Copy this template for new backfill tasks
 * 2. Implement the processRecord function
 * 3. Run: npx tsx scripts/backfill/<script-name>.ts
 * 
 * Features:
 * - Resumable: Tracks progress in a JSON file
 * - Batched: Processes records in configurable batches
 * - Error handling: Logs errors but continues processing
 * - Progress reporting: Shows progress every batch
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  BATCH_SIZE: 100,
  PROGRESS_FILE: path.join(__dirname, '.backfill-progress.json'),
  MODEL_NAME: 'User', // Change this
  TASK_NAME: 'example-backfill', // Change this
};

interface Progress {
  taskName: string;
  lastProcessedId: string | null;
  totalProcessed: number;
  totalErrors: number;
  errors: Array<{ id: string; error: string; timestamp: string }>;
  startedAt: string;
  lastUpdatedAt: string;
}

async function loadProgress(): Promise<Progress> {
  try {
    const data = await fs.readFile(CONFIG.PROGRESS_FILE, 'utf-8');
    const progress = JSON.parse(data);
    if (progress.taskName !== CONFIG.TASK_NAME) {
      // Different task, start fresh
      throw new Error('Different task');
    }
    return progress;
  } catch {
    return {
      taskName: CONFIG.TASK_NAME,
      lastProcessedId: null,
      totalProcessed: 0,
      totalErrors: 0,
      errors: [],
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}

async function saveProgress(progress: Progress): Promise<void> {
  progress.lastUpdatedAt = new Date().toISOString();
  await fs.writeFile(
    CONFIG.PROGRESS_FILE,
    JSON.stringify(progress, null, 2)
  );
}

/**
 * Process a single record
 * IMPLEMENT THIS FUNCTION FOR YOUR SPECIFIC BACKFILL TASK
 */
async function processRecord(record: any): Promise<void> {
  // Example: Encrypt a field
  // await prisma.user.update({
  //   where: { id: record.id },
  //   data: {
  //     phoneNumber: encrypt(record.phoneNumber),
  //   },
  // });
  
  // TODO: Implement your backfill logic here
  console.log(`Processing record: ${record.id}`);
}

/**
 * Main backfill function
 */
async function main(): Promise<void> {
  console.log(`\n=== Starting Backfill: ${CONFIG.TASK_NAME} ===`);
  console.log(`Batch size: ${CONFIG.BATCH_SIZE}`);
  
  let progress = await loadProgress();
  console.log(`Resuming from: ${progress.lastProcessedId || 'beginning'}`);
  console.log(`Already processed: ${progress.totalProcessed}`);
  
  let processedThisRun = 0;
  let errorsThisRun = 0;
  
  while (true) {
    // Fetch batch of records
    const records = await (prisma as any)[CONFIG.MODEL_NAME.toLowerCase()].findMany({
      where: progress.lastProcessedId
        ? { id: { gt: progress.lastProcessedId } }
        : {},
      orderBy: { id: 'asc' },
      take: CONFIG.BATCH_SIZE,
    });
    
    if (records.length === 0) {
      console.log('\nNo more records to process.');
      break;
    }
    
    // Process each record
    for (const record of records) {
      try {
        await processRecord(record);
        progress.totalProcessed++;
        processedThisRun++;
      } catch (error) {
        progress.totalErrors++;
        errorsThisRun++;
        progress.errors.push({
          id: record.id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
        
        // Keep only last 100 errors
        if (progress.errors.length > 100) {
          progress.errors = progress.errors.slice(-100);
        }
      }
      
      progress.lastProcessedId = record.id;
    }
    
    // Save progress after each batch
    await saveProgress(progress);
    
    // Progress report
    console.log(
      `Processed: ${progress.totalProcessed} | ` +
      `This run: ${processedThisRun} | ` +
      `Errors: ${progress.totalErrors} (${errorsThisRun} this run) | ` +
      `Last ID: ${progress.lastProcessedId}`
    );
  }
  
  // Final summary
  console.log('\n=== Backfill Complete ===');
  console.log(`Total processed: ${progress.totalProcessed}`);
  console.log(`Total errors: ${progress.totalErrors}`);
  console.log(`This run processed: ${processedThisRun}`);
  console.log(`This run errors: ${errorsThisRun}`);
  
  if (progress.errors.length > 0) {
    console.log('\nRecent errors:');
    progress.errors.slice(-5).forEach(e => {
      console.log(`  - ${e.id}: ${e.error}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
