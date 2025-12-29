'use client'

import { useMemo, useCallback, useEffect, useRef } from 'react'
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
  ReactFlowInstance,
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'

import { useDevices } from '@/hooks/useDevices'
import { useClients } from '@/hooks/useDevices'
import { useDiagram } from '@/contexts/DiagramContext'
import { GlassCard } from './ui/GlassCard'
import { PortTooltip } from './PortTooltip'
import { APTooltip } from './APTooltip'
import { formatSpeed } from '@/lib/utils'
import type { UnifiDevice, UnifiPort, UnifiClient } from '@/lib/types'

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
function DeviceNodeWithPorts({ data }: { data: { device: UnifiDevice; hasIssues: boolean; connectedPorts: Set<number>; isHighlighted?: boolean; clients: UnifiClient[] } }) {
  const { device, hasIssues, connectedPorts, isHighlighted, clients } = data

  // check for critical issues (overheating, high errors)
  const hasCriticalIssue = device.overheating ||
    device.port_table?.some(p => p.rx_errors > 10000 || (p.sfp_temperature && parseFloat(p.sfp_temperature) > 80))

  const bgColor = device.state !== 1
    ? 'bg-gray-800/80'
    : hasCriticalIssue
    ? 'bg-red-900/40'
    : hasIssues
    ? 'bg-amber-900/40'
    : 'bg-green-900/30'

  const borderColor = device.state !== 1
    ? 'border-gray-600'
    : hasCriticalIssue
    ? 'border-red-500/70'
    : hasIssues
    ? 'border-amber-500/50'
    : 'border-green-500/50'

  // pulsing effect for issues
  const pulseClass = hasCriticalIssue
    ? 'animate-pulse shadow-lg shadow-red-500/30'
    : hasIssues
    ? 'animate-[pulse_3s_ease-in-out_infinite] shadow-md shadow-amber-500/20'
    : ''

  // highlight styling when zoomed to from alert
  const highlightClass = isHighlighted
    ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-gray-900 animate-pulse'
    : ''

  const icon = device.type === 'usw'
    ? '[SW]'
    : device.type === 'uap'
    ? '[AP]'
    : '[GW]'

  // get active ports for switches
  const activePorts = device.port_table?.filter(p => p.up) || []
  const sfpPorts = device.port_table?.filter(p => p.media === 'SFP+' || p.name?.includes('SFP')) || []
  const regularPorts = device.port_table?.filter(p => p.media !== 'SFP+' && !p.name?.includes('SFP')) || []

  // render AP as circular node
  if (device.type === 'uap') {
    return (
      <APTooltip device={device}>
        <div className={`${bgColor} ${borderColor} ${highlightClass} ${pulseClass} border rounded-full w-[120px] h-[120px] flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300 cursor-pointer`}>
          <Handle type="target" position={Position.Top} className="!bg-gray-500 !w-2 !h-2" />
          <Handle type="source" position={Position.Bottom} className="!bg-gray-500 !w-2 !h-2" />
          <span className="font-mono text-gray-400 text-[9px]">{icon}</span>
          <p className="font-medium text-white text-xs text-center px-2 truncate max-w-[100px]">{device.name}</p>
          <p className="text-[9px] text-gray-400">{device.model}</p>
          <p className="text-[8px] text-gray-500">{device.ip}</p>
          {device.general_temperature && (
            <p className={`text-[8px] ${device.general_temperature > 50 ? 'text-amber-400' : 'text-gray-500'}`}>
              {device.general_temperature}C
            </p>
          )}
        </div>
      </APTooltip>
    )
  }

  // render switches and gateways as rectangular nodes with ports
  return (
    <div className={`${bgColor} ${borderColor} ${highlightClass} ${pulseClass} border rounded-lg px-3 py-2 min-w-[200px] backdrop-blur-sm transition-all duration-300`}>
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

      {/* port grid for switches and gateways */}
      {(device.type === 'usw' || device.type === 'udm' || device.type === 'ugw') && device.port_table && (
        <div className="space-y-1.5">
          {/* regular ports */}
          {regularPorts.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-0.5">
                {regularPorts.slice(0, 16).map(port => (
                  <PortTooltip key={port.port_idx} port={port} device={device} clients={clients}>
                    <div
                      className={`w-4 h-4 rounded text-[8px] flex items-center justify-center font-mono cursor-pointer hover:ring-1 hover:ring-cyan-400/50 transition-all ${
                        connectedPorts.has(port.port_idx)
                          ? 'ring-1 ring-white/50'
                          : ''
                      }`}
                      style={{
                        backgroundColor: port.up ? getSpeedColor(port.speed) + '40' : '#1f2937',
                        borderLeft: `2px solid ${port.up ? getSpeedColor(port.speed) : '#374151'}`,
                      }}
                    >
                      {port.port_idx}
                    </div>
                  </PortTooltip>
                ))}
              </div>
            </div>
          )}

          {/* sfp ports */}
          {sfpPorts.length > 0 && (
            <div className="flex gap-1">
              {sfpPorts.map(port => (
                <PortTooltip key={port.port_idx} port={port} device={device} clients={clients}>
                  <div
                    className={`px-1.5 py-0.5 rounded text-[8px] font-mono cursor-pointer hover:ring-1 hover:ring-cyan-400/50 transition-all ${
                      connectedPorts.has(port.port_idx)
                        ? 'ring-1 ring-white/50'
                        : ''
                    }`}
                    style={{
                      backgroundColor: port.up ? getSpeedColor(port.speed) + '40' : '#1f2937',
                      borderLeft: `2px solid ${port.up ? getSpeedColor(port.speed) : '#374151'}`,
                    }}
                  >
                    S{port.port_idx - (regularPorts.length || 0)}
                  </div>
                </PortTooltip>
              ))}
            </div>
          )}
        </div>
      )}

      {/* stats row */}
      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-gray-400">
        <span>{device.model}</span>
        {(device.type === 'usw' || device.type === 'udm' || device.type === 'ugw') && device.port_table && (
          <span>{activePorts.length}/{device.port_table.length} ports</span>
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

// calculate node dimensions based on port count
function getNodeDimensions(device: UnifiDevice): { width: number; height: number } {
  // APs are circular
  if (device.type === 'uap') {
    return { width: 120, height: 120 }
  }
  // switches and gateways with ports
  if ((device.type === 'usw' || device.type === 'udm' || device.type === 'ugw') && device.port_table) {
    const portCount = device.port_table.length
    // width scales with port count (16 ports = ~280px, 48 ports = ~350px)
    const width = Math.max(250, 200 + Math.ceil(portCount / 8) * 25)
    const height = 140
    return { width, height }
  }
  // fallback
  return { width: 200, height: 80 }
}

// dagre layout
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  // increased nodesep to prevent horizontal overlap
  g.setGraph({ rankdir: direction, ranksep: 150, nodesep: 120 })

  nodes.forEach((node) => {
    const { width, height } = getNodeDimensions(node.data.device)
    g.setNode(node.id, { width, height })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    const { width, height } = getNodeDimensions(node.data.device)
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

function buildTopology(devices: UnifiDevice[], clients: UnifiClient[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // track which ports are used for uplinks
  const connectedPortsMap = new Map<string, Set<number>>()
  devices.forEach(d => connectedPortsMap.set(d._id, new Set()))

  // create edges first to know connected ports
  devices.forEach((device) => {
    if (device.last_uplink) {
      const isMesh = device.last_uplink.type === 'wireless'

      // for mesh APs, use device.uplink.uplink_device_name (last_uplink shows "N/A")
      const parentDeviceName = isMesh
        ? device.uplink?.uplink_device_name
        : device.last_uplink.uplink_device_name

      const parentDevice = devices.find((d) => d.name === parentDeviceName)

      if (parentDevice) {
        const remotePort = device.last_uplink.uplink_remote_port
        const localPort = device.last_uplink.port_idx

        // mark ports as connected (only for wired connections)
        if (!isMesh) {
          connectedPortsMap.get(parentDevice._id)?.add(remotePort)
          connectedPortsMap.get(device._id)?.add(localPort)
        }

        // get link speed and signal info
        const uplinkPort = parentDevice.port_table?.find(
          (p) => p.port_idx === remotePort
        )
        const speed = isMesh ? (device.uplink?.tx_rate || device.last_uplink.speed || 0) : (uplinkPort?.speed || 0)
        const rssi = device.uplink?.rssi
        const signal = device.uplink?.signal
        const channel = device.uplink?.channel

        // build speed label with mesh signal info
        let speedLabel: string
        if (isMesh) {
          const rateLabel = device.uplink?.tx_rate_label || (speed > 0 ? formatSpeed(speed / 1000) : 'Mesh')
          const signalInfo = rssi ? ` ${rssi}dBm` : (signal ? ` ${signal}%` : '')
          const channelInfo = channel ? ` ch${channel}` : ''
          speedLabel = `${rateLabel}${signalInfo}${channelInfo}`
        } else {
          speedLabel = formatSpeed(speed)
        }

        const color = isMesh ? '#06b6d4' : getSpeedColor(speed) // cyan for mesh

        // build label
        const label = isMesh
          ? `~~ ${speedLabel} ~~`
          : `P${remotePort} -- ${speedLabel} -- P${localPort}`

        edges.push({
          id: `${parentDevice._id}-${device._id}`,
          source: parentDevice._id,
          target: device._id,
          label,
          style: {
            stroke: color,
            strokeWidth: isMesh ? 2 : (speed >= 10000 ? 3 : speed >= 2500 ? 2.5 : 2),
            strokeDasharray: isMesh ? '8 4' : undefined, // dashed for mesh
          },
          labelStyle: { fill: '#e5e7eb', fontSize: 10, fontFamily: 'monospace' },
          labelBgStyle: { fill: isMesh ? '#164e63' : '#1e293b', fillOpacity: 0.9 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: color,
            width: 15,
            height: 15,
          },
          animated: isMesh || speed >= 10000, // animate mesh links
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
        clients,
      },
    })
  })

  return getLayoutedElements(nodes, edges)
}

export function NetworkDiagram() {
  const { data, isLoading, error } = useDevices()
  const { data: clientsData } = useClients()
  const { setReactFlowInstance, highlightedNodeId } = useDiagram()

  // track previous data to detect actual data changes vs highlight-only changes
  const prevDevicesRef = useRef<string | null>(null)

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!data?.devices) return { initialNodes: [], initialEdges: [] }
    const clients = clientsData?.clients || []
    const { nodes, edges } = buildTopology(data.devices, clients)
    return { initialNodes: nodes, initialEdges: edges }
  }, [data?.devices, clientsData?.clients])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // update nodes when data changes (full rebuild) or highlight changes (preserve positions)
  useEffect(() => {
    if (initialNodes.length === 0) return

    // create a simple hash of device IDs to detect data changes
    const devicesHash = data?.devices?.map(d => d._id).join(',') || ''
    const isDataChange = prevDevicesRef.current !== devicesHash

    if (isDataChange) {
      // full rebuild - data actually changed
      const nodesWithHighlight = initialNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isHighlighted: node.id === highlightedNodeId,
        },
      }))
      setNodes(nodesWithHighlight)
      setEdges(initialEdges)
      prevDevicesRef.current = devicesHash
    } else {
      // highlight-only change - preserve positions
      setNodes(currentNodes =>
        currentNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isHighlighted: node.id === highlightedNodeId,
          },
        }))
      )
    }
  }, [initialNodes, initialEdges, highlightedNodeId, data?.devices, setNodes, setEdges])

  // store react flow instance for zoom control
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance)
  }, [setReactFlowInstance])

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
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#06b6d4' }} />
          <span className="text-gray-400">Mesh</span>
        </div>
      </div>

      <div className="h-[500px] rounded-lg overflow-hidden border border-white/10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
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
            className="!bg-gray-900/80 !border-white/10 !rounded-lg [&>button]:!bg-transparent [&>button]:!border-white/10 [&>button:hover]:!bg-white/10 [&>button>svg]:!fill-white [&>button>svg>path]:!fill-white"
          />
        </ReactFlow>
      </div>
    </GlassCard>
  )
}
