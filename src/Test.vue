<template>
  <canvas ref="canvas" width="800" height="500"></canvas>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { DijkstraState, Edge, Graph } from './dijkstra.composable'

/**
 * NOTE:
 * - This component expects your DijkstraState to possibly include:
 *    isDone?: boolean
 *    endId?: string  // optional, used to highlight the final path when done
 *
 * - It treats the graph as undirected for rendering.
 */

const props = defineProps<{
  graph: Graph
  state?: DijkstraState
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

function edgeKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function buildPositions(graph: Graph, width: number, height: number) {
  const ids = Object.keys(graph.vertices)
  const positions: Record<string, { x: number; y: number }> = {}
  const radius = Math.min(width, height) / 2 - 60
  const cx = width / 2
  const cy = height / 2
  const step = (2 * Math.PI) / Math.max(1, ids.length)
  ids.forEach((id, i) => {
    positions[id] = {
      x: cx + radius * Math.cos(i * step),
      y: cy + radius * Math.sin(i * step),
    }
  })
  return positions
}

// builds set of undirected edges that are used in the "previous" tree
function buildShortestTreeEdges(previous: Record<string, string | null> | undefined) {
  const set = new Set<string>()
  if (!previous) return set
  for (const v in previous) {
    const p = previous[v]
    if (p) set.add(edgeKey(v, p))
  }
  return set
}

// builds list of edges along the path from endId -> ... -> null using previous
function buildPathEdgesFromEnd(
  endId: string | undefined,
  previous: Record<string, string | null> | undefined,
) {
  const pathEdges = new Set<string>()
  if (!endId || !previous) return pathEdges
  let cur: string | null = endId
  while (cur && previous[cur]) {
    const p = previous[cur] as string
    pathEdges.add(edgeKey(cur, p))
    cur = previous[cur]
  }
  return pathEdges
}

function drawGraph(graph: Graph, state?: DijkstraState & { isDone?: boolean; endId?: string }) {
  const cvs = canvas.value
  if (!cvs) return
  const ctx = cvs.getContext('2d')
  if (!ctx) return

  const W = cvs.width
  const H = cvs.height

  ctx.clearRect(0, 0, W, H)

  const positions = buildPositions(graph, W, H)
  const radius = 22

  // shortest-tree edges (from previous) — undirected keys
  const treeEdges = buildShortestTreeEdges(state?.previous)
  // path to end if provided
  const finalPathEdges = state?.isDone
    ? buildPathEdgesFromEnd(state?.endId, state?.previous)
    : new Set<string>()

  // helper: check if an edge (any orientation) is marked (tree / final path)
  function isTreeEdge(e: Edge) {
    return treeEdges.has(edgeKey(e.from, e.to))
  }
  function isFinalPathEdge(e: Edge) {
    return finalPathEdges.has(edgeKey(e.from, e.to))
  }
  function isCurrentEdge(e: Edge) {
    if (!state?.currentEdge) return false
    const ce = state.currentEdge
    return edgeKey(ce.from, ce.to) === edgeKey(e.from, e.to)
  }

  // draw edges (undirected)
  for (const edge of graph.edges) {
    const a = positions[edge.from]
    const b = positions[edge.to]
    if (!a || !b) continue

    // style priority: finalPath > currentEdge > tree > normal
    if (isFinalPathEdge(edge)) {
      ctx.strokeStyle = '#2ecc71' // bright green for final path
      ctx.lineWidth = 4
    } else if (isCurrentEdge(edge)) {
      ctx.strokeStyle = '#ff6b6b' // red-ish for current edge
      ctx.lineWidth = 3
    } else if (isTreeEdge(edge)) {
      ctx.strokeStyle = '#4caf50' // green for tree edges
      ctx.lineWidth = 2.5
      ctx.setLineDash([6, 4]) // make tree slightly dashed
    } else {
      ctx.strokeStyle = '#bdbdbd'
      ctx.lineWidth = 1.5
      ctx.setLineDash([])
    }

    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.setLineDash([])

    // edge cost label (slightly offset from midpoint)
    const midX = (a.x + b.x) / 2
    const midY = (a.y + b.y) / 2
    ctx.fillStyle = '#111'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(edge.cost), midX + 8, midY + 8)
  }

  // draw vertices
  for (const id of Object.keys(graph.vertices)) {
    const p = positions[id]
    if (!p) continue
    const isCurrent = state?.currentVertex === id
    const isEndHighlighted = state?.isDone && state?.endId === id
    const hasPrev = !!state?.previous?.[id]

    // node fill priority: endHighlight > current > reachable > normal
    if (isEndHighlighted) {
      ctx.fillStyle = '#16a085' // teal-ish for final end
    } else if (isCurrent) {
      ctx.fillStyle = '#ffd93d' // yellow for current
    } else if (hasPrev) {
      ctx.fillStyle = '#90caf9' // light blue for discovered/reachable
    } else {
      ctx.fillStyle = '#4dabf7' // default blue
    }

    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fill()

    // border
    ctx.lineWidth = 2
    ctx.strokeStyle = '#222'
    ctx.stroke()

    // id label
    ctx.fillStyle = '#000'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(id, p.x, p.y)

    // distance below node (if known)
    if (
      state?.distances &&
      state.distances[id] !== undefined &&
      Number.isFinite(state.distances[id])
    ) {
      ctx.font = '11px sans-serif'
      ctx.fillStyle = '#222'
      ctx.fillText(String(state.distances[id]), p.x, p.y + radius + 14)
    }
  }

  // optionally: draw arrows for final path direction (if endId exists)
  if (state?.isDone && state?.endId && state.previous) {
    // traverse from endId back and draw small arrowheads toward parent
    let cur: string | null = state.endId
    while (cur && state.previous[cur]) {
      const parent = state.previous[cur] as string
      const a = positions[cur]
      const b = positions[parent]
      if (!a || !b) break

      // draw small arrowhead at midpoint pointing to parent
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      // compute direction
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.hypot(dx, dy) || 1
      const ux = dx / len
      const uy = dy / len
      // base of arrow
      const baseX = mx - ux * 8
      const baseY = my - uy * 8
      ctx.beginPath()
      ctx.moveTo(mx, my)
      ctx.lineTo(baseX + -uy * 6, baseY + ux * 6)
      ctx.lineTo(baseX + uy * 6, baseY + -ux * 6)
      ctx.closePath()
      ctx.fillStyle = '#2ecc71'
      ctx.fill()

      cur = parent
    }
  }
}

onMounted(() => {
  drawGraph(props.graph, props.state)
})

watch(
  () => props.state,
  () => drawGraph(props.graph, props.state),
  { deep: true },
)
watch(
  () => props.graph,
  () => drawGraph(props.graph, props.state),
  { deep: true },
)
</script>
