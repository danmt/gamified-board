import * as cytoscape from 'cytoscape';
import {
  AddNodeSuccessEvent,
  AddNodeToEdgeSuccessEvent,
  ClickEvent,
  DeleteEdgeEvent,
  DeleteEdgeSuccessEvent,
  DeleteNodeEvent,
  DeleteNodeSuccessEvent,
  DrawerEvent,
  GraphDataType,
  GraphScrolledEvent,
  InitEvent,
  Node,
  NodeDataType,
  OneTapEdgeEvent,
  OneTapNodeEvent,
  PanDraggedEvent,
  UpdateGraphSuccessEvent,
  UpdateGraphThumbnailSuccessEvent,
  UpdateNodeEvent,
  UpdateNodeSuccessEvent,
  UpdateNodeThumbnailSuccessEvent,
  ViewNodeEvent,
} from './types';

export const createNode = (
  graph: cytoscape.Core,
  nodeData: cytoscape.NodeDataDefinition,
  position?: { x: number; y: number }
) => {
  graph.add({
    data: nodeData['kind']
      ? {
          ...nodeData,
          parent: nodeData['kind'],
        }
      : nodeData,
    group: 'nodes',
    classes: 'bp-bd-node',
    position,
  });
};

export const isInitEvent = <T extends GraphDataType, U extends NodeDataType>(
  event: DrawerEvent<T, U>
): event is InitEvent => {
  return event.type === 'Init';
};

export const isClickEvent = <T extends GraphDataType, U extends NodeDataType>(
  event: DrawerEvent<T, U>
): event is ClickEvent => {
  return event.type === 'Click';
};

export const isGraphScrolledEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is GraphScrolledEvent => {
  return event.type === 'GraphScrolled';
};

export const isPanDraggedEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is PanDraggedEvent => {
  return event.type === 'PanDragged';
};

export const isOneTapNodeEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is OneTapNodeEvent<U> => {
  return event.type === 'OneTapNode';
};

export const isOneTapEdgeEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is OneTapEdgeEvent => {
  return event.type === 'OneTapEdge';
};

export const isUpdateGraphSuccessEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is UpdateGraphSuccessEvent<T> => {
  return event.type === 'UpdateGraphSuccess';
};

export const isUpdateGraphThumbnailSuccessEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is UpdateGraphThumbnailSuccessEvent => {
  return event.type === 'UpdateGraphThumbnailSuccess';
};

export const isAddNodeSuccessEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is AddNodeSuccessEvent<U> => {
  return event.type === 'AddNodeSuccess';
};

export const isAddNodeToEdgeSuccessEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is AddNodeToEdgeSuccessEvent<U> => {
  return event.type === 'AddNodeToEdgeSuccess';
};

export const isUpdateNodeEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is UpdateNodeEvent => {
  return event.type === 'UpdateNode';
};

export const isUpdateNodeSuccessEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is UpdateNodeSuccessEvent<U> => {
  return event.type === 'UpdateNodeSuccess';
};

export const isUpdateNodeThumbnailSuccessEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is UpdateNodeThumbnailSuccessEvent => {
  return event.type === 'UpdateNodeThumbnailSuccess';
};

export const isDeleteNodeEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is DeleteNodeEvent => {
  return event.type === 'DeleteNode';
};

export const isDeleteNodeSuccessEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is DeleteNodeSuccessEvent => {
  return event.type === 'DeleteNodeSuccess';
};

export const isViewNodeEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is ViewNodeEvent => {
  return event.type === 'ViewNode';
};

export const isDeleteEdgeEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is DeleteEdgeEvent => {
  return event.type === 'DeleteEdge';
};

export const isDeleteEdgeSuccessEvent = <
  T extends GraphDataType,
  U extends NodeDataType
>(
  event: DrawerEvent<T, U>
): event is DeleteEdgeSuccessEvent => {
  return event.type === 'DeleteEdgeSuccess';
};

export const createGraph = <
  NodeDataType extends { name: string; thumbnailUrl: string }
>(
  container: HTMLElement,
  nodes: cytoscape.NodeDefinition[],
  edges: cytoscape.EdgeDefinition[],
  groups: cytoscape.ElementDefinition[]
): cytoscape.Core => {
  return cytoscape({
    container,
    boxSelectionEnabled: false,
    autounselectify: true,
    style: [
      // Style all nodes/edges
      {
        selector: 'node[kind != "group"]',
        style: {
          width: 280,
          height: 85,
        },
      },
      {
        selector: 'node[kind = "group"]',
        style: {
          'text-valign': 'top',
          'text-halign': 'center',
          'text-margin-y': -16,
          'font-size': '16px',
          color: 'white',
          content: 'data(id)',
          'text-transform': 'uppercase',
          'padding-bottom': '16px',
          'padding-top': '16px',
          'padding-left': '16px',
          'padding-right': '16px',
          'background-color': '#dddddd',
          'background-fit': 'cover',
        },
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          width: 6,
          'target-arrow-shape': 'triangle',
          'line-color': '#5E6469',
          'target-arrow-color': '#5E6469',
          'source-endpoint': 'inside-to-node',
        },
      },
      // Style the edge handles extension
      {
        selector: '.eh-hover',
        style: {
          'background-color': 'red',
        },
      },
      {
        selector: '.eh-source',
        style: {
          'border-width': 2,
          'border-color': 'red',
        },
      },
      {
        selector: '.eh-target',
        style: {
          'border-width': 2,
          'border-color': 'red',
        },
      },
      {
        selector: '.eh-preview, .eh-ghost-edge',
        style: {
          'line-color': 'red',
          'target-arrow-color': 'red',
          'source-arrow-color': 'red',
        },
      },
      {
        selector: '.eh-ghost-edge.eh-preview-active',
        style: {
          opacity: 0,
        },
      },
    ],
    elements: groups
      .concat(
        nodes.map((node) => ({
          data: node.data['kind']
            ? {
                ...node.data,
                parent: node.data['kind'],
              }
            : node.data,
          group: 'nodes' as const,
          classes: 'bp-bd-node',
          selectable: true,
        }))
      )
      .concat(
        edges.map((edge) => ({
          data: edge.data,
          group: 'edges' as const,
        }))
      ),
  }).nodeHtmlLabel([
    {
      query: '.bp-bd-node',
      tpl: (node: Node<NodeDataType>) => {
        return `
          <div class="w-[280px] h-[85px] flex gap-2 items-center px-8 bg-[length:280px_85px] bg-[url('assets/images/node.png')] z-50">
            <div 
                class="w-[56px] h-[52px] shrink-0 rounded-lg border-gray-700 border-2 bg-cover bg-center"
                style="background-image: url(${node.data.thumbnailUrl});">
            </div>
            <div style="font-family: 'Courier New', Courier, monospace">
              <h2 class="text-xl mt-2 text-white">${node.data.name}</h2>
              <p class="italic text-gray-400">${node.kind}</p>
            </div>
          </div>
        `;
      },
    },
  ]);
};
