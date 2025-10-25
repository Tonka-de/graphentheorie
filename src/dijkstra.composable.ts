import { useRefHistory } from '@vueuse/core'
import { ref, watch } from 'vue'

export type Id = string

export interface Edge {
  from: Id
  to: Id
  cost: number
}

export interface Vertice {
  id: Id
}

export interface Graph {
  vertices: Record<Id, Vertice>
  edges: Edge[]
}

export type Distances = Record<Id, number>

export interface DijkstraState {
  unvisted: Array<Id>
  distances: Distances
  previous: Record<Id, Id | null>

  currentVertex: Id | null
  currentEdge: Edge | null
  edgesLeft: Edge[]

  isDone: boolean
}

function initDijkstra(graph: Graph, start: Id): DijkstraState {
  function initDistances(graph: Graph, start: Id) {
    const distances: Distances = {}
    Object.keys(graph.vertices).forEach((id) => {
      distances[id] = Infinity
    })
    distances[start] = 0
    return distances
  }

  const state: DijkstraState = {
    unvisted: Object.keys(graph.vertices),
    distances: initDistances(graph, start),
    previous: { [start]: null },

    currentVertex: null,
    currentEdge: null,
    edgesLeft: [],

    isDone: false,
  }

  return state
}

export function useDijkstra(initGraph: Graph, initStart: Id, initEnd: Id) {
  const start = ref<Id>(initStart)
  const end = ref<Id>(initEnd)
  const graph = ref<Graph>(initGraph)
  const state = ref<DijkstraState>(initDijkstra(initGraph, start.value))
  const { undo, clear, batch, pause, resume } = useRefHistory(state, { deep: true, flush: 'sync' })

  /// returns true if the algorithm is done, otherwise false
  function next(): boolean {
    // 1. check if we are done
    if (!state.value.unvisted.includes(end.value)) {
      if (!state.value.isDone) {
        batch(() => {
          state.value.isDone = true
          state.value.currentVertex = null
        })
      }
      return true
    }

    // 2. select current if null and setup connections that must be checked
    if (state.value.currentVertex === null) {
      // get new current
      const unvisted = Array.from(state.value.unvisted)
      let minimal: Id = ''
      let minimalCost: number = Infinity

      for (const id of unvisted) {
        if ((state.value.distances[id] ?? Infinity) < minimalCost) {
          minimal = id
          minimalCost = state.value.distances[id]!
        }
      }

      const connections: Edge[] = graph.value.edges
        .map((edge) => {
          if (edge.to === minimal) {
            return { from: minimal, to: edge.from, cost: edge.cost }
          } else {
            return edge
          }
        })
        .filter((edge) => edge.from === minimal && unvisted.includes(edge.to))

      // update values
      batch(() => {
        state.value.currentVertex = minimal
        state.value.edgesLeft = connections
        state.value.unvisted = state.value.unvisted.filter((u) => u !== minimal)
      })

      return false
    }

    // 3. check if an edge needs to be checked
    if (state.value.edgesLeft.length === 0 && state.value.currentEdge === null) {
      batch(() => {
        state.value.currentVertex = null
      })
      return false
    }

    // 4. select target if null
    if (state.value.currentEdge === null) {
      const target: Edge = state.value.edgesLeft[0]!
      batch(() => {
        state.value.currentEdge = target
        state.value.edgesLeft = state.value.edgesLeft.slice(1)
      })
      return false
    }

    // 5. check distance to target and update it
    // we can use just edge here because above they were normalized so the "from" is always the current node
    const edge = state.value.currentEdge
    const currentCost = state.value.distances[edge.from]!
    const nextCost = state.value.distances[edge.to] ?? Infinity

    if (currentCost + edge.cost < nextCost) {
      batch(() => {
        state.value.distances[edge.to] = currentCost + edge.cost
        state.value.previous[edge.to] = edge.from
        state.value.currentEdge = null
      })
    } else {
      batch(() => {
        state.value.currentEdge = null
      })
    }

    return false
  }

  function reset(newGraph: Graph, newStart: Id, newEnd: Id) {
    start.value = newStart
    end.value = newEnd
    graph.value = newGraph
    state.value = initDijkstra(newGraph, newStart)
    clear()
  }

  function prev() {
    undo()
    pause()
    const keys = Object.keys(state.value.distances)
    keys.forEach((key) => {
      if (state.value.distances[key] === null) {
        state.value.distances[key] = Infinity
      }
    })
    resume()
  }

  return {
    state,
    start,
    end,
    prev,
    next,
    reset,
  }
}
