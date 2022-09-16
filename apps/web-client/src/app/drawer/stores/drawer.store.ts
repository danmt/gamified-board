import { Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { Core, EdgeDataDefinition, NodeDataDefinition } from 'cytoscape';
import { EMPTY, firstValueFrom, switchMap, tap } from 'rxjs';
import { Option } from '../../shared/utils';
import { Direction, Drawer } from '../utils';

interface ViewModel {
  graph: Option<Core>;
  drawer: Option<Drawer>;
  direction: Direction;
  drawMode: boolean;
}

const initialState: ViewModel = {
  drawer: null,
  graph: null,
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

  readonly graph$ = this.select(({ graph }) => graph);

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

  readonly setGraph = this.updater<Core>((state, graph) => {
    const drawer = new Drawer(graph);

    drawer.initialize();

    return { ...state, graph, drawer };
  });

  readonly setDirection = this.updater<Direction>((state, direction) => ({
    ...state,
    direction,
  }));

  readonly setDrawMode = this.updater<boolean>((state, drawMode) => ({
    ...state,
    drawMode,
  }));

  private readonly _handleDrawModeChange = this.effect<{
    drawer: Option<Drawer>;
    drawMode: boolean;
  }>(
    tap(({ drawer, drawMode }) => {
      if (drawer !== null) {
        drawer.setDrawMode(drawMode);
      }
    })
  );

  private readonly _handleDirectionChange = this.effect<{
    drawer: Option<Drawer>;
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

  async addNode(
    nodeData: NodeDataDefinition,
    position?: { x: number; y: number }
  ) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.addNode(nodeData, position);
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
