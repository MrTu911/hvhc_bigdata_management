/**
 * NckhPublicationRepo – Module M09 UC-46
 * Data access layer cho NckhPublication và NckhPublicationAuthor.
 * Không chứa business logic.
 */
import 'server-only'
import db from '@/lib/db'
import type { NckhPublicationType, NckhPublicationStatus } from '@prisma/client'

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface NckhPublicationFilter {
  keyword?: string
  pubType?: NckhPublicationType
  status?: NckhPublicationStatus
  year?: number
  unitId?: string
  projectId?: string
  ranking?: string
  isISI?: boolean
  isScopus?: boolean
  /** RBAC SELF scope: chỉ xem công bố của authorId này */
  scopeAuthorId?: string
  page?: number
  limit?: number
}

// ─── Selects ──────────────────────────────────────────────────────────────────

const publicationListSelect = {
  id: true,
  title: true,
  titleEn: true,
  pubType: true,
  publishedYear: true,
  doi: true,
  isISI: true,
  isScopus: true,
  scopusQ: true,
  impactFactor: true,
  ranking: true,
  journal: true,
  citationCount: true,
  status: true,
  submittedAt: true,
  unitId: true,
  authorId: true,
  authorsText: true,
  keywords: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: { id: true, name: true, username: true, rank: true, militaryId: true, unit: true },
  },
  project: {
    select: { id: true, projectCode: true, title: true },
  },
} as const

const publicationDetailSelect = {
  ...publicationListSelect,
  abstract: true,
  doi: true,
  isbn: true,
  issn: true,
  volume: true,
  issue: true,
  pages: true,
  publisher: true,
  publishedAt: true,
  conferenceName: true,
  proceedingName: true,
  patentNumber: true,
  patentGrantDate: true,
  decisionNumber: true,
  advisorName: true,
  defenseScore: true,
  storageLocation: true,
  fullTextUrl: true,
  coAuthors: true,
  publicationAuthors: {
    orderBy: { authorOrder: 'asc' as const },
    include: {
      user: { select: { id: true, name: true, rank: true, militaryId: true } },
    },
  },
} as const

// ─── Create / Update types ────────────────────────────────────────────────────

export interface NckhPublicationCreateData {
  title: string
  pubType: NckhPublicationType
  publishedYear: number
  authorId: string
  titleEn?: string | null
  abstract?: string | null
  keywords?: string[]
  authorsText?: string | null
  doi?: string | null
  isbn?: string | null
  issn?: string | null
  journal?: string | null
  volume?: string | null
  issue?: string | null
  pages?: string | null
  publisher?: string | null
  publishedAt?: Date | null
  isISI?: boolean
  isScopus?: boolean
  scopusQ?: string | null
  impactFactor?: number | null
  ranking?: string | null
  citationCount?: number
  conferenceName?: string | null
  proceedingName?: string | null
  patentNumber?: string | null
  patentGrantDate?: Date | null
  decisionNumber?: string | null
  advisorName?: string | null
  defenseScore?: number | null
  storageLocation?: string | null
  fullTextUrl?: string | null
  projectId?: string | null
  unitId?: string | null
}

export type NckhPublicationUpdateData = Partial<NckhPublicationCreateData>

export interface PublicationAuthorCreateData {
  userId?: string | null
  authorName: string
  authorOrder: number
  affiliation?: string | null
  isInternal?: boolean
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const nckhPublicationRepo = {
  // ─ Queries ──────────────────────────────────────────────────────────────────

  async findMany(filter: NckhPublicationFilter = {}) {
    const {
      keyword,
      pubType,
      status,
      year,
      unitId,
      projectId,
      ranking,
      isISI,
      isScopus,
      scopeAuthorId,
      page = 1,
      limit = 20,
    } = filter

    const skip = (page - 1) * limit
    const where: Record<string, unknown> = {}

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { titleEn: { contains: keyword, mode: 'insensitive' } },
        { authorsText: { contains: keyword, mode: 'insensitive' } },
        { journal: { contains: keyword, mode: 'insensitive' } },
        { doi: { contains: keyword, mode: 'insensitive' } },
      ]
    }

    if (pubType) where.pubType = pubType
    if (status) where.status = status
    if (year) where.publishedYear = year
    if (unitId) where.unitId = unitId
    if (projectId) where.projectId = projectId
    if (ranking) where.ranking = { contains: ranking, mode: 'insensitive' }
    if (isISI !== undefined) where.isISI = isISI
    if (isScopus !== undefined) where.isScopus = isScopus

    // RBAC SELF scope
    if (scopeAuthorId) {
      where.OR = [
        { authorId: scopeAuthorId },
        { publicationAuthors: { some: { userId: scopeAuthorId } } },
      ]
    }

    const [total, publications] = await Promise.all([
      db.nckhPublication.count({ where }),
      db.nckhPublication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedYear: 'desc' },
        select: publicationListSelect,
      }),
    ])

    return { total, publications, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async findById(id: string) {
    return db.nckhPublication.findUnique({
      where: { id },
      select: publicationDetailSelect,
    })
  },

  async countByType(filter: { unitId?: string; scopeAuthorId?: string } = {}) {
    const where: Record<string, unknown> = {}
    if (filter.unitId) where.unitId = filter.unitId
    if (filter.scopeAuthorId) {
      where.OR = [
        { authorId: filter.scopeAuthorId },
        { publicationAuthors: { some: { userId: filter.scopeAuthorId } } },
      ]
    }
    return db.nckhPublication.groupBy({
      by: ['pubType'],
      where,
      _count: { id: true },
    })
  },

  // ─ Mutations ────────────────────────────────────────────────────────────────

  async create(data: NckhPublicationCreateData, authors?: PublicationAuthorCreateData[]) {
    // Tạo publication + authors trong một transaction
    return db.$transaction(async (tx) => {
      const pub = await tx.nckhPublication.create({
        data: {
          title: data.title,
          pubType: data.pubType,
          publishedYear: data.publishedYear,
          authorId: data.authorId,
          titleEn: data.titleEn ?? null,
          abstract: data.abstract ?? null,
          keywords: data.keywords ?? [],
          authorsText: data.authorsText ?? null,
          doi: data.doi ?? null,
          isbn: data.isbn ?? null,
          issn: data.issn ?? null,
          journal: data.journal ?? null,
          volume: data.volume ?? null,
          issue: data.issue ?? null,
          pages: data.pages ?? null,
          publisher: data.publisher ?? null,
          publishedAt: data.publishedAt ?? null,
          isISI: data.isISI ?? false,
          isScopus: data.isScopus ?? false,
          scopusQ: data.scopusQ ?? null,
          impactFactor: data.impactFactor ?? null,
          ranking: data.ranking ?? null,
          citationCount: data.citationCount ?? 0,
          conferenceName: data.conferenceName ?? null,
          proceedingName: data.proceedingName ?? null,
          patentNumber: data.patentNumber ?? null,
          patentGrantDate: data.patentGrantDate ?? null,
          decisionNumber: data.decisionNumber ?? null,
          advisorName: data.advisorName ?? null,
          defenseScore: data.defenseScore ?? null,
          storageLocation: data.storageLocation ?? null,
          fullTextUrl: data.fullTextUrl ?? null,
          projectId: data.projectId ?? null,
          unitId: data.unitId ?? null,
          status: 'PUBLISHED',
        },
      })

      if (authors && authors.length > 0) {
        await tx.nckhPublicationAuthor.createMany({
          data: authors.map((a) => ({ ...a, publicationId: pub.id })),
        })
      }

      return tx.nckhPublication.findUnique({
        where: { id: pub.id },
        select: publicationDetailSelect,
      })
    })
  },

  async update(id: string, data: NckhPublicationUpdateData) {
    return db.nckhPublication.update({
      where: { id },
      data,
      select: publicationDetailSelect,
    })
  },

  async replaceAuthors(publicationId: string, authors: PublicationAuthorCreateData[]) {
    await db.$transaction(async (tx) => {
      await tx.nckhPublicationAuthor.deleteMany({ where: { publicationId } })
      if (authors.length > 0) {
        await tx.nckhPublicationAuthor.createMany({
          data: authors.map((a) => ({ ...a, publicationId })),
        })
      }
    })
  },

  async delete(id: string) {
    return db.nckhPublication.delete({ where: { id } })
  },
}
