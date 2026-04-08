/**
 * PII Encryption Backfill Script
 * 
 * Encrypts existing PII fields that were stored in plaintext
 * Uses the new versioned encryption format: enc:v1:<iv>:<authTag>:<cipher>
 * 
 * IMPORTANT: Run in DRY_RUN mode first to verify
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { encrypt, isEncrypted, ENCRYPTED_FIELDS } from '../../lib/encryption';

const prisma = new PrismaClient();

const CONFIG = {
  BATCH_SIZE: 50,
  DRY_RUN: true, // Set to false to apply encryption
  PROGRESS_FILE: path.join(__dirname, '.encrypt-pii-progress.json'),
};

interface Progress {
  model: string;
  lastProcessedId: string | null;
  totalProcessed: number;
  totalEncrypted: number;
  totalSkipped: number;
  totalErrors: number;
}

async function loadProgress(model: string): Promise<Progress> {
  try {
    const data = await fs.readFile(CONFIG.PROGRESS_FILE, 'utf-8');
    const allProgress = JSON.parse(data);
    if (allProgress[model]) {
      return allProgress[model];
    }
  } catch {
    // File doesn't exist or parse error
  }
  
  return {
    model,
    lastProcessedId: null,
    totalProcessed: 0,
    totalEncrypted: 0,
    totalSkipped: 0,
    totalErrors: 0,
  };
}

async function saveProgress(progress: Progress): Promise<void> {
  let allProgress: Record<string, Progress> = {};
  
  try {
    const data = await fs.readFile(CONFIG.PROGRESS_FILE, 'utf-8');
    allProgress = JSON.parse(data);
  } catch {
    // File doesn't exist
  }
  
  allProgress[progress.model] = progress;
  await fs.writeFile(CONFIG.PROGRESS_FILE, JSON.stringify(allProgress, null, 2));
}

async function encryptModelFields(
  modelName: string,
  tableName: string,
  fields: string[]
): Promise<void> {
  console.log(`\n=== Encrypting ${modelName} ===`);
  console.log(`Fields: ${fields.join(', ')}`);
  console.log(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  
  let progress = await loadProgress(modelName);
  console.log(`Resuming from: ${progress.lastProcessedId || 'beginning'}`);
  
  while (true) {
    const records = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM "${tableName}"
      WHERE id > $1 OR $1 IS NULL
      ORDER BY id ASC
      LIMIT $2
    `, progress.lastProcessedId, CONFIG.BATCH_SIZE);
    
    if (records.length === 0) break;
    
    for (const record of records) {
      let fieldsToUpdate: Record<string, string> = {};
      let needsUpdate = false;
      
      for (const field of fields) {
        const value = record[field];
        
        if (!value) {
          // Skip null/empty
          continue;
        }
        
        if (isEncrypted(value)) {
          // Already encrypted, skip
          progress.totalSkipped++;
          continue;
        }
        
        // Needs encryption
        try {
          const encrypted = encrypt(value);
          fieldsToUpdate[field] = encrypted;
          needsUpdate = true;
          progress.totalEncrypted++;
          
          if (CONFIG.DRY_RUN) {
            console.log(`  Would encrypt ${modelName}.${record.id}.${field}`);
          }
        } catch (error) {
          console.error(`  Error encrypting ${modelName}.${record.id}.${field}:`, error);
          progress.totalErrors++;
        }
      }
      
      if (needsUpdate && !CONFIG.DRY_RUN) {
        // Build update query
        const setClause = Object.entries(fieldsToUpdate)
          .map(([k, v], i) => `"${k}" = $${i + 2}`)
          .join(', ');
        
        await prisma.$executeRawUnsafe(
          `UPDATE "${tableName}" SET ${setClause} WHERE id = $1`,
          record.id,
          ...Object.values(fieldsToUpdate)
        );
      }
      
      progress.lastProcessedId = record.id;
      progress.totalProcessed++;
    }
    
    await saveProgress(progress);
    console.log(`  Processed: ${progress.totalProcessed} | Encrypted: ${progress.totalEncrypted} | Skipped: ${progress.totalSkipped}`);
  }
  
  console.log(`\n${modelName} complete:`);
  console.log(`  Total processed: ${progress.totalProcessed}`);
  console.log(`  Total encrypted: ${progress.totalEncrypted}`);
  console.log(`  Total skipped: ${progress.totalSkipped}`);
  console.log(`  Total errors: ${progress.totalErrors}`);
}

async function main(): Promise<void> {
  console.log('=== PII Encryption Backfill ===');
  console.log(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  
  // Check encryption key
  if (!process.env.ENCRYPTION_KEY) {
    console.error('\n❌ ENCRYPTION_KEY not set in environment!');
    console.log('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }
  
  // Process each model
  for (const [modelName, fields] of Object.entries(ENCRYPTED_FIELDS)) {
    if (fields.length === 0) continue;
    
    // Convert model name to table name
    const tableName = modelName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .slice(1) + 's';
    
    await encryptModelFields(modelName, tableName, fields);
  }
  
  console.log('\n=== Encryption Backfill Complete ===');
  
  if (CONFIG.DRY_RUN) {
    console.log('\n💡 Set DRY_RUN = false and run again to apply encryption');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
