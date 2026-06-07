/**
 * Audit script: count rows for EVERY Prisma model.
 * Read-only. Used to find which sample datasets are missing/empty.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/audit_counts.ts
 */
import { PrismaClient, Prisma } from '@prisma/client'

const db = new PrismaClient()

type CountResult = { model: string; count: number | string }

async function main() {
  const models = Prisma.dmmf.datamodel.models.map(m => m.name)
  const results: CountResult[] = []

  for (const modelName of models) {
    // Prisma client accessor = lowercase first char of model name
    const accessor = modelName.charAt(0).toLowerCase() + modelName.slice(1)
    const delegate = (db as Record<string, any>)[accessor]
    if (!delegate || typeof delegate.count !== 'function') {
      results.push({ model: modelName, count: 'NO_DELEGATE' })
      continue
    }
    try {
      const count = await delegate.count()
      results.push({ model: modelName, count })
    } catch (err) {
      results.push({ model: modelName, count: `ERR:${(err as Error).message.split('\n')[0].slice(0, 40)}` })
    }
  }

  const empty = results.filter(r => r.count === 0)
  const populated = results.filter(r => typeof r.count === 'number' && r.count > 0)
  const errored = results.filter(r => typeof r.count === 'string')

  console.log('\n══════════ EMPTY MODELS (count = 0) ══════════')
  empty.forEach(r => console.log(`  ${r.model}`))
  console.log(`\n  TOTAL EMPTY: ${empty.length}`)

  console.log('\n══════════ POPULATED MODELS ══════════')
  populated.sort((a, b) => (b.count as number) - (a.count as number))
  populated.forEach(r => console.log(`  ${String(r.count).padStart(6)}  ${r.model}`))
  console.log(`\n  TOTAL POPULATED: ${populated.length}`)

  if (errored.length) {
    console.log('\n══════════ ERRORS / NO DELEGATE ══════════')
    errored.forEach(r => console.log(`  ${r.model}: ${r.count}`))
  }

  console.log(`\n══════════ SUMMARY ══════════`)
  console.log(`  Total models: ${results.length}`)
  console.log(`  Populated:    ${populated.length}`)
  console.log(`  Empty:        ${empty.length}`)
  console.log(`  Errored:      ${errored.length}`)
}

main().catch(console.error).finally(() => db.$disconnect())
