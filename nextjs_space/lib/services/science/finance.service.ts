import 'server-only'
import prisma from '@/lib/db'
import { NckhPoStatus, NckhInvoiceStatus, NckhExpenseStatus, NckhGrantStatus, NckhExpenseCategory } from '@prisma/client'

// ─── BigInt serialization helper ─────────────────────────────────────────────
// VND amounts có thể vượt Number.MAX_SAFE_INTEGER — dùng string để an toàn.
function bigIntToStr(v: bigint | null | undefined): string {
  return v?.toString() ?? '0'
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export async function listPOs(filters: {
  projectId?: string
  status?: NckhPoStatus
  year?: number
  page?: number
  pageSize?: number
}) {
  const { projectId, status, year, page = 1, pageSize = 20 } = filters
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}
  if (projectId) where.projectId = projectId
  if (status) where.status = status
  if (year) {
    where.orderDate = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    }
  }

  const [rows, total] = await Promise.all([
    prisma.nckhPurchaseOrder.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { orderDate: 'desc' },
      include: {
        project: { select: { id: true, projectCode: true, title: true } },
        createdBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.nckhPurchaseOrder.count({ where }),
  ])

  const items = rows.map((r) => ({
    ...r,
    totalAmount: bigIntToStr(r.totalAmount),
  }))

  return { items, total, page, pageSize }
}

export async function getPO(id: string) {
  const po = await prisma.nckhPurchaseOrder.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, projectCode: true, title: true } },
      createdBy: { select: { id: true, fullName: true } },
      approvedBy: { select: { id: true, fullName: true } },
      items: true,
    },
  })
  if (!po) return null
  return {
    ...po,
    totalAmount: bigIntToStr(po.totalAmount),
    items: po.items.map((i) => ({
      ...i,
      unitPrice: bigIntToStr(i.unitPrice),
      amount: bigIntToStr(i.amount),
    })),
  }
}

export async function createPO(data: {
  projectId: string
  vendor: string
  totalAmount: bigint
  currency?: string
  notes?: string
  createdById: string
  items?: Array<{
    itemName: string
    quantity: number
    unitPrice: bigint
    amount: bigint
    category: NckhExpenseCategory
    unit?: string
    notes?: string
  }>
}) {
  const year = new Date().getFullYear()
  const seq = await prisma.scienceIdSequence.upsert({
    where: { entityType_year: { entityType: 'PO', year } },
    create: { entityType: 'PO', year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  })
  const poNumber = `PO-${year}-${String(seq.lastSeq).padStart(4, '0')}`

  const po = await prisma.nckhPurchaseOrder.create({
    data: {
      projectId: data.projectId,
      poNumber,
      vendor: data.vendor,
      totalAmount: data.totalAmount,
      currency: data.currency ?? 'VND',
      notes: data.notes,
      createdById: data.createdById,
      items: data.items
        ? {
            create: data.items,
          }
        : undefined,
    },
    include: { items: true },
  })

  return {
    ...po,
    totalAmount: bigIntToStr(po.totalAmount),
    items: po.items.map((i) => ({
      ...i,
      unitPrice: bigIntToStr(i.unitPrice),
      amount: bigIntToStr(i.amount),
    })),
  }
}

export async function approvePO(data: {
  poId: string
  approverId: string
  action: 'APPROVE' | 'REJECT' | 'RECEIVE' | 'CANCEL'
}) {
  const po = await prisma.nckhPurchaseOrder.findUniqueOrThrow({ where: { id: data.poId } })

  const validTransitions: Record<string, string[]> = {
    DRAFT:     ['APPROVE', 'CANCEL'],
    SUBMITTED: ['APPROVE', 'CANCEL'],
    APPROVED:  ['RECEIVE', 'CANCEL'],
  }

  const allowed = validTransitions[po.status] ?? []
  if (!allowed.includes(data.action)) {
    throw new Error(`Không thể thực hiện ${data.action} khi PO đang ở trạng thái ${po.status}`)
  }

  const statusMap: Record<string, NckhPoStatus> = {
    APPROVE:  'APPROVED',
    REJECT:   'DRAFT',
    RECEIVE:  'RECEIVED',
    CANCEL:   'CANCELLED',
  }

  return prisma.nckhPurchaseOrder.update({
    where: { id: data.poId },
    data: {
      status: statusMap[data.action],
      approvedById: ['APPROVE', 'RECEIVE'].includes(data.action) ? data.approverId : undefined,
      approvedAt: ['APPROVE', 'RECEIVE'].includes(data.action) ? new Date() : undefined,
    },
  })
}

export async function addPOItem(poId: string, item: {
  itemName: string
  quantity: number
  unitPrice: bigint
  amount: bigint
  category: NckhExpenseCategory
  unit?: string
  notes?: string
}) {
  const po = await prisma.nckhPurchaseOrder.findUniqueOrThrow({ where: { id: poId } })
  if (po.status !== 'DRAFT') throw new Error('Chỉ có thể thêm item khi PO ở trạng thái DRAFT')
  return prisma.nckhPurchaseOrderItem.create({ data: { poId, ...item } })
}

export async function deletePOItem(itemId: string) {
  return prisma.nckhPurchaseOrderItem.delete({ where: { id: itemId } })
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function listInvoices(filters: {
  projectId?: string
  status?: NckhInvoiceStatus
  year?: number
  page?: number
  pageSize?: number
}) {
  const { projectId, status, year, page = 1, pageSize = 20 } = filters
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}
  if (projectId) where.projectId = projectId
  if (status) where.status = status
  if (year) {
    where.invoiceDate = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    }
  }

  const [rows, total] = await Promise.all([
    prisma.nckhInvoice.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { invoiceDate: 'desc' },
      include: {
        project: { select: { id: true, projectCode: true, title: true } },
        po: { select: { id: true, poNumber: true } },
        createdBy: { select: { id: true, fullName: true } },
        paidBy: { select: { id: true, fullName: true } },
      },
    }),
    prisma.nckhInvoice.count({ where }),
  ])

  const items = rows.map((r) => ({ ...r, totalAmount: bigIntToStr(r.totalAmount) }))
  return { items, total, page, pageSize }
}

export async function getInvoice(id: string) {
  const inv = await prisma.nckhInvoice.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, projectCode: true, title: true } },
      po: { select: { id: true, poNumber: true } },
      createdBy: { select: { id: true, fullName: true } },
      paidBy: { select: { id: true, fullName: true } },
      items: true,
    },
  })
  if (!inv) return null
  return {
    ...inv,
    totalAmount: bigIntToStr(inv.totalAmount),
    items: inv.items.map((i) => ({
      ...i,
      unitPrice: bigIntToStr(i.unitPrice),
      amount: bigIntToStr(i.amount),
    })),
  }
}

export async function createInvoice(data: {
  projectId: string
  poId?: string
  vendor: string
  invoiceDate: Date
  dueDate?: Date
  totalAmount: bigint
  currency?: string
  notes?: string
  createdById: string
  items?: Array<{
    description: string
    quantity: number
    unitPrice: bigint
    amount: bigint
    category: NckhExpenseCategory
  }>
}) {
  const year = new Date().getFullYear()
  const seq = await prisma.scienceIdSequence.upsert({
    where: { entityType_year: { entityType: 'INVOICE', year } },
    create: { entityType: 'INVOICE', year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  })
  const invoiceNumber = `INV-${year}-${String(seq.lastSeq).padStart(4, '0')}`

  const inv = await prisma.nckhInvoice.create({
    data: {
      projectId: data.projectId,
      poId: data.poId,
      invoiceNumber,
      vendor: data.vendor,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      totalAmount: data.totalAmount,
      currency: data.currency ?? 'VND',
      notes: data.notes,
      createdById: data.createdById,
      items: data.items ? { create: data.items } : undefined,
    },
    include: { items: true },
  })

  return { ...inv, totalAmount: bigIntToStr(inv.totalAmount) }
}

export async function payInvoice(invoiceId: string, payerId: string) {
  const inv = await prisma.nckhInvoice.findUniqueOrThrow({ where: { id: invoiceId } })
  if (inv.status === 'PAID') throw new Error('Hóa đơn đã được thanh toán')
  if (!['PENDING', 'APPROVED'].includes(inv.status)) {
    throw new Error('Hóa đơn không ở trạng thái có thể thanh toán')
  }

  // Cập nhật invoice + ResearchBudget.totalSpent trong transaction
  return prisma.$transaction(async (tx) => {
    const updated = await tx.nckhInvoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID', paidAt: new Date(), paidById: payerId },
    })

    // Tăng totalSpent của budget gắn với project
    await tx.researchBudget.updateMany({
      where: { projectId: inv.projectId },
      data: { totalSpent: { increment: inv.totalAmount } },
    })

    return { ...updated, totalAmount: bigIntToStr(updated.totalAmount) }
  })
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function listExpenses(filters: {
  projectId?: string
  status?: NckhExpenseStatus
  category?: NckhExpenseCategory
  year?: number
  page?: number
  pageSize?: number
}) {
  const { projectId, status, category, year, page = 1, pageSize = 20 } = filters
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}
  if (projectId) where.projectId = projectId
  if (status) where.status = status
  if (category) where.category = category
  if (year) {
    where.expenseDate = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    }
  }

  const [rows, total] = await Promise.all([
    prisma.nckhExpense.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { expenseDate: 'desc' },
      include: {
        project: { select: { id: true, projectCode: true, title: true } },
        submittedBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    }),
    prisma.nckhExpense.count({ where }),
  ])

  return {
    items: rows.map((r) => ({ ...r, amount: bigIntToStr(r.amount) })),
    total,
    page,
    pageSize,
  }
}

export async function getExpense(id: string) {
  const exp = await prisma.nckhExpense.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, projectCode: true, title: true } },
      submittedBy: { select: { id: true, fullName: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  })
  if (!exp) return null
  return { ...exp, amount: bigIntToStr(exp.amount) }
}

export async function createExpense(data: {
  projectId: string
  expenseDate: Date
  category: NckhExpenseCategory
  amount: bigint
  description: string
  receiptUrl?: string
  submittedById: string
}) {
  const exp = await prisma.nckhExpense.create({ data })
  return { ...exp, amount: bigIntToStr(exp.amount) }
}

export async function resolveExpense(data: {
  expenseId: string
  approverId: string
  action: 'APPROVE' | 'REJECT'
  rejectReason?: string
}) {
  const exp = await prisma.nckhExpense.findUniqueOrThrow({ where: { id: data.expenseId } })

  if (!['DRAFT', 'SUBMITTED'].includes(exp.status)) {
    throw new Error('Chi phí không ở trạng thái có thể phê duyệt')
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.nckhExpense.update({
      where: { id: data.expenseId },
      data: {
        status: data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approvedById: data.approverId,
        approvedAt: new Date(),
        rejectReason: data.action === 'REJECT' ? data.rejectReason : undefined,
      },
    })

    // Khi approve expense → tăng totalSpent
    if (data.action === 'APPROVE') {
      await tx.researchBudget.updateMany({
        where: { projectId: exp.projectId },
        data: { totalSpent: { increment: exp.amount } },
      })
    }

    return { ...updated, amount: bigIntToStr(updated.amount) }
  })
}

// ─── Grants ───────────────────────────────────────────────────────────────────

export async function listGrants(filters: {
  projectId?: string
  status?: NckhGrantStatus
  page?: number
  pageSize?: number
}) {
  const { projectId, status, page = 1, pageSize = 20 } = filters
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}
  if (projectId) where.projectId = projectId
  if (status) where.status = status

  const [rows, total] = await Promise.all([
    prisma.nckhGrant.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, projectCode: true, title: true } },
        createdBy: { select: { id: true, fullName: true } },
        _count: { select: { disbursements: true } },
      },
    }),
    prisma.nckhGrant.count({ where }),
  ])

  return {
    items: rows.map((r) => ({ ...r, amount: bigIntToStr(r.amount) })),
    total,
    page,
    pageSize,
  }
}

export async function getGrant(id: string) {
  const grant = await prisma.nckhGrant.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, projectCode: true, title: true } },
      createdBy: { select: { id: true, fullName: true } },
      disbursements: { orderBy: { disbursementDate: 'desc' } },
    },
  })
  if (!grant) return null
  return {
    ...grant,
    amount: bigIntToStr(grant.amount),
    disbursements: grant.disbursements.map((d) => ({
      ...d,
      amount: bigIntToStr(d.amount),
    })),
  }
}

export async function createGrant(data: {
  projectId: string
  grantor: string
  grantorType?: string
  amount: bigint
  currency?: string
  startDate: Date
  endDate: Date
  conditions?: string
  reportDeadline?: Date
  createdById: string
}) {
  const year = new Date().getFullYear()
  const seq = await prisma.scienceIdSequence.upsert({
    where: { entityType_year: { entityType: 'GRANT', year } },
    create: { entityType: 'GRANT', year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  })
  const grantNumber = `GR-${year}-${String(seq.lastSeq).padStart(3, '0')}`

  const grant = await prisma.nckhGrant.create({
    data: { ...data, grantNumber, currency: data.currency ?? 'VND' },
  })
  return { ...grant, amount: bigIntToStr(grant.amount) }
}

export async function listDisbursements(grantId: string) {
  const rows = await prisma.nckhGrantDisbursement.findMany({
    where: { grantId },
    orderBy: { disbursementDate: 'desc' },
  })
  return rows.map((r) => ({ ...r, amount: bigIntToStr(r.amount) }))
}

export async function createDisbursement(grantId: string, data: {
  disbursementDate: Date
  amount: bigint
  description?: string
  receiptUrl?: string
}) {
  // Kiểm tra tổng disbursement không vượt grant amount
  const grant = await prisma.nckhGrant.findUniqueOrThrow({ where: { id: grantId } })
  const existing = await prisma.nckhGrantDisbursement.aggregate({
    where: { grantId },
    _sum: { amount: true },
  })
  const alreadyDisbursed = existing._sum.amount ?? BigInt(0)
  if (alreadyDisbursed + data.amount > grant.amount) {
    throw new Error('Tổng giải ngân vượt quá giá trị grant')
  }

  const d = await prisma.nckhGrantDisbursement.create({ data: { grantId, ...data } })
  return { ...d, amount: bigIntToStr(d.amount) }
}

// ─── Finance Summary ──────────────────────────────────────────────────────────

export async function getProjectFinanceSummary(projectId: string) {
  const [budget, poAgg, invoiceAgg, expenseAgg, grantAgg] = await Promise.all([
    prisma.researchBudget.findUnique({ where: { projectId } }),
    prisma.nckhPurchaseOrder.aggregate({
      where: { projectId, status: { in: ['APPROVED', 'RECEIVED'] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.nckhInvoice.aggregate({
      where: { projectId, status: 'PAID' },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.nckhExpense.aggregate({
      where: { projectId, status: 'APPROVED' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.nckhGrant.aggregate({
      where: { projectId, status: { in: ['ACTIVE', 'COMPLETED'] } },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  const totalApproved = budget?.totalApproved ?? BigInt(0)
  const paidInvoices = invoiceAgg._sum.totalAmount ?? BigInt(0)
  const approvedExpenses = expenseAgg._sum.amount ?? BigInt(0)
  const totalSpent = paidInvoices + approvedExpenses

  return {
    budget: budget
      ? {
          totalApproved: bigIntToStr(totalApproved),
          totalSpent: bigIntToStr(budget.totalSpent),
          remaining: bigIntToStr(totalApproved - budget.totalSpent),
          status: budget.status,
        }
      : null,
    purchaseOrders: {
      count: poAgg._count,
      totalApproved: bigIntToStr(poAgg._sum.totalAmount ?? BigInt(0)),
    },
    invoices: {
      count: invoiceAgg._count,
      totalPaid: bigIntToStr(paidInvoices),
    },
    expenses: {
      count: expenseAgg._count,
      totalApproved: bigIntToStr(approvedExpenses),
    },
    grants: {
      count: grantAgg._count,
      totalAmount: bigIntToStr(grantAgg._sum.amount ?? BigInt(0)),
    },
    totalActualSpent: bigIntToStr(totalSpent),
  }
}

export async function getAcademyFinanceSummary(year: number) {
  const dateRange = {
    gte: new Date(`${year}-01-01`),
    lt: new Date(`${year + 1}-01-01`),
  }

  const [budgets, invoices, expenses, grants] = await Promise.all([
    prisma.researchBudget.aggregate({
      where: { year },
      _sum: { totalApproved: true, totalSpent: true },
      _count: true,
    }),
    prisma.nckhInvoice.aggregate({
      where: { invoiceDate: dateRange, status: 'PAID' },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.nckhExpense.aggregate({
      where: { expenseDate: dateRange, status: 'APPROVED' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.nckhGrant.aggregate({
      where: { startDate: dateRange, status: { in: ['ACTIVE', 'COMPLETED'] } },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return {
    year,
    budgets: {
      count: budgets._count,
      totalApproved: bigIntToStr(budgets._sum.totalApproved ?? BigInt(0)),
      totalSpent: bigIntToStr(budgets._sum.totalSpent ?? BigInt(0)),
    },
    invoicesPaid: {
      count: invoices._count,
      total: bigIntToStr(invoices._sum.totalAmount ?? BigInt(0)),
    },
    expensesApproved: {
      count: expenses._count,
      total: bigIntToStr(expenses._sum.amount ?? BigInt(0)),
    },
    grants: {
      count: grants._count,
      total: bigIntToStr(grants._sum.amount ?? BigInt(0)),
    },
  }
}

export const financeService = {
  listPOs,
  getPO,
  createPO,
  approvePO,
  addPOItem,
  deletePOItem,
  listInvoices,
  getInvoice,
  createInvoice,
  payInvoice,
  listExpenses,
  getExpense,
  createExpense,
  resolveExpense,
  listGrants,
  getGrant,
  createGrant,
  listDisbursements,
  createDisbursement,
  getProjectFinanceSummary,
  getAcademyFinanceSummary,
}
