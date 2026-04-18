/**
 * GET  /api/science/projects/[id]/chat — lịch sử tin nhắn + tạo room nếu chưa có
 * POST /api/science/projects/[id]/chat — gửi tin nhắn, trigger Pusher event
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import prisma from '@/lib/db'
import Pusher from 'pusher'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Lazy-init Pusher server client (graceful fallback khi env chưa cấu hình)
function getPusher(): Pusher | null {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) return null
  return new Pusher({ appId: PUSHER_APP_ID, key: PUSHER_KEY, secret: PUSHER_SECRET, cluster: PUSHER_CLUSTER, useTLS: true })
}

const PAGE_SIZE = 50

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id: projectId } = await params
  const cursor = req.nextUrl.searchParams.get('cursor') // message id for pagination

  // Ensure project exists
  const project = await prisma.nckhProject.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, projectCode: true },
  })
  if (!project) {
    return NextResponse.json({ success: false, data: null, error: 'Đề tài không tồn tại' }, { status: 404 })
  }

  // Get or create chat room
  let room = await prisma.nckhChatRoom.findUnique({
    where: { projectId },
    select: { id: true, name: true, createdAt: true },
  })
  if (!room) {
    room = await prisma.nckhChatRoom.create({
      data: { projectId, name: `Thảo luận: ${project.projectCode}` },
      select: { id: true, name: true, createdAt: true },
    })
  }

  // Ensure caller is a participant
  await prisma.nckhChatParticipant.upsert({
    where: { roomId_userId: { roomId: room.id, userId: auth.user!.id } },
    update: {},
    create: { roomId: room.id, userId: auth.user!.id },
  })

  // Load messages (newest first, paginated)
  const messages = await prisma.nckhChatMessage.findMany({
    where: {
      roomId: room.id,
      isDeleted: false,
      ...(cursor ? { createdAt: { lt: (await prisma.nckhChatMessage.findUnique({ where: { id: cursor }, select: { createdAt: true } }))?.createdAt } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    select: {
      id: true,
      content: true,
      fileUrl: true,
      isEdited: true,
      createdAt: true,
      sender: { select: { id: true, name: true } },
    },
  })

  // Update lastReadAt
  await prisma.nckhChatParticipant.update({
    where: { roomId_userId: { roomId: room.id, userId: auth.user!.id } },
    data: { lastReadAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    data: {
      room,
      messages: messages.reverse(), // chronological order
      hasMore: messages.length === PAGE_SIZE,
      nextCursor: messages.length === PAGE_SIZE ? messages[0].id : null,
    },
    error: null,
  })
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id: projectId } = await params
  const body = await req.json()
  const { content, fileUrl } = body as { content?: string; fileUrl?: string }

  if (!content?.trim()) {
    return NextResponse.json({ success: false, data: null, error: 'Nội dung tin nhắn không được để trống' }, { status: 400 })
  }
  if (content.trim().length > 2000) {
    return NextResponse.json({ success: false, data: null, error: 'Tin nhắn tối đa 2000 ký tự' }, { status: 400 })
  }

  // Get or create room
  let room = await prisma.nckhChatRoom.findUnique({ where: { projectId }, select: { id: true } })
  if (!room) {
    const project = await prisma.nckhProject.findUnique({ where: { id: projectId }, select: { projectCode: true } })
    if (!project) {
      return NextResponse.json({ success: false, data: null, error: 'Đề tài không tồn tại' }, { status: 404 })
    }
    room = await prisma.nckhChatRoom.create({
      data: { projectId, name: `Thảo luận: ${project.projectCode}` },
      select: { id: true },
    })
  }

  // Upsert participant
  await prisma.nckhChatParticipant.upsert({
    where: { roomId_userId: { roomId: room.id, userId: auth.user!.id } },
    update: { lastReadAt: new Date() },
    create: { roomId: room.id, userId: auth.user!.id, lastReadAt: new Date() },
  })

  const message = await prisma.nckhChatMessage.create({
    data: {
      roomId: room.id,
      senderId: auth.user!.id,
      content: content.trim(),
      ...(fileUrl ? { fileUrl } : {}),
    },
    select: {
      id: true,
      content: true,
      fileUrl: true,
      isEdited: true,
      createdAt: true,
      sender: { select: { id: true, name: true } },
    },
  })

  // Trigger Pusher event — graceful fallback if not configured
  const pusher = getPusher()
  if (pusher) {
    await pusher.trigger(`project-chat-${projectId}`, 'new-message', {
      id: message.id,
      content: message.content,
      fileUrl: message.fileUrl,
      isEdited: message.isEdited,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender,
    }).catch((err: unknown) => {
      console.error('[ChatRoute] Pusher trigger failed:', err)
    })
  }

  return NextResponse.json({ success: true, data: message, error: null }, { status: 201 })
}
