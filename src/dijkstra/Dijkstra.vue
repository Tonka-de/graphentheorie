<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDijkstra, type Edge, type Graph } from '../dijkstra.composable'
import Renderer from './Renderer.vue'

const defaultGraph: Graph = {
  edges: [
    { from: 'A', to: 'B', cost: 2 },
    { from: 'A', to: 'C', cost: 1 },
    { from: 'B', to: 'C', cost: 3 },
    { from: 'B', to: 'D', cost: 2 },
    { from: 'C', to: 'D', cost: 10 },
    { from: 'C', to: 'E', cost: 3 },
  ],
  vertices: {
    A: { id: 'A' },
    B: { id: 'B' },
    C: { id: 'C' },
    D: { id: 'D' },
    E: { id: 'E' },
  },
}

const graph = ref(defaultGraph)

const { end, next, prev, reset, start, state } = useDijkstra(graph.value, 'A', 'D')

const speed = ref(500)

const visited = computed(() =>
  Object.keys(graph.value.vertices).filter((v) => !state.value.unvisted.has(v)),
)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runToEnd() {
  while (!state.value.isDone) {
    next()
    await sleep(speed.value)
  }
}

function handleResetDijkstra() {
  reset(graph.value, 'A', 'D')
}

function handleResetAll() {
  graph.value = defaultGraph
  reset(graph.value, 'A', 'D')
}

function updateCost(edge: Edge, event: Event) {
  // @ts-ignore
  const value = event.target!.value!
  const index = graph.value.edges.findIndex(
    (e) => e.from === edge.from && e.to === edge.to && e.cost === edge.cost,
  )
  if (index === -1) return
  graph.value.edges[index]!.cost = value
}

function randomize() {
  graph.value.edges = graph.value.edges.map((edge) => ({
    ...edge,
    cost: Math.floor(Math.random() * 11),
  }))
}
</script>

<template>
  <div class="container">
    <div class="controls">
      <button @click="randomize">Randomize Weights</button>
      <button @click="runToEnd">Run to End</button>
      <button @click="next">Next</button>
      <button @click="prev">Previous</button>
      <button @click="handleResetDijkstra">Reset Dijkstra</button>
      <button @click="handleResetAll">Reset All</button>
    </div>

    <div class="speed-control">
      <label for="speed">Speed: {{ speed }}ms</label>
      <input id="speed" type="range" min="0" max="2000" v-model="speed" />
    </div>

    <div class="weights">
      <h3>Edge Weights</h3>
      <div v-for="(edge, index) in graph.edges" class="weight-item">
        <input
          type="range"
          min="0"
          max="10"
          @change="updateCost(edge, $event)"
          :value="edge.cost"
        />
        <div>
          From <b>{{ edge.from }}</b> to <b>{{ edge.to }}</b
          >: {{ edge.cost }} Cost
        </div>
      </div>
    </div>

    <Renderer :graph="graph" :state="state" start="A" end="D" />

    <div class="visited">
      <h3>Visited Nodes</h3>
      <span v-for="vertex in visited" class="visited-node">
        <b>{{ vertex }}</b>
      </span>
    </div>

    <table class="distance-table">
      <thead>
        <tr>
          <th>Vertex</th>
          <th>Distance</th>
          <th>Previous</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="vertex in graph.vertices">
          <td>{{ vertex.id }}</td>
          <td>{{ state.distances[vertex.id] === Infinity ? '∞' : state.distances[vertex.id] }}</td>
          <td>
            {{
              state.previous[vertex.id] === undefined
                ? '-'
                : state.previous[vertex.id] === null
                  ? 'start'
                  : state.previous[vertex.id]
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss">
html {
  background-color: #161628;
  color: #eee;
  font-family: 'Arial', sans-serif;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 2em;
  height: 100vh;
  width: 100vw;
  align-items: center;
  justify-content: center;
  padding: 2em;
  box-sizing: border-box;
}

.controls {
  display: flex;
  gap: 1em;
  flex-wrap: wrap;
  justify-content: center;
}

button {
  padding: 0.8em 1.5em;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background-color: #0077cc;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #005fa3;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 1em;
  font-size: 16px;
}

input[type='range'] {
  -webkit-appearance: none;
  width: 200px;
  height: 8px;
  background: #0077cc;
  border-radius: 5px;
  outline: none;
  transition: background 0.3s ease;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #fff;
  border: 2px solid #0077cc;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s ease;
}

input[type='range']:hover {
  background: #005fa3;
}

.weights {
  background: #1e1e3f;
  padding: 1.5em;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
}

.weights h3 {
  margin-bottom: 1em;
  color: #00aaff;
}

.weight-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1em;
}

.visited {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  justify-content: center;
}

.visited h3 {
  width: 100%;
  text-align: center;
  color: #00aaff;
}

.visited-node {
  background: #0077cc;
  color: #fff;
  padding: 0.5em 1em;
  border-radius: 8px;
}

.distance-table {
  width: 100%;
  max-width: 600px;
  border-collapse: collapse;
  margin-top: 1em;
}

.distance-table th,
.distance-table td {
  padding: 0.8em;
  text-align: center;
  border: 1px solid #0077cc;
}

.distance-table th {
  background: #0077cc;
  color: #fff;
}

.distance-table tr:nth-child(even) {
  background: #1e1e3f;
}

.distance-table tr:nth-child(odd) {
  background: #2a2a4f;
}
</style>
