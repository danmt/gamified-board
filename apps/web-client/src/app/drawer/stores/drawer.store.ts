import { ElementRef, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import {
  EdgeDataDefinition,
  EdgeDefinition,
  NodeDataDefinition,
  NodeDefinition,
} from 'cytoscape';
import { EMPTY, firstValueFrom, switchMap, tap } from 'rxjs';
import { createGraph, Direction, Drawer } from '../utils';

interface ViewModel {
  drawer: Drawer | null;
  nodes: NodeDefinition[];
  edges: EdgeDefinition[];
  elementRef: ElementRef<HTMLElement> | null;
  direction: Direction;
  drawMode: boolean;
}

const initialState: ViewModel = {
  drawer: null,
  nodes: [],
  edges: [],
  elementRef: null,
  direction: 'vertical',
  drawMode: false,
};

@Injectable()
export class DrawerStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  readonly direction$ = this.select(({ direction }) => direction);

  readonly drawMode$ = this.select(({ drawMode }) => drawMode);

  readonly graph$ = this.select(
    this.select(({ elementRef }) => elementRef),
    this.select(({ nodes }) => nodes),
    this.select(({ edges }) => edges),
    (elementRef, nodes, edges) => {
      if (elementRef === null) {
        return null;
      }

      return createGraph(elementRef.nativeElement, nodes, edges);
    },
    { debounce: true }
  );

  readonly drawer$ = this.select(
    this.graph$,
    (graph) => {
      if (graph === null) {
        return null;
      }

      const drawer = new Drawer(graph);

      drawer.initialize();

      return drawer;
    },
    { debounce: true }
  );

  readonly event$ = this.select(
    this.drawer$.pipe(
      switchMap((drawer) => {
        if (drawer === null) {
          return EMPTY;
        }

        return drawer.event$;
      })
    ),
    (event) => event
  );

  readonly setNodes = this.updater<NodeDataDefinition[]>((state, nodes) => ({
    ...state,
    nodes: nodes.map((node) => ({
      data: node,
    })),
  }));

  readonly setEdges = this.updater<EdgeDataDefinition[]>((state, edges) => ({
    ...state,
    edges: edges.map((edge) => ({
      data: edge,
    })),
  }));

  readonly setElementRef = this.updater<ElementRef<HTMLElement>>(
    (state, elementRef) => ({
      ...state,
      elementRef,
    })
  );

  readonly setDirection = this.updater<Direction>((state, direction) => ({
    ...state,
    direction,
  }));

  readonly setDrawMode = this.updater<boolean>((state, drawMode) => ({
    ...state,
    drawMode,
  }));

  private readonly _handleDrawModeChange = this.effect<{
    drawer: Drawer | null;
    drawMode: boolean;
  }>(
    tap(({ drawer, drawMode }) => {
      if (drawer !== null) {
        drawer.setDrawMode(drawMode);
      }
    })
  );

  private readonly _handleDirectionChange = this.effect<{
    drawer: Drawer | null;
    direction: Direction;
  }>(
    tap(({ drawer, direction }) => {
      if (drawer !== null) {
        drawer.setupLayout(direction === 'vertical' ? 'TB' : 'LR');
      }
    })
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._handleDrawModeChange(
      this.select(this.drawer$, this.drawMode$, (drawer, drawMode) => ({
        drawer,
        drawMode,
      }))
    );
    this._handleDirectionChange(
      this.select(this.drawer$, this.direction$, (drawer, direction) => ({
        drawer,
        direction,
      }))
    );
  }

  async restartLayout() {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.restartLayout();
    }
  }

  async addNode(nodeData: NodeDataDefinition) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.addNode(nodeData);
    }
  }

  async handleNodeAdded(nodeData: NodeDataDefinition) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleNodeAdded(nodeData);
    }
  }

  async handleNodeAddedToEdge({
    node,
    source,
    target,
    edgeId,
  }: {
    node: NodeDataDefinition;
    source: string;
    target: string;
    edgeId: string;
  }) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleNodeAddedToEdge(node, source, target, edgeId);
    }
  }

  async handleNodeRemoved(nodeId: string) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleNodeRemoved(nodeId);
    }
  }

  async handleEdgeAdded(edgeData: EdgeDataDefinition) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleEdgeAdded(edgeData);
    }
  }

  async handleEdgeRemoved(edgeId: string) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleEdgeRemoved(edgeId);
    }
  }
}
