import { defineStore } from 'pinia'
import { ref } from 'vue'

type RouterId = string

interface Connection {
  target: RouterId
  cost: number
}

interface Router {
  id: RouterId
  connections: Connection[]
}

type Network = Record<RouterId, Router>

const defaultNetwork: Network = {
  A: {
    id: 'A',
    connections: [
      { target: 'B', cost: 2 },
      { target: 'C', cost: 5 },
    ],
  },
  B: {
    id: 'B',
    connections: [
      { target: 'C', cost: 1 },
      { target: 'D', cost: 4 },
    ],
  },
  C: { id: 'C', connections: [{ target: 'D', cost: 1 }] },
  D: { id: 'D', connections: [] },
}

export const useDijkstraStore = defineStore('dijkstra', () => {
  const network = ref<Network>(defaultNetwork)

  const start = ref<RouterId>('A')
  const end = ref<RouterId>('D')

  const unvisited = ref<Set<RouterId>>(new Set(Object.keys(network.value)))
  const distances = ref<Record<RouterId, number>>({})
  const previous = ref<Record<RouterId, RouterId | null>>({})

  const current = ref<RouterId | null>(null)
  const currentConnections = ref<Connection[]>([])
  const isRunning = ref(false)

  function reset() {
    network.value = defaultNetwork
    start.value = 'A'
    end.value = 'D'
    unvisited.value = new Set(Object.keys(network.value))
    distances.value = {}
    previous.value = {}
    current.value = null
    currentConnections.value = []
    isRunning.value = false
  }

  // for each vertex v:
  //  dist[v] = infinity
  //  prev[v] = none
  // dist[source] = 0
  // set all vertices to unexplored
  //
  // while destination not explored:
  //  v = least-valued unexplored vertex
  //  set v to explored
  //  for each edge (v, w):
  //   if dist[v] + len(v,w) < dist[w]:
  //    dist[w] = dist[v] + len(v,w)
  //    prev[w] = v

  function dijkstra() {}

  return {
    network,
    start,
    end,
    unvisited,
    distances,
    previous,
    current,
    currentConnections,
    isRunning,
    reset,
    dijkstra,
  }
})
