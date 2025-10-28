<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDijkstra, type Edge, type Graph } from '../dijkstra.composable'
import Renderer from './Renderer.vue'

const defaultGraph: Graph = {
  edges: [
    { from: 'A', to: 'B', cost: 2 },
    { from: 'A', to: 'C', cost: 1 },
    { from: 'B', to: 'C', cost: 3 },
    { from: 'B', to: 'D', cost: 2 },
    { from: 'C', to: 'D', cost: 8 },
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
const start = ref('A')
const end = ref('D')

const isLightTheme = ref(false)

const { next, prev, reset, state } = useDijkstra(graph.value, start.value, end.value)

const speed = ref(500)

function toggleTheme() {
  isLightTheme.value = !isLightTheme.value
  const html = document.documentElement
  isLightTheme.value ? html.classList.add('light-theme') : html.classList.remove('light-theme')
}

const visited = computed(() =>
  Object.keys(graph.value.vertices).filter((v) => !state.value.unvisted.includes(v)),
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
  reset(graph.value, start.value, end.value)
}

function handleResetAll() {
  graph.value = defaultGraph
  start.value = 'A'
  end.value = 'D'
  reset(graph.value, start.value, end.value)
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

watch(() => start.value, handleResetDijkstra)
watch(() => end.value, handleResetDijkstra)
watch(() => graph.value, handleResetDijkstra, { deep: true })
</script>

<template>
  <div class="container">
    <h1>Dijkstra Algorithm Demo</h1>

    <button @click="toggleTheme">
      {{ isLightTheme ? 'Light Theme' : 'Dark Theme' }}
    </button>

    <div class="weights">
      <h3>Edge Weights</h3>
      <div v-for="(edge, index) in graph.edges" class="weight-item">
        <input type="range" min="0" max="9" @change="updateCost(edge, $event)" :value="edge.cost" />
        <div>
          From <b>{{ edge.from }}</b> to <b>{{ edge.to }}</b
          >: {{ edge.cost }} Cost
        </div>
      </div>
    </div>

    <div class="start-end-control">
      <label for="start">Start:</label>
      <select v-model="start" id="start" name="start">
        <option v-for="vertex in graph.vertices" :value="vertex.id" :disabled="vertex.id === end">
          {{ vertex.id }}
        </option>
      </select>
      <label for="end">End:</label>
      <select v-model="end" id="end" name="end">
        <option v-for="vertex in graph.vertices" :value="vertex.id" :disabled="vertex.id === start">
          {{ vertex.id }}
        </option>
      </select>
    </div>

    <div class="speed-control">
      <label for="speed">Speed: {{ speed }}ms</label>
      <input id="speed" type="range" min="0" max="2000" v-model="speed" />
    </div>

    <div class="controls">
      <button @click="randomize">Randomize Weights</button>
      <button @click="runToEnd">Run to End</button>
      <button @click="next">Next</button>
      <button @click="prev">Previous</button>
      <button @click="handleResetDijkstra">Reset Dijkstra</button>
      <button @click="handleResetAll">Reset All</button>
    </div>

    <Renderer :graph="graph" :state="state" :start="start" :end="end" />

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
  background-color: #161628; // Default dark theme background
  color: #eee; // Default dark theme text color
  font-family: 'Arial', sans-serif;

  &.light-theme {
    background-color: #f2f2f5; // Light theme background
    color: #333; // Light theme text color
  }
}

.container {
  display: flex;
  flex-direction: column;
  gap: 2em;
  width: 100vw;
  align-items: center;
  padding: 2em;
  padding-bottom: 4em;
  box-sizing: border-box;
}

h1 {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  color: #00aaff; // Accent color for dark theme
  margin-bottom: 1em;

  .light-theme & {
    color: #005fa3; // Accent color for light theme
  }
}

.start-end-control {
  display: flex;
  align-items: center;
  gap: 1em;
  background: #1e1e3f; // Dark theme background
  padding: 1em;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);

  label {
    font-size: 1rem;
    font-weight: bold;
  }

  select {
    padding: 0.5em;
    font-size: 1rem;
    border: 1px solid #0077cc;
    border-radius: 8px;
    background: #2a2a4f; // Dark theme select background
    color: #fff;
    cursor: pointer;

    &:hover {
      border-color: #005fa3;
    }
  }

  .light-theme & {
    background: #e8e8f0; // Light theme background
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

    select {
      background: #fff; // Light theme select background
      color: #333;
      border: 1px solid #005fa3;

      &:hover {
        border-color: #003f7f;
      }
    }
  }
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

  &:hover {
    background-color: #005fa3;
  }

  .light-theme & {
    background-color: #005fa3;
    color: #fff;

    &:hover {
      background-color: #003f7f;
    }
  }
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 1em;
  font-size: 16px;
}

input[type='range'] {
  appearance: none;
  width: 200px;
  height: 8px;
  background: #0077cc;
  border-radius: 5px;
  outline: none;
  transition: background 0.3s ease;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #fff;
    border: 2px solid #0077cc;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  &:hover {
    background: #005fa3;
  }

  .light-theme & {
    background: #005fa3;

    &::-webkit-slider-thumb {
      border-color: #003f7f;
    }

    &:hover {
      background: #003f7f;
    }
  }
}

.weights {
  background: #1e1e3f;
  padding: 1.5em;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;

  h3 {
    margin-bottom: 1em;
    color: #00aaff;

    .light-theme & {
      color: #005fa3;
    }
  }

  .light-theme & {
    background: #e8e8f0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
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

  h3 {
    width: 100%;
    text-align: center;
    color: #00aaff;

    .light-theme & {
      color: #005fa3;
    }
  }

  .visited-node {
    background: #0077cc;
    color: #fff;
    padding: 0.5em 1em;
    border-radius: 8px;

    .light-theme & {
      background: #005fa3;
    }
  }
}

.distance-table {
  width: 100%;
  max-width: 600px;
  border-collapse: collapse;
  margin-top: 1em;

  th,
  td {
    padding: 0.8em;
    text-align: center;
    border: 1px solid #0077cc;

    .light-theme & {
      border-color: #005fa3;
    }
  }

  th {
    background: #0077cc;
    color: #fff;

    .light-theme & {
      background: #005fa3;
    }
  }

  tr:nth-child(even) {
    background: #1e1e3f;

    .light-theme & {
      background: #f2f2f5;
    }
  }

  tr:nth-child(odd) {
    background: #2a2a4f;

    .light-theme & {
      background: #e8e8f0;
    }
  }
}
</style>
