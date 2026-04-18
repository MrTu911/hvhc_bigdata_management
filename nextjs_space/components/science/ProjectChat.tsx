'use client'

/**
 * ProjectChat — Realtime chat component cho NckhProject.
 *
 * Realtime: Pusher Channels (NEXT_PUBLIC_PUSHER_KEY + NEXT_PUBLIC_PUSHER_CLUSTER).
 * Fallback: Nếu env chưa cấu hình → chỉ hiển thị lịch sử, không realtime.
 *
 * Channel: project-chat-{projectId}
 * Event:   new-message
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  content: string
  fileUrl?: string | null
  isEdited: boolean
  createdAt: string
  sender: { id: string; name: string }
}

interface ProjectChatProps {
  projectId: string
  currentUserId: string
  currentUserName: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectChat({ projectId, currentUserId, currentUserName }: ProjectChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [realtimeActive, setRealtimeActive] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const pusherRef = useRef<Pusher | null>(null)

  // ─── Load history ──────────────────────────────────────────────────────────

  const loadHistory = useCallback(async (cursor?: string) => {
    const url = `/api/science/projects/${projectId}/chat${cursor ? `?cursor=${cursor}` : ''}`
    const res = await fetch(url)
    const json = await res.json()
    if (!json.success) throw new Error(json.error ?? 'Lỗi tải lịch sử chat')
    return json.data as { messages: ChatMessage[]; hasMore: boolean; nextCursor: string | null }
  }, [projectId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loadHistory()
      .then(({ messages: msgs, hasMore: more, nextCursor: cursor }) => {
        if (cancelled) return
        setMessages(msgs)
        setHasMore(more)
        setNextCursor(cursor)
        setError(null)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [loadHistory])

  // ─── Pusher subscription ───────────────────────────────────────────────────

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster) return

    const pusher = new Pusher(key, { cluster })
    pusherRef.current = pusher

    const channel = pusher.subscribe(`project-chat-${projectId}`)
    channel.bind('new-message', (data: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev
        return [...prev, data]
      })
    })
    channel.bind('pusher:subscription_succeeded', () => setRealtimeActive(true))
    channel.bind('pusher:subscription_error', () => setRealtimeActive(false))

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`project-chat-${projectId}`)
      pusher.disconnect()
      pusherRef.current = null
    }
  }, [projectId])

  // ─── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  // ─── Load more (older) ─────────────────────────────────────────────────────

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const { messages: older, hasMore: more, nextCursor: cursor } = await loadHistory(nextCursor)
      setMessages((prev) => [...older, ...prev])
      setHasMore(more)
      setNextCursor(cursor)
    } catch {
      // silently ignore load-more errors
    } finally {
      setLoadingMore(false)
    }
  }

  // ─── Send ──────────────────────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    const optimisticId = `opt-${Date.now()}`
    const optimistic: ChatMessage = {
      id: optimisticId,
      content: input.trim(),
      isEdited: false,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: currentUserName },
    }

    setMessages((prev) => [...prev, optimistic])
    setInput('')
    setSending(true)

    try {
      const res = await fetch(`/api/science/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: optimistic.content }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Gửi thất bại')

      // Replace optimistic with real
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? json.data : m)))
    } catch (err) {
      // Remove optimistic on failure and restore input
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setInput(optimistic.content)
      setError(err instanceof Error ? err.message : 'Gửi tin nhắn thất bại')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    return isToday
      ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const isOwnMessage = (msg: ChatMessage) => msg.sender.id === currentUserId

  const getInitials = (name: string) =>
    name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700 text-sm">Thảo luận nhóm</span>
          {realtimeActive ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Trực tuyến
            </span>
          ) : (
            <span className="text-xs text-gray-400">Không có kết nối realtime</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{messages.length} tin nhắn</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-400">Đang tải...</div>
          </div>
        )}

        {!loading && error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && hasMore && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-xs text-violet-600 hover:text-violet-800 disabled:opacity-50"
            >
              {loadingMore ? 'Đang tải...' : 'Tải tin nhắn cũ hơn'}
            </button>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${isOwnMessage(msg) ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              isOwnMessage(msg) ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {getInitials(msg.sender.name)}
            </div>

            {/* Bubble */}
            <div className={`max-w-[70%] flex flex-col gap-0.5 ${isOwnMessage(msg) ? 'items-end' : 'items-start'}`}>
              {!isOwnMessage(msg) && (
                <span className="text-xs text-gray-500 font-medium">{msg.sender.name}</span>
              )}
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                isOwnMessage(msg)
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              } ${msg.id.startsWith('opt-') ? 'opacity-60' : ''}`}>
                {msg.content}
                {msg.isEdited && (
                  <span className={`text-xs ml-1 ${isOwnMessage(msg) ? 'text-violet-300' : 'text-gray-400'}`}>
                    (đã sửa)
                  </span>
                )}
              </div>
              {msg.fileUrl && (
                <a
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-600 hover:underline"
                >
                  Tệp đính kèm
                </a>
              )}
              <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-100 px-4 py-3 bg-gray-50">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
            rows={2}
            maxLength={2000}
            disabled={sending}
            className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 bg-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {sending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">{input.length}/2000</p>
      </form>
    </div>
  )
}
