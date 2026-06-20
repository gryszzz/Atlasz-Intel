/*
 * @xyflow/react relationship graph. This module is the ONLY place @xyflow/react
 * (and its stylesheet) is imported, and it is loaded lazily so the graph bundle
 * stays out of the app startup chunk — it loads only when the graph view opens.
 */
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export function RelationshipGraph({
  nodes,
  edges,
  onNodeClick,
}: {
  nodes: Node[]
  edges: Edge[]
  onNodeClick: (nodeId: string) => void
}) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      onNodeClick={(_event, node) => onNodeClick(node.id)}
      proOptions={{ hideAttribution: true }}
    >
      <MiniMap pannable zoomable nodeColor="#5eead4" maskColor="rgba(5, 6, 7, 0.72)" />
      <Controls />
      <Background color="#20302d" gap={22} />
    </ReactFlow>
  )
}
