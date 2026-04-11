/**
 * WorkRepo – Phase 3
 * Data access cho ScientificWork + ScientificWorkAuthor.
 */
import 'server-only'
import prisma from '@/lib/db'
import type { WorkCreateInput, WorkUpdateInput, WorkListFilter } from '@/lib/validations/science-work'

const WORK_SELECT = {
  id: true,
  code: true,
  type: true,
  title: true,
  subtitle: true,
  isbn: true,
  issn: true,
  doi: true,
  publisherId: true,
  journalName: true,
  year: true,
  edition: true,
  sensitivity: true,
  createdAt: true,
  updatedAt: true,
  authors: {
    orderBy: { orderNum: 'asc' as const },
    select: {
      id: true,
      scientistId: true,
      authorName: true,
      role: true,
      orderNum: true,
      affiliation: true,
    },
  },
} as const

export const workRepo = {
  async findMany(filter: WorkListFilter) {
    const { keyword, type, year, sensitivity, scientistId, page, pageSize } = filter
    const skip = (page - 1) * pageSize

    const where = {
      isDeleted: false,
      ...(type ? { type } : {}),
      ...(year ? { year } : {}),
      ...(sensitivity ? { sensitivity } : {}),
      ...(scientistId ? { authors: { some: { scientistId } } } : {}),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' as const } },
              { isbn: { contains: keyword } },
              { doi: { contains: keyword } },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.scientificWork.findMany({
        where,
        select: WORK_SELECT,
        skip,
        take: pageSize,
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.scientificWork.count({ where }),
    ])

    return { items, total }
  },

  async findById(id: string) {
    return prisma.scientificWork.findFirst({
      where: { id, isDeleted: false },
      select: WORK_SELECT,
    })
  },

  async findByDoi(doi: string) {
    return prisma.scientificWork.findFirst({
      where: { doi, isDeleted: false },
      select: { id: true, code: true, title: true },
    })
  },

  async create(data: WorkCreateInput & { code: string }) {
    const { authors, ...workData } = data
    return prisma.scientificWork.create({
      data: {
        ...workData,
        authors: {
          create: authors,
        },
      },
      select: WORK_SELECT,
    })
  },

  async update(id: string, input: WorkUpdateInput) {
    const { authors, ...workData } = input

    if (authors) {
      // Replace authors atomically
      await prisma.$transaction([
        prisma.scientificWorkAuthor.deleteMany({ where: { workId: id } }),
        prisma.scientificWork.update({
          where: { id },
          data: {
            ...workData,
            authors: { create: authors },
          },
        }),
      ])
      return prisma.scientificWork.findUnique({ where: { id }, select: WORK_SELECT })
    }

    return prisma.scientificWork.update({
      where: { id },
      data: workData,
      select: WORK_SELECT,
    })
  },

  async softDelete(id: string) {
    return prisma.scientificWork.update({ where: { id }, data: { isDeleted: true } })
  },

  /**
   * BM25-style title search for duplicate detection (DB-side).
   * Returns top candidates by title similarity to compare cosine in service.
   */
  async findByTitleLike(title: string, limit = 20) {
    return prisma.scientificWork.findMany({
      where: {
        isDeleted: false,
        title: { contains: title.split(' ').slice(0, 5).join(' '), mode: 'insensitive' },
      },
      select: { id: true, code: true, title: true, doi: true, year: true },
      take: limit,
    })
  },
}

export type WorkFull = NonNullable<Awaited<ReturnType<typeof workRepo.findById>>>
