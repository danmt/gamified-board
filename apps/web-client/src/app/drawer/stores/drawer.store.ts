import { Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { EMPTY, filter, firstValueFrom, of, switchMap, tap } from 'rxjs';
import { isNull, Option } from '../../shared/utils';
import {
  DefaultGraphDataType,
  DefaultNodeDataType,
  Direction,
  Drawer,
  Edge,
  GetNodeTypes,
  isGraphScrolledEvent,
  isPanDraggedEvent,
} from '../utils';

interface ViewModel<
  NodeKinds extends string,
  NodeDataType extends DefaultNodeDataType,
  NodesDataMap extends { [key in NodeKinds]: NodeDataType },
  GraphKind extends string,
  GraphDataType extends DefaultGraphDataType
> {
  drawer: Option<
    Drawer<NodeKinds, NodeDataType, NodesDataMap, GraphKind, GraphDataType>
  >;
  direction: Direction;
  drawMode: boolean;
}

@Injectable()
export class DrawerStore<
    NodeKinds extends string,
    NodeDataType extends DefaultNodeDataType,
    NodesDataMap extends { [key in NodeKinds]: NodeDataType },
    GraphKind extends string,
    GraphDataType extends DefaultGraphDataType
  >
  extends ComponentStore<
    ViewModel<NodeKinds, NodeDataType, NodesDataMap, GraphKind, GraphDataType>
  >
  implements OnStoreInit
{
  readonly direction$ = this.select(({ direction }) => direction);
  readonly drawMode$ = this.select(({ drawMode }) => drawMode);
  readonly drawer$ = this.select(({ drawer }) => drawer);
  readonly graph$ = this.select(
    this.drawer$.pipe(
      switchMap((drawer) => {
        if (isNull(drawer)) {
          return of(null);
        }

        return drawer.graph$;
      })
    ),
    (graph) => graph
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
  readonly zoomSize$ = this.select(
    this.event$.pipe(filter(isGraphScrolledEvent)),
    (event) => event.payload.zoomSize
  );
  readonly panDrag$ = this.select(
    this.event$.pipe(filter(isPanDraggedEvent)),
    (event) => ({ x: event.payload.x, y: event.payload.y })
  );

  readonly setDrawer = this.updater<
    Option<
      Drawer<NodeKinds, NodeDataType, NodesDataMap, GraphKind, GraphDataType>
    >
  >((state, drawer) => ({
    ...state,
    drawer,
  }));

  readonly setDirection = this.updater<Direction>((state, direction) => ({
    ...state,
    direction,
  }));

  readonly setDrawMode = this.updater<boolean>((state, drawMode) => ({
    ...state,
    drawMode,
  }));

  private readonly _handleDrawModeChange = this.effect<{
    drawer: Option<
      Drawer<NodeKinds, NodeDataType, NodesDataMap, GraphKind, GraphDataType>
    >;
    drawMode: boolean;
  }>(
    tap(({ drawer, drawMode }) => {
      if (drawer !== null) {
        drawer.setDrawMode(drawMode);
      }
    })
  );

  private readonly _handleDirectionChange = this.effect<{
    drawer: Option<
      Drawer<NodeKinds, NodeDataType, NodesDataMap, GraphKind, GraphDataType>
    >;
    direction: Direction;
  }>(
    tap(({ drawer, direction }) => {
      if (drawer !== null) {
        drawer.setupLayout(direction === 'vertical' ? 'TB' : 'LR');
      }
    })
  );

  constructor() {
    super({
      drawer: null,
      direction: 'vertical',
      drawMode: false,
    });
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

  async updateGraph(changes: Partial<GraphDataType>) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.updateGraph(changes);
    }
  }

  async updateGraphThumbnail(fileId: string, fileUrl: string) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.updateGraphThumbnail(fileId, fileUrl);
    }
  }

  async addNode(
    nodeData: GetNodeTypes<NodeKinds, NodeDataType, NodesDataMap>,
    position?: { x: number; y: number }
  ) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.addNode(nodeData, position);
    }
  }

  async updateNode(
    nodeId: string,
    payload: { changes: Partial<NodeDataType>; kind: NodeKinds }
  ) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.updateNode(nodeId, payload);
    }
  }

  async updateNodeThumbnail(nodeId: string, fileId: string, fileUrl: string) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.updateNodeThumbnail(nodeId, fileId, fileUrl);
    }
  }

  async removeNode(nodeId: string) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.removeNode(nodeId);
    }
  }

  async handleGraphUpdated(changes: Partial<GraphDataType>) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleGraphUpdated(changes);
    }
  }

  async handleGraphThumbnailUpdated(fileId: string, fileUrl: string) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleGraphThumbnailUpdated(fileId, fileUrl);
    }
  }

  async handleNodeAdded(
    node: GetNodeTypes<NodeKinds, NodeDataType, NodesDataMap>
  ) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleNodeAdded(node);
    }
  }

  async handleNodeUpdated(nodeId: string, changes: Partial<NodeDataType>) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleNodeUpdated(nodeId, changes);
    }
  }

  async handleNodeThumbnailUpdated(
    nodeId: string,
    fileId: string,
    fileUrl: string
  ) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleNodeThumbnailUpdated(nodeId, fileId, fileUrl);
    }
  }

  async handleNodeRemoved(nodeId: string) {
    const drawer = await firstValueFrom(this.drawer$);

    if (drawer !== null) {
      drawer.handleNodeRemoved(nodeId);
    }
  }

  async handleEdgeAdded(edgeData: Edge) {
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
