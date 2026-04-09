/**
 * GET   /api/science/scientists/:id  – Chi tiết hồ sơ (với sensitivity guard)
 * PATCH /api/science/scientists/:id  – Cập nhật profile
 *
 * Sub-resources (education/career/award) dùng path riêng:
 *   POST   /api/science/scientists/:id/education
 *   PATCH  /api/science/scientists/:id/education/:eduId
 *   DELETE /api/science/scientists/:id/education/:eduId
 *   (tương tự career, award)
 *
 * RBAC:
 *   GET   → SCIENCE.SCIENTIST_VIEW
 *   PATCH → SCIENCE.SCIENTIST_MANAGE
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { scientistService } from '@/lib/services/science/scientist.service'
import {
  scientistProfileUpdateSchema,
  scientistEducationCreateSchema,
  scientistEducationUpdateSchema,
  scientistCareerCreateSchema,
  scientistCareerUpdateSchema,
  scientistAwardCreateSchema,
  scientistAwardUpdateSchema,
} from '@/lib/validations/science-scientist'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ─── GET: detail profile ──────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { id } = await params

  const manageCheck = await authorize(auth.user!, SCIENCE.SCIENTIST_MANAGE)
  const canViewConfidential = manageCheck.allowed

  const result = await scientistService.getScientistById(id, canViewConfidential)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: result.data })
}

// ─── PATCH: update profile fields ────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_MANAGE)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()

  // Xác định sub-resource theo query param: ?sub=education|career|award
  const { searchParams } = new URL(req.url)
  const sub = searchParams.get('sub')
  const subId = searchParams.get('subId')

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  if (sub === 'education' && subId) {
    const parsed = scientistEducationUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const result = await scientistService.updateEducation(subId, id, parsed.data, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, data: result.data })
  }

  if (sub === 'career' && subId) {
    const parsed = scientistCareerUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const result = await scientistService.updateCareer(subId, id, parsed.data, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, data: result.data })
  }

  if (sub === 'award' && subId) {
    const parsed = scientistAwardUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const result = await scientistService.updateAward(subId, id, parsed.data, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, data: result.data })
  }

  // Default: update profile fields
  const parsed = scientistProfileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const result = await scientistService.updateProfile(id, parsed.data, auth.user!.id, ipAddress)
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  return NextResponse.json({ success: true, data: result.data })
}

// ─── POST: add sub-resource (education / career / award) ─────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_MANAGE)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()

  const { searchParams } = new URL(req.url)
  const sub = searchParams.get('sub')
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  if (sub === 'education') {
    const parsed = scientistEducationCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const result = await scientistService.addEducation(id, parsed.data, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  }

  if (sub === 'career') {
    const parsed = scientistCareerCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const result = await scientistService.addCareer(id, parsed.data, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  }

  if (sub === 'award') {
    const parsed = scientistAwardCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const result = await scientistService.addAward(id, parsed.data, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  }

  return NextResponse.json(
    { success: false, error: 'Tham số sub không hợp lệ. Dùng ?sub=education|career|award' },
    { status: 400 }
  )
}

// ─── DELETE: remove sub-resource ─────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_MANAGE)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const sub = searchParams.get('sub')
  const subId = searchParams.get('subId')
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  if (!sub || !subId) {
    return NextResponse.json(
      { success: false, error: 'Cần có tham số ?sub và ?subId' },
      { status: 400 }
    )
  }

  if (sub === 'education') {
    const result = await scientistService.deleteEducation(subId, id, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (sub === 'career') {
    const result = await scientistService.deleteCareer(subId, id, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (sub === 'award') {
    const result = await scientistService.deleteAward(subId, id, auth.user!.id, ipAddress)
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { success: false, error: 'Tham số sub không hợp lệ. Dùng ?sub=education|career|award' },
    { status: 400 }
  )
}
