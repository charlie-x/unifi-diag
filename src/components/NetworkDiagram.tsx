'use client'

import { useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  Handle,
  Position,
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'

import { useDevices } from '@/hooks/useDevices'
import { useClients } from '@/hooks/useDevices'
import { GlassCard } from './ui/GlassCard'
import { formatSpeed, getDeviceTypeName } from '@/lib/utils'
import type { UnifiDevice, UnifiPort } from '@/lib/types'

// speed colour mapping
const speedColors: Record<string, string> = {
  '10G': '#22c55e',   // green
  '2.5G': '#3b82f6',  // blue
  '1G': '#a855f7',    // purple
  '100M': '#f59e0b',  // amber
  'Down': '#6b7280',  // gray
}

function getSpeedColor(speed: number): string {
  if (speed >= 10000) return speedColors['10G']
  if (speed >= 2500) return speedColors['2.5G']
  if (speed >= 1000) return speedColors['1G']
  if (speed > 0) return speedColors['100M']
  return speedColors['Down']
}

// port status component
function PortDot({ port, small }: { port: UnifiPort; small?: boolean }) {
  const hasErrors = port.rx_errors > 100
  const isHot = port.sfp_temperature && parseFloat(port.sfp_temperature) > 70

  let color = port.up ? getSpeedColor(port.speed) : '#374151'
  if (hasErrors || isHot) color = '#ef4444'

  const size = small ? 'w-2 h-2' : 'w-3 h-3'

  return (
    <div
      className={`${size} rounded-full`}
      style={{ backgroundColor: color }}
      title={`Port ${port.port_idx}: ${formatSpeed(port.speed)}${hasErrors ? ' (errors)' : ''}${isHot ? ' (hot)' : ''}`}
    />
  )
}

// device node with ports
function DeviceNodeWithPorts({ data }: { data: { device: UnifiDevice; hasIssues: boolean; connectedPorts: Set<number> } }) {
  const { device, hasIssues, connectedPorts } = data

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

  // get active ports for switches
  const activePorts = device.port_table?.filter(p => p.up) || []
  const sfpPorts = device.port_table?.filter(p => p.media === 'SFP+' || p.name?.includes('SFP')) || []
  const regularPorts = device.port_table?.filter(p => p.media !== 'SFP+' && !p.name?.includes('SFP')) || []

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg px-3 py-2 min-w-[200px] backdrop-blur-sm`}>
      {/* connection handles */}
      <Handle type="target" position={Position.Top} className="!bg-gray-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-500 !w-2 !h-2" />

      {/* header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-gray-400 text-sm">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm truncate">{device.name}</p>
          <p className="text-[10px] text-gray-400">{device.ip}</p>
        </div>
      </div>

      {/* port grid for switches */}
      {device.type === 'usw' && device.port_table && (
        <div className="space-y-1.5">
          {/* regular ports */}
          {regularPorts.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-0.5">
                {regularPorts.slice(0, 16).map(port => (
                  <div
                    key={port.port_idx}
                    className={`w-4 h-4 rounded text-[8px] flex items-center justify-center font-mono ${
                      connectedPorts.has(port.port_idx)
                        ? 'ring-1 ring-white/50'
                        : ''
                    }`}
                    style={{
                      backgroundColor: port.up ? getSpeedColor(port.speed) + '40' : '#1f2937',
                      borderLeft: `2px solid ${port.up ? getSpeedColor(port.speed) : '#374151'}`,
                    }}
                    title={`Port ${port.port_idx}: ${formatSpeed(port.speed)}`}
                  >
                    {port.port_idx}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* sfp ports */}
          {sfpPorts.length > 0 && (
            <div className="flex gap-1">
              {sfpPorts.map(port => (
                <div
                  key={port.port_idx}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono ${
                    connectedPorts.has(port.port_idx)
                      ? 'ring-1 ring-white/50'
                      : ''
                  }`}
                  style={{
                    backgroundColor: port.up ? getSpeedColor(port.speed) + '40' : '#1f2937',
                    borderLeft: `2px solid ${port.up ? getSpeedColor(port.speed) : '#374151'}`,
                  }}
                  title={`SFP ${port.port_idx}: ${formatSpeed(port.speed)}${port.sfp_temperature ? ` ${parseFloat(port.sfp_temperature).toFixed(0)}C` : ''}`}
                >
                  S{port.port_idx - (regularPorts.length || 0)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* stats row */}
      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-gray-400">
        <span>{getDeviceTypeName(device.type)}</span>
        {device.type === 'usw' && (
          <span>{activePorts.length}/{device.port_table?.length || 0} ports</span>
        )}
        {device.general_temperature && (
          <span className={device.general_temperature > 50 ? 'text-amber-400' : ''}>
            {device.general_temperature}C
          </span>
        )}
      </div>
    </div>
  )
}

const nodeTypes = {
  deviceWithPorts: DeviceNodeWithPorts,
}

// dagre layout
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, ranksep: 120, nodesep: 80 })

  nodes.forEach((node) => {
    const width = node.data.device.type === 'usw' ? 220 : 200
    const height = node.data.device.type === 'usw' ? 120 : 80
    g.setNode(node.id, { width, height })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    const width = node.data.device.type === 'usw' ? 220 : 200
    const height = node.data.device.type === 'usw' ? 120 : 80
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

function buildTopology(devices: UnifiDevice[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // track which ports are used for uplinks
  const connectedPortsMap = new Map<string, Set<number>>()
  devices.forEach(d => connectedPortsMap.set(d._id, new Set()))

  // create edges first to know connected ports
  devices.forEach((device) => {
    if (device.last_uplink) {
      const parentDevice = devices.find(
        (d) => d.name === device.last_uplink?.uplink_device_name
      )

      if (parentDevice) {
        const remotePort = device.last_uplink.uplink_remote_port
        const localPort = device.last_uplink.port_idx

        // mark ports as connected
        connectedPortsMap.get(parentDevice._id)?.add(remotePort)
        connectedPortsMap.get(device._id)?.add(localPort)

        // get link speed
        const uplinkPort = parentDevice.port_table?.find(
          (p) => p.port_idx === remotePort
        )
        const speed = uplinkPort?.speed || 0
        const speedLabel = formatSpeed(speed)
        const color = getSpeedColor(speed)

        edges.push({
          id: `${parentDevice._id}-${device._id}`,
          source: parentDevice._id,
          target: device._id,
          label: `P${remotePort} -- ${speedLabel} -- P${localPort}`,
          style: {
            stroke: color,
            strokeWidth: speed >= 10000 ? 3 : speed >= 2500 ? 2.5 : 2,
          },
          labelStyle: { fill: '#e5e7eb', fontSize: 10, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: color,
            width: 15,
            height: 15,
          },
          animated: speed >= 10000,
        })
      }
    }
  })

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
      type: 'deviceWithPorts',
      position: { x: 0, y: 0 },
      data: {
        device,
        hasIssues,
        connectedPorts: connectedPortsMap.get(device._id) || new Set(),
      },
    })
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
        <div className="h-[500px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading topology...</div>
        </div>
      </GlassCard>
    )
  }

  if (error) {
    return (
      <GlassCard title="Network Topology">
        <div className="h-[500px] flex items-center justify-center text-red-400">
          Failed to load topology
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard title="Network Topology" subtitle={`${nodes.length} devices`}>
      {/* legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded" style={{ backgroundColor: speedColors['10G'] }} />
          <span className="text-gray-400">10G</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded" style={{ backgroundColor: speedColors['2.5G'] }} />
          <span className="text-gray-400">2.5G</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded" style={{ backgroundColor: speedColors['1G'] }} />
          <span className="text-gray-400">1G</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded" style={{ backgroundColor: speedColors['100M'] }} />
          <span className="text-gray-400">100M</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded" style={{ backgroundColor: speedColors['Down'] }} />
          <span className="text-gray-400">Down</span>
        </div>
      </div>

      <div className="h-[500px] rounded-lg overflow-hidden border border-white/10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={2}
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
