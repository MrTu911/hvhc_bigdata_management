import { existsSync, mkdirSync, writeFileSync, appendFileSync } from 'fs'
import path from 'path'
import { spawn } from 'child_process'

type SeedItem = {
  name: string
  file: string
  required?: boolean
}

const ROOT_DIR = process.cwd()
const LOG_DIR = path.join(ROOT_DIR, 'logs')
const SCHEMA_PATH = path.join(ROOT_DIR, 'prisma', 'schema.prisma')

const now = new Date()
const stamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  '_',
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
  String(now.getSeconds()).padStart(2, '0'),
].join('')

if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true })
}

const LOG_FILE = path.join(LOG_DIR, `seed_pipeline_${stamp}.log`)

const SEED_FILES: SeedItem[] = [
  { name: 'Users', file: 'prisma/seed/seed_users.ts', required: true },
  { name: 'Units', file: 'prisma/seed/seed_units.ts', required: true },

  { name: 'Personnel Profiles', file: 'prisma/seed/seed_personnel_profiles_demo_v2.ts', required: true },
  { name: 'Faculty Profiles', file: 'prisma/seed/seed_faculty_profiles.ts', required: true },

  { name: 'Teaching', file: 'prisma/seed/seed_teaching_data.ts', required: true },

  { name: 'Party Organizations', file: 'prisma/seed/seed_party_organizations.ts', required: true },
  { name: 'Party Members', file: 'prisma/seed/seed_party_members.ts', required: false },
  { name: 'Party History', file: 'prisma/seed/seed_party_history.ts', required: false },

  { name: 'Policy Records', file: 'prisma/seed/seed_policy_records.ts', required: true },
  { name: 'Insurance', file: 'prisma/seed/seed_insurance_full.ts', required: false },

  { name: 'Scientific', file: 'prisma/seed/seed_scientific.ts', required: false },
]

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}`
  console.log(line)
  appendFileSync(LOG_FILE, line + '\n')
}

function section(title: string) {
  const line = '\n' + '='.repeat(60) + `\n${title}\n` + '='.repeat(60)
  console.log(line)
  appendFileSync(LOG_FILE, line + '\n')
}

function fileExists(relativePath: string) {
  return existsSync(path.join(ROOT_DIR, relativePath))
}

function runCommand(command: string, args: string[], label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    section(`RUN: ${label}`)
    log(`$ ${command} ${args.join(' ')}`)

    const child = spawn(command, args, {
      cwd: ROOT_DIR,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
    })

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      process.stdout.write(text)
      appendFileSync(LOG_FILE, text)
    })

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      process.stderr.write(text)
      appendFileSync(LOG_FILE, text)
    })

    child.on('error', (error) => {
      log(`❌ Process error: ${error.message}`)
      reject(error)
    })

    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ Success: ${label}`)
        resolve()
      } else {
        const err = new Error(`Command failed with exit code ${code}: ${label}`)
        log(`❌ Failed: ${label}`)
        reject(err)
      }
    })
  })
}

async function ensurePrerequisites() {
  section('CHECK PREREQUISITES')

  if (!existsSync(SCHEMA_PATH)) {
    throw new Error(`Không tìm thấy schema Prisma: ${SCHEMA_PATH}`)
  }

  log(`Schema path: ${SCHEMA_PATH}`)
  log(`Log file: ${LOG_FILE}`)

  for (const item of SEED_FILES) {
    const exists = fileExists(item.file)
    if (!exists && item.required) {
      throw new Error(`Thiếu seed file bắt buộc: ${item.file}`)
    }
    log(`${exists ? '✅' : item.required ? '❌' : '⚠️'} ${item.file}`)
  }
}

async function cleanupEOFArtifacts() {
  section('CLEANUP EOF ARTIFACTS')

  const cmd = `
find prisma/seed prisma/seeds -type f \\( -name "*.ts" -o -name "*.js" \\) -exec sed -i '/^EOF$/d' {} \\; 2>/dev/null || true
`
  await runCommand('bash', ['-lc', cmd], 'cleanup EOF artifacts')
}

async function prismaGenerate() {
  await runCommand('npx', ['prisma', 'generate', '--schema=prisma/schema.prisma'], 'prisma generate')
}

async function prismaValidate() {
  await runCommand('npx', ['prisma', 'validate', '--schema=prisma/schema.prisma'], 'prisma validate')
}

async function runSeedFile(seedFile: SeedItem) {
  if (!fileExists(seedFile.file)) {
    if (seedFile.required) {
      throw new Error(`Thiếu seed file bắt buộc: ${seedFile.file}`)
    }
    log(`⚠️ Skip optional seed: ${seedFile.file}`)
    return
  }

  await runCommand('npx', ['tsx', seedFile.file], `seed ${seedFile.name}`)
}

async function main() {
  writeFileSync(LOG_FILE, `Seed pipeline started at ${new Date().toISOString()}\n`, 'utf8')

  section('START FULL SEED PIPELINE')

  await ensurePrerequisites()
  await cleanupEOFArtifacts()
  await prismaValidate()
  await prismaGenerate()

  for (const seed of SEED_FILES) {
    await runSeedFile(seed)
  }

  section('DONE')
  log('🎉 Full seed pipeline completed successfully')
  log(`📄 Log file: ${LOG_FILE}`)
}

main().catch((error) => {
  section('PIPELINE FAILED')
  log(error instanceof Error ? error.stack || error.message : String(error))
  process.exit(1)
})