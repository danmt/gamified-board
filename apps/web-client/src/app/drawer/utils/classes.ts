import * as cytoscape from 'cytoscape';
import { MenuInstance } from 'cytoscape-cxtmenu';
import { DagreLayoutOptions } from 'cytoscape-dagre';
import { EdgeHandlesInstance } from 'cytoscape-edgehandles';
import { BehaviorSubject, Observable } from 'rxjs';
import { Option } from '../../shared/utils';
import { createGraph, createNode, defaultNodeLabelFunction } from './methods';
import {
  DefaultGraphDataType,
  DefaultNodeDataType,
  DrawerEvent,
  Edge,
  GetNodeTypes,
  GetPartialNodeDataTypes,
  Graph,
} from './types';

export class Drawer<
  NodeKinds extends string,
  NodeDataType extends DefaultNodeDataType,
  NodesDataMap extends { [key in NodeKinds]: NodeDataType },
  GraphKind extends string,
  GraphDataType extends DefaultGraphDataType
> {
  private _layout: cytoscape.Layouts | null = null;
  private _nodeCxtMenu: MenuInstance | null = null;
  private _edgeCxtMenu: MenuInstance | null = null;
  private _edgeHandles: EdgeHandlesInstance | null = null;
  private _rankDir: 'TB' | 'LR' = 'TB';

  private readonly _event = new BehaviorSubject<
    DrawerEvent<NodeKinds, NodeDataType, NodesDataMap, GraphKind, GraphDataType>
  >({
    type: 'Init',
  });
  private readonly _graph: BehaviorSubject<
    Graph<NodeKinds, NodeDataType, NodesDataMap, GraphKind, GraphDataType>
  >;
  private readonly _selected = new BehaviorSubject<
    Option<GetNodeTypes<NodeKinds, NodeDataType, NodesDataMap>>
  >(null);
  private readonly _cy: cytoscape.Core;
  readonly event$ = this._event.asObservable();
  readonly graph$: Observable<
    Graph<NodeKinds, NodeDataType, NodesDataMap, GraphKind, GraphDataType>
  >;
  readonly selected$ = this._selected.asObservable();

  constructor(
    graph: Graph<
      NodeKinds,
      NodeDataType,
      NodesDataMap,
      GraphKind,
      GraphDataType
    >,
    _nodes: GetNodeTypes<NodeKinds, NodeDataType, NodesDataMap>[], // this field is only to help the type inference
    groups: string[],
    element: HTMLElement,
    private canConnectFn: (
      source: cytoscape.NodeSingular,
      target: cytoscape.NodeSingular
    ) => boolean = () => true,
    labelFn: (
      node: GetNodeTypes<NodeKinds, NodeDataType, NodesDataMap>
    ) => string = defaultNodeLabelFunction
  ) {
    this._cy = createGraph<NodeKinds, NodeDataType, NodesDataMap>(
      element,
      graph.nodes.map((node) => ({
        data: node,
      })),
      graph.edges.map((edge) => ({
        data: {
          id: edge.id,
          source: edge.data.source,
          target: edge.data.target,
        },
      })),
      groups.map((group) => ({
        data: { id: group, kind: 'group' },
        group: 'nodes',
      })),
      labelFn
    );
    this._graph = new BehaviorSubject(graph);
    this.graph$ = this._graph.asObservable();
  }

  initialize() {
    // Set up graph layout
    this.setupLayout();
    // Set up extensions
    this.setupNodeContextMenu();
    this.setupEdgeContextMenu();
    this.setupEdgeHandles();

    // Listen to events
    this._cy.on('scrollzoom', (ev) => {
      const zoomRatio = 20; // random value to set the amount of zoom made with every scroll
      const zoomString = (ev.target.zoom() * zoomRatio).toString() + '%';

      this._event.next({
        type: 'GraphScrolled',
        payload: {
          zoomSize: zoomString,
        },
      });
    });

    this._cy.on('dragpan', (ev) => {
      const pan = ev.target.pan();
      const xCoord = pan.x.toString() + 'px';
      const yCoord = pan.y.toString() + 'px';

      this._event.next({
        type: 'PanDragged',
        payload: {
          x: xCoord,
          y: yCoord,
        },
      });
    });

    this._cy.on('local.graph-updated', (ev, ...extraParams) => {
      const kind = [...(extraParams as unknown[])][0] as GraphKind;
      const changes = [
        ...(extraParams as unknown[]),
      ][1] as Partial<GraphDataType>;

      this._event.next({
        type: 'UpdateGraphSuccess',
        payload: {
          changes,
          kind,
        },
      });
    });

    this._cy.on('server.graph-updated', (ev, ...extraParams) => {
      const changes = extraParams[0] as Partial<GraphDataType>;

      const graph = this._graph.getValue();
      this._graph.next({
        ...graph,
        data: {
          ...graph.data,
          ...changes,
        },
      });
    });

    this._cy.on('local.graph-thumbnail-updated', (ev, ...extraParams) => {
      const fileId = [...(extraParams as unknown[])][0] as string;
      const fileUrl = [...(extraParams as unknown[])][1] as string;
      const kind = [...(extraParams as unknown[])][2] as GraphKind;

      this._event.next({
        type: 'UpdateGraphThumbnailSuccess',
        payload: {
          fileId,
          fileUrl,
          kind,
        },
      });
    });

    this._cy.on('server.graph-thumbnail-updated', (ev, ...extraParams) => {
      const fileUrl = [...(extraParams as unknown[])][1] as string;

      const graph = this._graph.getValue();
      this._graph.next({
        ...graph,
        data: {
          ...graph.data,
          thumbnailUrl: fileUrl,
        },
      });
    });

    this._cy.on('local.node-added', (ev, ...extraParams) => {
      const node = extraParams[0] as cytoscape.NodeDataDefinition;

      this._event.next({
        type: 'AddNodeSuccess',
        payload: node as GetNodeTypes<NodeKinds, NodeDataType, NodesDataMap>,
      });
    });

    this._cy.on('server.node-added', (ev, ...extraParams) => {
      const node = extraParams[0] as GetNodeTypes<
        NodeKinds,
        NodeDataType,
        NodesDataMap
      >;

      createNode(this._cy, node);
    });

    this._cy.on('local.node-updated', (ev, ...extraParams) => {
      const payload = extraParams[0] as GetPartialNodeDataTypes<
        NodeKinds,
        NodeDataType,
        NodesDataMap
      >;

      this._event.next({
        type: 'UpdateNodeSuccess',
        payload,
      });
    });

    this._cy.on('server.node-updated', (ev, ...extraParams) => {
      const nodeId = extraParams[0] as string;
      const changes = [
        ...(extraParams as unknown[]),
      ][1] as Partial<NodeDataType>;

      const node = this._cy.getElementById(nodeId);
      const nodeData = node.data();
      node.data({ ...nodeData, data: { ...nodeData.data, ...changes } });
    });

    this._cy.on('local.node-thumbnail-updated', (ev, ...extraParams) => {
      const nodeId = extraParams[0] as string;
      const fileId = [...(extraParams as unknown[])][1] as string;
      const fileUrl = [...(extraParams as unknown[])][2] as string;
      const kind = [...(extraParams as unknown[])][3] as NodeKinds;

      this._event.next({
        type: 'UpdateNodeThumbnailSuccess',
        payload: {
          id: nodeId,
          fileId,
          fileUrl,
          kind,
        },
      });
    });

    this._cy.on('server.node-thumbnail-updated', (ev, ...extraParams) => {
      const nodeId = extraParams[0] as string;
      const fileUrl = [...(extraParams as unknown[])][2] as string;

      const node = this._cy.getElementById(nodeId);
      const nodeData = node.data();
      node.data({
        ...nodeData,
        data: { ...nodeData.data, thumbnailUrl: fileUrl },
      });
    });

    this._cy.on('local.node-deleted', (_, ...extraParams) => {
      const nodeId = extraParams[0] as string;
      const kind = [...(extraParams as unknown[])][1] as NodeKinds;

      this._event.next({
        type: 'DeleteNodeSuccess',
        payload: {
          id: nodeId,
          kind,
        },
      });
    });

    this._cy.on('server.node-deleted', (_, ...extraParams) => {
      const nodeId = extraParams[0] as string;

      this._cy.remove(`node[id = '${nodeId}']`);
    });

    this._cy.on('ehcomplete', (_, ...extraParams) => {
      const edge = [...(extraParams as unknown[])][2] as cytoscape.EdgeSingular;
      const edgeData = edge.data();

      this._cy.emit('local.edge-added', [edgeData]);
    });

    this._cy.on('local.edge-added', (_, ...extraParams) => {
      const edge = extraParams[0] as cytoscape.EdgeDataDefinition;

      this._event.next({
        type: 'AddEdgeSuccess',
        payload: {
          id: edge.id ?? '',
          source: edge['source'],
          target: edge['target'],
        },
      });
    });

    this._cy.on('server.edge-added', (ev, ...extraParams) => {
      const edge = extraParams[0] as Edge;

      this._cy.add({ data: edge, group: 'edges' });
    });

    this._cy.on('local.edge-deleted', (_, ...extraParams) => {
      const edgeId = extraParams[0] as string;

      this._event.next({
        type: 'DeleteEdgeSuccess',
        payload: edgeId,
      });
    });

    this._cy.on('server.edge-deleted', (_, ...extraParams) => {
      const edgeId = extraParams[0] as string;

      this._cy.remove(`edge[id = '${edgeId}']`);
    });

    this._cy.on('click', (ev) => {
      this._event.next({
        type: 'Click',
        payload: ev.position,
      });
    });

    this._cy.on('onetap', 'node', (ev) => {
      this._event.next({
        type: 'OneTapNode',
        payload: ev.target.data(),
      });
    });

    this._cy.on('onetap', 'edge', (ev) => {
      this._event.next({
        type: 'OneTapEdge',
        payload: ev.target.id(),
      });
    });
  }

  setupNodeContextMenu() {
    this._nodeCxtMenu = this._cy.cxtmenu({
      selector: 'node',
      commands: [
        {
          content: 'info',
          select: (node) => {
            if (node.isNode()) {
              this._event.next({
                type: 'ViewNode',
                payload: { id: node.id(), kind: node.data().kind },
              });
            }
          },
        },
        {
          content: 'edit',
          select: (node) => {
            if (node.isNode()) {
              this._event.next({ type: 'UpdateNode', payload: node.id() });
            }
          },
        },
        {
          content: 'delete',
          select: (node) => {
            if (node.isNode()) {
              this.removeNode(node.id());
            }
          },
        },
      ],
    });
  }

  setupEdgeContextMenu() {
    this._edgeCxtMenu = this._cy.cxtmenu({
      selector: 'edge',
      commands: [
        {
          content: 'delete',
          select: (edge) => {
            if (edge.isEdge()) {
              this.removeEdge(edge.id());
            }
          },
        },
      ],
    });
  }

  setupEdgeHandles() {
    this._edgeHandles = this._cy.edgehandles({
      snap: true,
      canConnect: (source, target) => this.canConnectFn(source, target),
    });
  }

  setupLayout(rankDir: 'TB' | 'LR' = 'TB') {
    this._rankDir = rankDir;
    this._layout = this._cy.makeLayout({
      name: 'dagre',
      directed: true,
      padding: 10,
      rankDir,
      spacingFactor: 1.5,
      fit: true,
      nodeDimensionsIncludeLabels: true,
    } as DagreLayoutOptions);
    this._layout.run();
  }

  restartLayout() {
    this.setupLayout(this._rankDir);
  }

  updateGraph(changes: Partial<GraphDataType>) {
    const graph = this._graph.getValue();
    this._graph.next({
      ...graph,
      data: {
        ...graph.data,
        ...changes,
      },
    });
    this._cy.emit('local.graph-updated', [graph.kind, changes]);
  }

  updateGraphThumbnail(fileId: string, fileUrl: string) {
    const graph = this._graph.getValue();
    this._graph.next({
      ...graph,
      data: {
        ...graph.data,
        thumbnailUrl: fileUrl,
      },
    });
    this._cy.emit('local.graph-thumbnail-updated', [
      fileId,
      fileUrl,
      graph.kind,
    ]);
  }

  addNode(
    node: GetNodeTypes<
      NodeKinds,
      NodeDataType,
      { [key in NodeKinds]: NodeDataType }
    >,
    position?: { x: number; y: number }
  ) {
    createNode(this._cy, node, position);
    this._cy.emit('local.node-added', [node]);
  }

  updateNode(
    nodeId: string,
    payload: { changes: Partial<NodeDataType>; kind: NodeKinds }
  ) {
    const node = this._cy.getElementById(nodeId);

    const nodeData = node.data();
    node.data({
      ...nodeData,
      data: { ...nodeData.data, ...payload.changes },
    });

    this._cy.emit('local.node-updated', [
      {
        id: nodeId,
        data: payload.changes,
        kind: payload.kind,
      },
    ]);
  }

  updateNodeThumbnail(nodeId: string, fileId: string, fileUrl: string) {
    const node = this._cy.getElementById(nodeId);
    const nodeData = node.data();
    node.data({
      ...nodeData,
      data: { ...nodeData.data, thumbnailUrl: fileUrl },
    });
    this._cy.emit('local.node-thumbnail-updated', [
      nodeId,
      fileId,
      fileUrl,
      nodeData.kind,
    ]);
  }

  removeNode(nodeId: string) {
    const node = this._cy.getElementById(nodeId);
    const nodeData = node.data();
    const nodeKind = nodeData.kind;
    this._cy.remove(`node[id = '${nodeId}']`);
    this._cy.emit('local.node-deleted', [nodeId, nodeKind]);
  }

  handleGraphUpdated(changes: Partial<GraphDataType>) {
    this._cy.emit('server.graph-updated', [changes]);
  }

  handleGraphThumbnailUpdated(fileId: string, fileUrl: string) {
    this._cy.emit('server.graph-thumbnail-updated', [fileId, fileUrl]);
  }

  handleNodeAdded(
    node: GetNodeTypes<
      NodeKinds,
      NodeDataType,
      { [key in NodeKinds]: NodeDataType }
    >
  ) {
    this._cy.emit('server.node-added', [node]);
  }

  handleNodeUpdated(nodeId: string, changes: Partial<NodeDataType>) {
    this._cy.emit('server.node-updated', [nodeId, changes]);
  }

  handleNodeThumbnailUpdated(nodeId: string, fileId: string, fileUrl: string) {
    this._cy.emit('server.node-thumbnail-updated', [nodeId, fileId, fileUrl]);
  }

  handleNodeRemoved(nodeId: string) {
    this._cy.emit('server.node-deleted', [nodeId]);
  }

  removeEdge(edgeId: string) {
    this._cy.remove(`edge[id = '${edgeId}']`);
    this._cy.emit('local.edge-deleted', [edgeId]);
  }

  handleEdgeAdded(edge: Edge) {
    this._cy.emit('server.edge-added', [edge]);
  }

  handleEdgeRemoved(edgeId: string) {
    this._cy.emit('server.edge-deleted', [edgeId]);
  }

  setDrawMode(drawMode: boolean) {
    if (drawMode) {
      this._edgeHandles?.enableDrawMode();
    } else {
      this._edgeHandles?.disableDrawMode();
    }
  }
}
