'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DataLineage } from '@/lib/data-governance';
import { Database, GitBranch, Brain, FileCode, Box } from 'lucide-react';

interface LineageGraphProps {
  lineage: DataLineage;
  onNodeClick?: (node: any) => void;
  selectedNodeId?: string;
}

const nodeTypes = {
  custom: CustomNode,
};

function CustomNode({ data }: any) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'dataset':
        return <Database className="h-4 w-4" />;
      case 'process':
        return <GitBranch className="h-4 w-4" />;
      case 'model':
        return <Brain className="h-4 w-4" />;
      case 'source':
        return <FileCode className="h-4 w-4" />;
      case 'output':
        return <Box className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'dataset':
        return 'bg-blue-500 border-blue-600';
      case 'process':
        return 'bg-green-500 border-green-600';
      case 'model':
        return 'bg-purple-500 border-purple-600';
      case 'source':
        return 'bg-orange-500 border-orange-600';
      case 'output':
        return 'bg-pink-500 border-pink-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 shadow-md ${
        data.isSelected ? 'ring-2 ring-primary' : ''
      } ${getColor(data.type)} text-white min-w-[150px]`}
    >
      <div className="flex items-center gap-2">
        {getIcon(data.type)}
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-90 mt-1">{data.type}</div>
    </div>
  );
}

export default function LineageGraph({
  lineage,
  onNodeClick,
  selectedNodeId,
}: LineageGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert lineage data to ReactFlow nodes and edges
  useEffect(() => {
    if (!lineage) return;

    // Create a layout for the graph (simple hierarchical layout)
    const nodeMap = new Map();
    const levels = new Map<string, number>();

    // First pass: determine levels
    lineage.nodes.forEach((node) => {
      nodeMap.set(node.id, node);
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    });

    // Calculate levels based on edges
    lineage.edges.forEach((edge) => {
      const fromLevel = levels.get(edge.from) || 0;
      const toLevel = levels.get(edge.to) || 0;
      if (toLevel <= fromLevel) {
        levels.set(edge.to, fromLevel + 1);
      }
    });

    // Get nodes at each level
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, nodeId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(nodeId);
    });

    // Create ReactFlow nodes with positions
    const flowNodes: Node[] = [];
    const horizontalSpacing = 250;
    const verticalSpacing = 150;

    levelGroups.forEach((nodeIds, level) => {
      nodeIds.forEach((nodeId, index) => {
        const node = nodeMap.get(nodeId);
        if (!node) return;

        const xOffset = (index - (nodeIds.length - 1) / 2) * horizontalSpacing;
        const yPosition = level * verticalSpacing;

        flowNodes.push({
          id: node.id,
          type: 'custom',
          position: { x: xOffset, y: yPosition },
          data: {
            label: node.name,
            type: node.type,
            metadata: node.metadata,
            isSelected: node.id === selectedNodeId,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      });
    });

    // Create ReactFlow edges
    const flowEdges: Edge[] = lineage.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.from,
      target: edge.to,
      type: ConnectionLineType.SmoothStep,
      animated: true,
      label: edge.operation,
      labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 600 },
      labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: 0.8 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(var(--muted-foreground))',
      },
      style: {
        stroke: 'hsl(var(--muted-foreground))',
        strokeWidth: 2,
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [lineage, selectedNodeId, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      if (onNodeClick) {
        const originalNode = lineage.nodes.find((n) => n.id === node.id);
        onNodeClick(originalNode);
      }
    },
    [lineage, onNodeClick]
  );

  return (
    <div className="w-full h-[600px] border rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
