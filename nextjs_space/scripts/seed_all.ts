// scripts/seed_all.ts
// Orchestrator to run all seeds in correct order
import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

type Step = {
  name: string;
  file: string;
  enabled?: boolean;
};

const projectRoot = path.resolve(__dirname, "..");

function isWindows() {
  return process.platform === "win32";
}

function assertFileExists(relPath: string) {
  const p = path.join(projectRoot, relPath);
  if (!fs.existsSync(p)) {
    console.warn(`⚠️  Missing seed file: ${relPath} - SKIPPING`);
    return false;
  }
  return true;
}

function runStep(step: Step): boolean {
  if (step.enabled === false) {
    console.log(`⏭️  SKIP: ${step.name}`);
    return true;
  }

  if (!assertFileExists(step.file)) {
    return true; // Skip missing files gracefully
  }

  const npxBin = isWindows() ? "npx.cmd" : "npx";
  const args = ["tsx", "--require", "dotenv/config", step.file];

  console.log(`\n====================================================`);
  console.log(`🚀 RUN: ${step.name}`);
  console.log(`   CMD: ${npxBin} ${args.join(" ")}`);
  console.log(`====================================================\n`);

  const r = spawnSync(npxBin, args, {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV ?? "development",
    },
  });

  if (r.error) {
    console.error(`❌ Error running ${step.name}:`, r.error);
    return false;
  }
  if (r.status !== 0) {
    console.error(`❌ Seed step failed (${step.name}) with exit code ${r.status}`);
    return false;
  }

  console.log(`✅ DONE: ${step.name}`);
  return true;
}

function parseBoolEnv(key: string, defaultValue: boolean) {
  const v = (process.env[key] ?? "").trim().toLowerCase();
  if (!v) return defaultValue;
  return ["1", "true", "yes", "y", "on"].includes(v);
}

async function main() {
  console.log("🌱 SEED_ALL – HVHC BigData Management (v8.9)");
  console.log(`📁 Project root: ${projectRoot}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  // Toggles
  const WITH_DEMO = parseBoolEnv("WITH_DEMO", true);
  const WITH_SYNC = parseBoolEnv("WITH_SYNC", false);
  const WITH_BACKFILL = parseBoolEnv("WITH_BACKFILL", false);

  // ✅ Thứ tự seed "an toàn – đúng lề"
  const steps: Step[] = [
    // 1. Base infrastructure
    { name: "1. Seed Units (Đơn vị)", file: "prisma/seed/seed_units.ts" },
    { name: "2. Seed Users (Người dùng)", file: "prisma/seed/seed_users.ts" },

    // 2. RBAC
    { name: "3. Seed RBAC (Functions/Roles)", file: "prisma/seed/seed_rbac.ts" },
    { name: "4. Seed Positions ↔ RBAC Grants", file: "prisma/seed/seed_positions_rbac.ts" },

    // 3. Commanders
    { name: "5. Assign Commanders", file: "prisma/seed/assign_commanders.ts" },

    // 4. Master data
    { name: "6. Seed Master Data (Ethnicity/Religion/Specialization)", file: "prisma/seed/seed_master_data.ts" },
    { name: "7. Seed Administrative Units (Province/District/Ward)", file: "prisma/seed/seed_administrative_units.ts" },
    { name: "7b. Seed Party/Insurance Permissions", file: "prisma/seed/seed_party_insurance_perms.ts" },

    // 5. Policy/Insurance
    { name: "8. Seed Policy Categories + Insurance Setup", file: "prisma/seed/seed_policy_insurance.ts" },
    { name: "9. Seed Insurance (Base)", file: "prisma/seed/seed_insurance.ts" },
    { name: "10. Seed Insurance (Data)", file: "prisma/seed/seed_insurance_data.ts" },

    // 6. Education
    { name: "11. Seed Education", file: "prisma/seed/seed_education.ts" },

    // 7. Optional: Sync data
    { name: "12. Seed Sync Data", file: "prisma/seed/seed_sync_data.ts", enabled: WITH_SYNC },

    // 8. Demo data
    { name: "13. Seed Demo Data v8", file: "prisma/seed/seed_demo_data_v8.ts", enabled: WITH_DEMO },

    // 9. Backfill FK references
    { name: "14. Backfill FK References", file: "prisma/seed/backfill_fk_references.ts", enabled: WITH_BACKFILL },
  ];

  // Basic sanity checks
  const envPath = path.join(projectRoot, ".env");
  if (!fs.existsSync(envPath)) {
    console.warn("⚠️  .env not found. Ensure DATABASE_URL is set.");
  }

  let successCount = 0;
  let failCount = 0;

  for (const s of steps) {
    const success = runStep(s);
    if (success) {
      successCount++;
    } else {
      failCount++;
      // Continue with other seeds even if one fails
      console.log(`⚠️  Continuing despite failure in ${s.name}...`);
    }
  }

  console.log(`\n====================================================`);
  if (failCount === 0) {
    console.log("🎉 SEED_ALL COMPLETED SUCCESSFULLY!");
  } else {
    console.log(`⚠️  SEED_ALL COMPLETED WITH ${failCount} FAILURES`);
  }
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   ⏰ Finished at: ${new Date().toISOString()}`);
  console.log(`====================================================`);
  console.log("\n👉 Tip: WITH_DEMO=false npm run seed:all (skip demo data)");
  console.log("👉 Tip: WITH_BACKFILL=true npm run seed:all (run FK backfill)");
}

main().catch((err) => {
  console.error("\n❌ SEED_ALL FAILED:", err);
  process.exit(1);
});
