'use client';

/**
 * M13 – Workflow Canvas (React Flow)
 * Hiển thị steps dưới dạng nodes và transitions dưới dạng edges.
 * Chỉ visual — không xử lý business logic.
 */

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanvasStep {
  code: string;
  name: string;
  stepType: string;
  orderIndex: number;
}

export interface CanvasTransition {
  fromStepCode: string;
  toStepCode: string;
  actionCode: string;
  priority?: number;
}

interface WorkflowCanvasProps {
  steps: CanvasStep[];
  transitions: CanvasTransition[];
  selectedStepCode: string | null;
  onSelectStep: (code: string | null) => void;
  /** Khi người dùng kéo edge giữa 2 nodes → tạo transition mới */
  onConnectNodes: (fromCode: string, toCode: string) => void;
  readonly?: boolean;
}

// ---------------------------------------------------------------------------
// Node colors by stepType
// ---------------------------------------------------------------------------

const STEP_TYPE_STYLE: Record<string, { bg: string; border: string; label: string }> = {
  START:     { bg: 'bg-green-100',  border: 'border-green-500', label: 'text-green-800' },
  TASK:      { bg: 'bg-blue-50',    border: 'border-blue-400',  label: 'text-blue-800' },
  APPROVAL:  { bg: 'bg-violet-50',  border: 'border-violet-400', label: 'text-violet-800' },
  SIGNATURE: { bg: 'bg-teal-50',    border: 'border-teal-400',  label: 'text-teal-800' },
  END:       { bg: 'bg-red-100',    border: 'border-red-500',   label: 'text-red-800' },
};

const STEP_TYPE_LABELS: Record<string, string> = {
  START:     'BẮT ĐẦU',
  TASK:      'Tác vụ',
  APPROVAL:  'Phê duyệt',
  SIGNATURE: 'Ký số',
  END:       'KẾT THÚC',
};

// ---------------------------------------------------------------------------
// Custom Node
// ---------------------------------------------------------------------------

function StepNode({ data }: { data: { label: string; stepType: string; selected: boolean } }) {
  const cfg = STEP_TYPE_STYLE[data.stepType] ?? STEP_TYPE_STYLE['TASK'];
  const isTerminal = data.stepType === 'START' || data.stepType === 'END';

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border-2 min-w-[120px] text-center transition-all',
        cfg.bg,
        cfg.border,
        data.selected && 'ring-2 ring-offset-1 ring-blue-400',
        isTerminal && 'rounded-full min-w-[80px]'
      )}
    >
      {/* Only show target handle for non-START nodes */}
      {data.stepType !== 'START' && (
        <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      )}
      <div className={cn('text-[10px] font-bold uppercase tracking-wide', cfg.label)}>
        {STEP_TYPE_LABELS[data.stepType] ?? data.stepType}
      </div>
      <div className="text-xs font-medium mt-0.5 text-gray-700 leading-tight">
        {data.label}
      </div>
      {/* Only show source handle for non-END nodes */}
      {data.stepType !== 'END' && (
        <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = { stepNode: StepNode };

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

const NODE_X_GAP = 200;
const NODE_Y_BASE = 80;

function buildNodesAndEdges(
  steps: CanvasStep[],
  transitions: CanvasTransition[],
  selectedStepCode: string | null
): { nodes: Node[]; edges: Edge[] } {
  // Layout: arrange steps in a vertical chain by orderIndex
  // Group by columns if needed (simple linear for now)
  const sorted = [...steps].sort((a, b) => a.orderIndex - b.orderIndex);

  const nodes: Node[] = sorted.map((step, idx) => ({
    id: step.code,
    type: 'stepNode',
    position: { x: 80 + (idx % 4) * NODE_X_GAP, y: NODE_Y_BASE + Math.floor(idx / 4) * 150 },
    data: {
      label: step.name,
      stepType: step.stepType,
      selected: step.code === selectedStepCode,
    },
    selectable: true,
  }));

  const edges: Edge[] = transitions.map((t, idx) => ({
    id: `e-${t.fromStepCode}-${t.toStepCode}-${t.actionCode}-${idx}`,
    source: t.fromStepCode,
    target: t.toStepCode,
    label: t.actionCode,
    animated: t.actionCode === 'APPROVE',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#6b7280', strokeWidth: 1.5 },
    labelStyle: { fontSize: 10, fill: '#374151' },
    labelBgStyle: { fill: '#f9fafb', fillOpacity: 0.9 },
  }));

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkflowCanvas({
  steps,
  transitions,
  selectedStepCode,
  onSelectStep,
  onConnectNodes,
  readonly = false,
}: WorkflowCanvasProps) {
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildNodesAndEdges(steps, transitions, selectedStepCode),
    [steps, transitions, selectedStepCode]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      if (readonly) return;
      if (params.source && params.target) {
        onConnectNodes(params.source, params.target);
        setEdges((eds) => addEdge({ ...params, animated: false }, eds));
      }
    },
    [readonly, onConnectNodes, setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectStep(node.id === selectedStepCode ? null : node.id);
    },
    [onSelectStep, selectedStepCode]
  );

  const onPaneClick = useCallback(() => {
    onSelectStep(null);
  }, [onSelectStep]);

  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
        Thêm bước ở panel bên trái để bắt đầu thiết kế quy trình.
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      deleteKeyCode={null} // disable delete key to avoid accidental node removal
    >
      <Controls />
      <MiniMap nodeStrokeWidth={3} zoomable pannable />
      <Background gap={16} size={1} />
    </ReactFlow>
  );
}
