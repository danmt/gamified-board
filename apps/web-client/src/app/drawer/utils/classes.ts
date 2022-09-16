import * as cytoscape from 'cytoscape';
import { MenuInstance } from 'cytoscape-cxtmenu';
import { DagreLayoutOptions } from 'cytoscape-dagre';
import { EdgeHandlesInstance } from 'cytoscape-edgehandles';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { createNode } from './methods';
import { DrawerEvent } from './types';

export class Drawer {
  private _layout: cytoscape.Layouts | null = null;
  private _nodeCxtMenu: MenuInstance | null = null;
  private _edgeCxtMenu: MenuInstance | null = null;
  private _edgeHandles: EdgeHandlesInstance | null = null;
  private _rankDir: 'TB' | 'LR' = 'TB';

  private readonly _event = new BehaviorSubject<DrawerEvent>({ type: 'Init' });
  readonly event$ = this._event.asObservable();

  constructor(private readonly _graph: cytoscape.Core) {}

  initialize() {
    // Set up graph layout
    this.setupLayout();
    // Set up extensions
    this.setupNodeContextMenu();
    this.setupEdgeContextMenu();
    this.setupEdgeHandles();
    // Listen to events

    this._graph.on('local.node-added', (ev, ...extraParams) => {
      const node = extraParams[0] as cytoscape.NodeDataDefinition;

      this._event.next({
        type: 'AddNodeSuccess',
        payload: {
          id: node.id ?? '',
          kind: node['kind'],
          label: node['label'],
          ref: node['ref'],
          name: node['name'],
          image: node['image'],
        },
      });
    });

    this._graph.on('server.node-added', (ev, ...extraParams) => {
      const node = extraParams[0] as cytoscape.NodeDataDefinition;

      createNode(this._graph, node);
    });

    this._graph.on('local.node-deleted', (_, ...extraParams) => {
      const nodeId = extraParams[0] as string;

      this._event.next({
        type: 'DeleteNodeSuccess',
        payload: nodeId,
      });
    });

    this._graph.on('server.node-deleted', (_, ...extraParams) => {
      const nodeId = extraParams[0] as string;

      this._graph.remove(`node[id = '${nodeId}']`);
    });

    this._graph.on('ehcomplete', (_, ...extraParams) => {
      const edge = [...(extraParams as unknown[])][2] as cytoscape.EdgeSingular;
      const edgeData = edge.data();

      this._graph.emit('local.edge-added', [edgeData]);
    });

    this._graph.on('local.edge-added', (_, ...extraParams) => {
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

    this._graph.on('server.edge-added', (ev, ...extraParams) => {
      const edge = extraParams[0] as cytoscape.EdgeDataDefinition;

      this._graph.add({ data: edge, group: 'edges' });
    });

    this._graph.on('local.edge-deleted', (_, ...extraParams) => {
      const edgeId = extraParams[0] as string;

      this._event.next({
        type: 'DeleteEdgeSuccess',
        payload: edgeId,
      });
    });

    this._graph.on('server.edge-deleted', (_, ...extraParams) => {
      const edgeId = extraParams[0] as string;

      this._graph.remove(`edge[id = '${edgeId}']`);
    });

    this._graph.on('local.node-added-to-edge', (_, ...extraParams) => {
      const node = [
        ...(extraParams as unknown[]),
      ][0] as cytoscape.NodeDataDefinition;
      const source = [...(extraParams as unknown[])][1] as string;
      const target = [...(extraParams as unknown[])][2] as string;
      const edgeId = [...(extraParams as unknown[])][3] as string;

      this._event.next({
        type: 'AddNodeToEdgeSuccess',
        payload: {
          source,
          target,
          edgeId,
          node: {
            id: node.id ?? '',
            kind: node['kind'],
            label: node['label'],
            ref: node['ref'],
            name: node['name'],
            image: node['image'],
          },
        },
      });
    });

    this._graph.on('server.node-added-to-edge', (ev, ...extraParams) => {
      const node = [
        ...(extraParams as unknown[]),
      ][0] as cytoscape.NodeDataDefinition;
      const source = [...(extraParams as unknown[])][1] as string;
      const target = [...(extraParams as unknown[])][2] as string;
      const edgeId = [...(extraParams as unknown[])][3] as string;

      this._graph.remove(`edge[id = '${edgeId}']`);
      this._graph.add([
        {
          data: node,
          group: 'nodes',
          classes: 'bp-bd-node',
        },
        {
          group: 'edges',
          data: {
            source: source,
            target: node.id,
          },
        },
        {
          group: 'edges',
          data: {
            source: node.id,
            target: target,
          },
        },
      ]);
    });

    this._graph.on('click', (ev) => {
      this._event.next({
        type: 'Click',
        payload: ev.position,
      });
    });
  }

  setupNodeContextMenu() {
    this._nodeCxtMenu = this._graph.cxtmenu({
      selector: 'node',
      commands: [
        {
          content: 'info',
          select: (node) => {
            if (node.isNode()) {
              this._event.next({ type: 'ViewNode', payload: node.id() });
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
    this._edgeCxtMenu = this._graph.cxtmenu({
      selector: 'edge',
      commands: [
        {
          content: 'add',
          select: (edge) => {
            if (edge.isEdge()) {
              this.addNodeToEdge(
                {
                  id: uuid(),
                  kind: 'faucet',
                  name: 'TokenProgram\nINIT ACCOUNT 1',
                  image: 'assets/images/initAccount1.png',
                },
                edge.data().source,
                edge.data().target,
                edge.id()
              );
            }
          },
        },
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
    this._edgeHandles = this._graph.edgehandles({
      snap: true,
      canConnect: (source, target) => {
        if (
          !target.isNode() ||
          source.id() === target.id() ||
          target.data().kind === 'group'
        ) {
          return false;
        }

        const element = this._graph.getElementById(
          `${source.id()}/${target.id()}`
        );

        return element.id() === undefined;
      },
      edgeParams: (source, target) => {
        return {
          data: {
            id: `${source.id()}/${target.id()}`,
          },
        };
      },
    });
  }

  setupLayout(rankDir: 'TB' | 'LR' = 'TB') {
    this._rankDir = rankDir;
    this._layout = this._graph.makeLayout({
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

  addNode(
    node: cytoscape.NodeDataDefinition,
    position?: { x: number; y: number }
  ) {
    createNode(this._graph, node, position);
    this._graph.emit('local.node-added', [node]);
  }

  addNodeToEdge(
    node: cytoscape.NodeDataDefinition,
    source: string,
    target: string,
    edgeId: string
  ) {
    this._graph.remove(`edge[id = '${edgeId}']`);
    this._graph.add([
      {
        data: node,
        group: 'nodes',
        classes: 'bp-bd-node',
      },
      {
        group: 'edges',
        data: {
          source: source,
          target: node.id,
        },
      },
      {
        group: 'edges',
        data: {
          source: node.id,
          target: target,
        },
      },
    ]);
    this._graph.emit('local.node-added-to-edge', [
      node,
      source,
      target,
      edgeId,
    ]);
  }

  removeNode(nodeId: string) {
    this._graph.remove(`node[id = '${nodeId}']`);
    this._graph.emit('local.node-deleted', [nodeId]);
  }

  handleNodeAdded(node: cytoscape.NodeDataDefinition) {
    this._graph.emit('server.node-added', [node]);
  }

  handleNodeAddedToEdge(
    node: cytoscape.NodeDataDefinition,
    source: string,
    target: string,
    edgeId: string
  ) {
    this._graph.emit('server.node-added-to-edge', [
      node,
      source,
      target,
      edgeId,
    ]);
  }

  handleNodeRemoved(nodeId: string) {
    this._graph.emit('server.node-deleted', [nodeId]);
  }

  removeEdge(edgeId: string) {
    this._graph.remove(`edge[id = '${edgeId}']`);
    this._graph.emit('local.edge-deleted', [edgeId]);
  }

  handleEdgeAdded(edge: cytoscape.EdgeDataDefinition) {
    this._graph.emit('server.edge-added', [edge]);
  }

  handleEdgeRemoved(edgeId: string) {
    this._graph.emit('server.edge-deleted', [edgeId]);
  }

  setDrawMode(drawMode: boolean) {
    if (drawMode) {
      this._edgeHandles?.enableDrawMode();
    } else {
      this._edgeHandles?.disableDrawMode();
    }
  }
}
