<script setup lang="ts">
import type { DijkstraState, Graph, Id } from '@/dijkstra.composable'
import { onMounted, ref, watch } from 'vue'

interface Props {
  graph: Graph
  state: DijkstraState
  start: Id
  end: Id
}
const props = defineProps<Props>()

const canvas = ref<HTMLCanvasElement | null>(null)

const vertexPositions: Record<Id, { x: number; y: number }> = {
  A: { x: 50, y: 50 },
  B: { x: 350, y: 50 },
  C: { x: 50, y: 250 },
  D: { x: 350, y: 250 },
  E: { x: 200, y: 325 },
}

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 400, 400)

  // Draw edges
  for (const edge of props.graph.edges) {
    const from = vertexPositions[edge.from]
    const to = vertexPositions[edge.to]
    if (!from || !to) continue

    // Colors
    let color = '#aaa'
    const currentEdge = props.state.currentEdge
    if (
      (currentEdge?.from === edge.from && currentEdge?.to === edge.to) ||
      (currentEdge?.to === edge.from && currentEdge?.from === edge.to)
    ) {
      color = '#ff6b6b' // current edge
    } else if (props.state.previous[edge.to] === edge.from) {
      color = '#00b894' // shortest path edge
    }

    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()

    // Edge cost
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2
    ctx.fillStyle = '#333'
    ctx.font = '32px sans-serif'
    ctx.fillText(edge.cost.toString(), midX, midY)
  }

  // Draw vertices
  for (const id in props.graph.vertices) {
    const { x, y } = vertexPositions[id]!
    const isStart = id === props.start
    const isEnd = id === props.end
    const isCurrent = id === props.state.currentVertex

    let color = '#74b9ff'
    if (isCurrent) color = '#fdcb6e'
    else if (isEnd && props.state.isDone) color = '#00b894'
    else if (isStart) color = '#55efc4'
    else if (isEnd) color = '#a29bfe'

    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 30, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#2d3436'
    ctx.stroke()

    // Label
    ctx.fillStyle = '#2d3436'
    ctx.font = '32px sans-serif'
    ctx.fillText(id, x - 10, y + 11)

    // Distance
    const dist = props.state.distances[id]
    if (dist !== undefined) {
      ctx.font = '32px sans-serif'
      ctx.fillText(`d=${dist === Infinity ? '∞' : dist}`, x - 28, y + 55)
    }
  }
}

onMounted(draw)
watch(() => props.state, draw, { deep: true })
watch(() => props.graph, draw, { deep: true })
</script>

<template>
  <canvas ref="canvas" width="400" height="400" style="background-color: #eeeeff"></canvas>
</template>
