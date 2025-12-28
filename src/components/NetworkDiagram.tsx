'use client'

import { useMemo, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'

import { useDevices } from '@/hooks/useDevices'
import { GlassCard } from './ui/GlassCard'
import { formatSpeed, getDeviceTypeName } from '@/lib/utils'
import type { UnifiDevice } from '@/lib/types'

// dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 180
const nodeHeight = 80

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

// custom node component
function DeviceNode({ data }: { data: { device: UnifiDevice; hasIssues: boolean } }) {
  const { device, hasIssues } = data

  const bgColor = device.state !== 1
    ? 'bg-gray-800/80'
    : hasIssues
    ? 'bg-amber-900/40'
    : 'bg-green-900/30'

  const borderColor = device.state !== 1
    ? 'border-gray-600'
    : hasIssues
    ? 'border-amber-500/50'
    : 'border-green-500/50'

  const icon = device.type === 'usw'
    ? '[SW]'
    : device.type === 'uap'
    ? '[AP]'
    : '[GW]'

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded-lg px-3 py-2 min-w-[160px] backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-gray-400 text-sm">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm truncate">{device.name}</p>
          <p className="text-[10px] text-gray-400">{device.ip}</p>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px]">
        <span className="text-gray-500">{getDeviceTypeName(device.type)}</span>
        {device.general_temperature && (
          <span className={device.general_temperature > 50 ? 'text-amber-400' : 'text-gray-500'}>
            {device.general_temperature}C
          </span>
        )}
      </div>
    </div>
  )
}

const nodeTypes = {
  device: DeviceNode,
}

function buildTopology(devices: UnifiDevice[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const deviceMap = new Map<string, UnifiDevice>()

  // build device map by name and mac
  devices.forEach((d) => {
    deviceMap.set(d.name, d)
    deviceMap.set(d.mac, d)
  })

  // find gateway (root node) - device with no uplink or type ugw/udm
  const gateway = devices.find(
    (d) => d.type === 'ugw' || d.type === 'udm' || !d.last_uplink
  )

  // create nodes
  devices.forEach((device) => {
    const hasIssues =
      device.overheating ||
      device.upgradable ||
      device.port_table?.some(
        (p) => p.rx_errors > 100 || (p.sfp_temperature && parseFloat(p.sfp_temperature) > 70)
      )

    nodes.push({
      id: device._id,
      type: 'device',
      position: { x: 0, y: 0 },
      data: { device, hasIssues },
    })
  })

  // create edges from uplink data
  devices.forEach((device) => {
    if (device.last_uplink) {
      const parentDevice = devices.find(
        (d) => d.name === device.last_uplink?.uplink_device_name
      )

      if (parentDevice) {
        // determine link speed from the uplink port
        const uplinkPort = parentDevice.port_table?.find(
          (p) => p.port_idx === device.last_uplink?.uplink_remote_port
        )
        const speed = uplinkPort?.speed || 0

        edges.push({
          id: `${parentDevice._id}-${device._id}`,
          source: parentDevice._id,
          target: device._id,
          label: formatSpeed(speed),
          style: { stroke: speed >= 10000 ? '#22c55e' : speed >= 2500 ? '#3b82f6' : '#6b7280' },
          labelStyle: { fill: '#9ca3af', fontSize: 10 },
          labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 },
        })
      }
    }
  })

  return getLayoutedElements(nodes, edges)
}

export function NetworkDiagram() {
  const { data, isLoading, error } = useDevices()

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!data?.devices) return { initialNodes: [], initialEdges: [] }
    const { nodes, edges } = buildTopology(data.devices)
    return { initialNodes: nodes, initialEdges: edges }
  }, [data?.devices])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // update nodes when data changes
  useMemo(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes)
      setEdges(initialEdges)
    }
  }, [initialNodes, initialEdges, setNodes, setEdges])

  if (isLoading) {
    return (
      <GlassCard title="Network Topology">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading topology...</div>
        </div>
      </GlassCard>
    )
  }

  if (error) {
    return (
      <GlassCard title="Network Topology">
        <div className="h-96 flex items-center justify-center text-red-400">
          Failed to load topology
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard title="Network Topology" subtitle={`${nodes.length} devices`}>
      <div className="h-96 rounded-lg overflow-hidden border border-white/10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#374151" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="!bg-gray-900/80 !border-white/10 !rounded-lg [&>button]:!bg-transparent [&>button]:!border-white/10 [&>button:hover]:!bg-white/10"
          />
        </ReactFlow>
      </div>
    </GlassCard>
  )
}
