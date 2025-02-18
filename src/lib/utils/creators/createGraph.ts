import { derived, writable } from 'svelte/store';
import type { Graph, Node, GroupBox, GraphKey, GroupKey } from '$lib/types';
import { createStore } from './createStore';
import { createEdgeStore } from './createEdgeStore';
import { cursorPositionRaw } from '$lib/stores/CursorStore';
import type { NodeKey } from '$lib/types';
import { createDerivedCursorStore } from './createDerivedCursoreStore';
import { createBoundsStore } from './createBoundsStore';
import type { GraphConfig } from '$lib/types';
import { calculateViewportCenter } from '../calculators/calculateViewPortCenter';

// updated by team v.11.0
export function createGraph(id: GraphKey, config: GraphConfig): Graph {
    const { zoom, editable, translation: initialTranslation, direction, locked, edge, nodes: initialNodes } = config;

    const translation = writable({
        x: initialTranslation?.x || 0,
        y: initialTranslation?.y || 0
    });

    const dimensions = writable({ top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 });
    const scale = writable(zoom);
    const mounted = writable(false);
    
    const nodes = createStore<Node, NodeKey>();

    // 🔥 Agregar nodos iniciales antes de llamar a createBoundsStore()
    // if (initialNodes) {
    //     Object.values(initialNodes).forEach(node => nodes.add(node, node.id));
    // }

	// console.log("Nodos en el store después de agregar:", nodes.getAll());
	
    // 🔥 Ahora sí, crear los bounds con nodos ya existentes
    const bounds = createBoundsStore(nodes, dimensions, scale, translation);

    const center = derived(
        [dimensions, translation, scale],
        ([$dimensions, $translation, $scale]) => {
            return calculateViewportCenter($dimensions, $translation, $scale);
        }
    );

    const graph: Graph = {
        id,
        nodes,
        edges: createEdgeStore(),
        transforms: {
            translation,
            scale
        },
        maxZIndex: writable(2),
        dimensions,
        bounds,
        center,
        mounted,
        direction: direction || 'LR',
        editable: editable || false,
        edge: edge || null,
        editing: writable(null),
        cursor: createDerivedCursorStore(cursorPositionRaw, dimensions, translation, scale),
        locked: writable(locked || false),
        groups: writable({
            selected: { parent: writable(null), nodes: writable(new Set<Node>()) },
            hidden: { parent: writable(null), nodes: writable(new Set<Node>()) }
        }),
        groupBoxes: createStore<GroupBox, GroupKey>(),
        activeGroup: writable(null),
        initialNodePositions: writable([])
    };

    return graph;
}