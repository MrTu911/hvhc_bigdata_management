'use client'

/**
 * TreeView – M19 MDM Admin
 *
 * Hiển thị items dạng cây phân cấp theo parentCode.
 * Production-ready:
 *   - expand / collapse
 *   - search filter (ẩn nhánh không khớp)
 *   - inline edit name
 *   - toggle active status
 *   - drag-drop sort trong cùng cấp bằng @dnd-kit
 *   - Up/Down buttons vẫn giữ như fallback
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronRight, ChevronDown, Pencil, Check, X,
  MoveUp, MoveDown, ToggleLeft, GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TreeItem = {
  id: string
  code: string
  nameVi: string
  nameEn: string | null
  shortName: string | null
  parentCode: string | null
  externalCode: string | null
  sortOrder: number
  isActive: boolean
}

type TreeNode = TreeItem & { children: TreeNode[] }

export type TreeViewProps = {
  items: TreeItem[]
  onEdit: (code: string, nameVi: string) => Promise<void>
  onToggle: (code: string) => Promise<void>
  /**
   * Called with flat DFS-ordered code array after any sort action
   * (drag-drop OR Up/Down buttons both call this same interface).
   */
  onReorder: (flatCodes: string[]) => Promise<void>
  saving?: boolean
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildTree(items: TreeItem[]): TreeNode[] {
  const byCode = new Map<string, TreeNode>()
  for (const item of items) {
    byCode.set(item.code, { ...item, children: [] })
  }
  const roots: TreeNode[] = []
  for (const node of byCode.values()) {
    const parent = node.parentCode ? byCode.get(node.parentCode) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  function sortLevel(nodes: TreeNode[]) {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    nodes.forEach(n => sortLevel(n.children))
  }
  sortLevel(roots)
  return roots
}

function flattenCodes(nodes: TreeNode[]): string[] {
  const result: string[] = []
  function walk(ns: TreeNode[]) {
    for (const n of ns) { result.push(n.code); walk(n.children) }
  }
  walk(nodes)
  return result
}

/** Swap two siblings within same parent by Up/Down */
function swapSiblings(nodes: TreeNode[], targetCode: string, direction: 'up' | 'down'): TreeNode[] {
  function swapInList(list: TreeNode[]): TreeNode[] {
    const idx = list.findIndex(n => n.code === targetCode)
    if (idx !== -1) {
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= list.length) return list
      const next = [...list];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    }
    return list.map(n => ({ ...n, children: swapInList(n.children) }))
  }
  return swapInList(nodes)
}

/**
 * Reorder siblings within the same parent using arrayMove (for drag-drop).
 * Only acts when activeCode and overCode share the same parent.
 */
function reorderSiblings(nodes: TreeNode[], activeCode: string, overCode: string): TreeNode[] {
  const activeIdx = nodes.findIndex(n => n.code === activeCode)
  const overIdx = nodes.findIndex(n => n.code === overCode)
  if (activeIdx !== -1 && overIdx !== -1) {
    return arrayMove(nodes, activeIdx, overIdx)
  }
  return nodes.map(n => ({
    ...n,
    children: reorderSiblings(n.children, activeCode, overCode),
  }))
}

// ─── SortableNodeRow ──────────────────────────────────────────────────────────

type NodeRowProps = {
  node: TreeNode
  siblings: TreeNode[]
  expanded: Set<string>
  onToggleExpand: (code: string) => void
  editingCode: string | null
  editValue: string
  onStartEdit: (code: string, current: string) => void
  onEditChange: (val: string) => void
  onEditSubmit: () => void
  onEditCancel: () => void
  onToggleActive: (code: string) => void
  onMove: (code: string, direction: 'up' | 'down') => void
  searchQuery: string
  depth: number
  /** drag handle props from useSortable */
  dragHandleProps: React.HTMLAttributes<HTMLElement>
  isDragging?: boolean
}

function isMatchingSearch(node: TreeNode, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  if (node.nameVi.toLowerCase().includes(q) || node.code.toLowerCase().includes(q)) return true
  return node.children.some(c => isMatchingSearch(c, query))
}

function NodeRow({
  node, siblings, expanded, onToggleExpand,
  editingCode, editValue, onStartEdit, onEditChange, onEditSubmit, onEditCancel,
  onToggleActive, onMove, searchQuery, depth, dragHandleProps, isDragging,
}: NodeRowProps) {
  if (searchQuery && !isMatchingSearch(node, searchQuery)) return null

  const isExpanded = expanded.has(node.code)
  const hasChildren = node.children.length > 0
  const isEditing = editingCode === node.code
  const sibIdx = siblings.findIndex(s => s.code === node.code)
  const canMoveUp = sibIdx > 0
  const canMoveDown = sibIdx < siblings.length - 1

  return (
    <div className={cn(isDragging && 'opacity-50')}>
      <div
        className={cn(
          'group flex items-center gap-1 py-1 px-2 rounded-md hover:bg-muted/50 transition-colors',
          !node.isActive && 'opacity-50',
        )}
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        {/* Drag handle */}
        <span
          {...dragHandleProps}
          className="w-4 h-4 flex items-center justify-center shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Kéo để sắp xếp"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        {/* Expand / collapse */}
        <button
          className="w-5 h-5 flex items-center justify-center shrink-0 text-muted-foreground"
          onClick={() => hasChildren && onToggleExpand(node.code)}
          disabled={!hasChildren}
          aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
        >
          {hasChildren
            ? isExpanded
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />
            : <span className="w-3.5" />
          }
        </button>

        {/* Code badge */}
        <span className="font-mono text-xs text-muted-foreground w-28 shrink-0 truncate">
          {node.code}
        </span>

        {/* Name — inline edit or display */}
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              autoFocus
              value={editValue}
              onChange={e => onEditChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onEditSubmit()
                if (e.key === 'Escape') onEditCancel()
              }}
              className="h-7 text-sm py-0"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEditSubmit}>
              <Check className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEditCancel}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <span className="flex-1 text-sm truncate">
            {node.nameVi}
            {node.shortName && (
              <span className="ml-1 text-xs text-muted-foreground">({node.shortName})</span>
            )}
          </span>
        )}

        {/* Status badge */}
        <Badge variant={node.isActive ? 'outline' : 'secondary'} className="text-xs shrink-0">
          {node.isActive ? 'Active' : 'Inactive'}
        </Badge>

        {/* Actions — visible on hover */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Sửa tên"
              onClick={() => onStartEdit(node.code, node.nameVi)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6"
              title={node.isActive ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
              onClick={() => onToggleActive(node.code)}>
              <ToggleLeft className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Di lên"
              disabled={!canMoveUp} onClick={() => onMove(node.code, 'up')}>
              <MoveUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Di xuống"
              disabled={!canMoveDown} onClick={() => onMove(node.code, 'down')}>
              <MoveDown className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Children — wrapped in SortableContext for same-level DnD */}
      {isExpanded && node.children.length > 0 && (
        <SortableChildList
          nodes={node.children}
          parentSiblings={node.children}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          editingCode={editingCode}
          editValue={editValue}
          onStartEdit={onStartEdit}
          onEditChange={onEditChange}
          onEditSubmit={onEditSubmit}
          onEditCancel={onEditCancel}
          onToggleActive={onToggleActive}
          onMove={onMove}
          searchQuery={searchQuery}
          depth={depth + 1}
        />
      )}
    </div>
  )
}

// ─── SortableItem wrapper ─────────────────────────────────────────────────────

type SortableItemProps = Omit<NodeRowProps, 'dragHandleProps' | 'isDragging'>

function SortableItem(props: SortableItemProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id: props.node.code })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <NodeRow
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  )
}

// ─── SortableChildList ────────────────────────────────────────────────────────
// Wraps a sibling group in its own SortableContext.

type ChildListProps = Omit<SortableItemProps, 'node' | 'siblings'> & {
  nodes: TreeNode[]
  parentSiblings: TreeNode[]
}

function SortableChildList({ nodes, parentSiblings, ...rest }: ChildListProps) {
  return (
    <SortableContext items={nodes.map(n => n.code)} strategy={verticalListSortingStrategy}>
      {nodes.map(node => (
        <SortableItem
          key={node.code}
          node={node}
          siblings={parentSiblings}
          {...rest}
        />
      ))}
    </SortableContext>
  )
}

// ─── TreeView ─────────────────────────────────────────────────────────────────

export function TreeView({ items, onEdit, onToggle, onReorder, saving = false }: TreeViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [localTree, setLocalTree] = useState<TreeNode[]>(() => buildTree(items))
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  useEffect(() => {
    setLocalTree(buildTree(items))
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const toggleExpand = useCallback((code: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }, [])

  const expandAll = () => {
    const allCodes = new Set<string>()
    function collect(nodes: TreeNode[]) {
      nodes.forEach(n => { allCodes.add(n.code); collect(n.children) })
    }
    collect(localTree)
    setExpanded(allCodes)
  }

  const collapseAll = () => setExpanded(new Set())

  // ── Inline edit ────────────────────────────────────────────────────────────
  const startEdit = (code: string, current: string) => {
    setEditingCode(code)
    setEditValue(current)
  }
  const cancelEdit = () => { setEditingCode(null); setEditValue('') }
  const submitEdit = async () => {
    if (!editingCode || !editValue.trim()) return
    const code = editingCode
    const val = editValue.trim()
    cancelEdit()
    function updateName(nodes: TreeNode[]): TreeNode[] {
      return nodes.map(n =>
        n.code === code
          ? { ...n, nameVi: val, children: updateName(n.children) }
          : { ...n, children: updateName(n.children) }
      )
    }
    setLocalTree(prev => updateName(prev))
    await onEdit(code, val)
  }

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggle = async (code: string) => {
    function toggleNode(nodes: TreeNode[]): TreeNode[] {
      return nodes.map(n =>
        n.code === code
          ? { ...n, isActive: !n.isActive, children: toggleNode(n.children) }
          : { ...n, children: toggleNode(n.children) }
      )
    }
    setLocalTree(prev => toggleNode(prev))
    await onToggle(code)
  }

  // ── Sort: Up/Down ──────────────────────────────────────────────────────────
  const handleMove = async (code: string, direction: 'up' | 'down') => {
    const newTree = swapSiblings(localTree, code, direction)
    setLocalTree(newTree)
    await onReorder(flattenCodes(newTree))
  }

  // ── Sort: drag-drop ────────────────────────────────────────────────────────
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDragId(String(active.id))
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveDragId(null)
    if (!over || active.id === over.id) return
    const activeCode = String(active.id)
    const overCode = String(over.id)

    // Find parent of both items; only allow reorder within same parent
    function parentOf(code: string, nodes: TreeNode[], parent: string | null = null): string | null | undefined {
      for (const n of nodes) {
        if (n.code === code) return parent
        const found = parentOf(code, n.children, n.code)
        if (found !== undefined) return found
      }
      return undefined
    }

    const activeParent = parentOf(activeCode, localTree)
    const overParent = parentOf(overCode, localTree)
    if (activeParent !== overParent) return // cross-level drag: discard

    const newTree = reorderSiblings(localTree, activeCode, overCode)
    setLocalTree(newTree)
    await onReorder(flattenCodes(newTree))
  }

  // Find the active drag node for DragOverlay
  const activeDragNode = activeDragId
    ? (() => {
        function find(nodes: TreeNode[]): TreeNode | null {
          for (const n of nodes) {
            if (n.code === activeDragId) return n
            const found = find(n.children)
            if (found) return found
          }
          return null
        }
        return find(localTree)
      })()
    : null

  const rootCount = localTree.length
  const totalCount = items.length

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-2">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Tìm kiếm mã hoặc tên..."
            className="w-56 h-8 text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={expandAll}>Mở rộng tất cả</Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>Thu gọn tất cả</Button>
          {saving && <span className="text-xs text-muted-foreground">Đang lưu...</span>}
          <span className="ml-auto text-xs text-muted-foreground">
            {rootCount} gốc / {totalCount} mục
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Kéo tay cầm <GripVertical className="inline h-3 w-3" /> để sắp xếp trong cùng cấp. Hover để chỉnh sửa tên hoặc toggle trạng thái.
        </p>

        {/* Root-level sortable list */}
        <div className="border rounded-md py-1">
          {localTree.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Không có dữ liệu</p>
          ) : (
            <SortableContext items={localTree.map(n => n.code)} strategy={verticalListSortingStrategy}>
              {localTree.map(node => (
                <SortableItem
                  key={node.code}
                  node={node}
                  siblings={localTree}
                  expanded={expanded}
                  onToggleExpand={toggleExpand}
                  editingCode={editingCode}
                  editValue={editValue}
                  onStartEdit={startEdit}
                  onEditChange={setEditValue}
                  onEditSubmit={submitEdit}
                  onEditCancel={cancelEdit}
                  onToggleActive={handleToggle}
                  onMove={handleMove}
                  searchQuery={searchQuery}
                  depth={0}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </div>

      {/* Drag overlay — ghost element shown under cursor while dragging */}
      <DragOverlay>
        {activeDragNode && (
          <div className="flex items-center gap-1 py-1 px-2 rounded-md bg-background border shadow-lg text-sm opacity-90">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground w-28 truncate">
              {activeDragNode.code}
            </span>
            <span className="truncate">{activeDragNode.nameVi}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
