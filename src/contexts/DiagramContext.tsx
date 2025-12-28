'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { ReactFlowInstance } from 'reactflow'

interface DiagramContextType {
  reactFlowInstance: ReactFlowInstance | null
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void
  zoomToNode: (nodeId: string) => void
  highlightedNodeId: string | null
}

const DiagramContext = createContext<DiagramContextType | null>(null)

export function DiagramProvider({ children }: { children: ReactNode }) {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null)

  const zoomToNode = useCallback((nodeId: string) => {
    if (!reactFlowInstance) return

    const node = reactFlowInstance.getNode(nodeId)
    if (!node) return

    // calculate centre of the node
    const x = node.position.x + (node.width || 200) / 2
    const y = node.position.y + (node.height || 100) / 2

    // zoom to node with animation
    reactFlowInstance.setCenter(x, y, { zoom: 1.5, duration: 800 })

    // highlight the node temporarily
    setHighlightedNodeId(nodeId)
    setTimeout(() => setHighlightedNodeId(null), 2000)
  }, [reactFlowInstance])

  return (
    <DiagramContext.Provider value={{
      reactFlowInstance,
      setReactFlowInstance,
      zoomToNode,
      highlightedNodeId,
    }}>
      {children}
    </DiagramContext.Provider>
  )
}

export function useDiagram() {
  const context = useContext(DiagramContext)
  if (!context) {
    throw new Error('useDiagram must be used within DiagramProvider')
  }
  return context
}
