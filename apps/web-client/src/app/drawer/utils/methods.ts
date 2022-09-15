import * as cytoscape from 'cytoscape';
import {
  AddNodeSuccessEvent,
  AddNodeToEdgeSuccessEvent,
  DeleteEdgeEvent,
  DeleteEdgeSuccessEvent,
  DeleteNodeEvent,
  DeleteNodeSuccessEvent,
  DrawerEvent,
  InitEvent,
  UpdateNodeEvent,
  ViewNodeEvent,
} from './types';

export const createNode = (
  graph: cytoscape.Core,
  nodeData: cytoscape.NodeDataDefinition
) => {
  graph.add({ data: nodeData, group: 'nodes', classes: 'bp-bd-node' });
};

export const isInitEvent = (event: DrawerEvent): event is InitEvent => {
  return event.type === 'Init';
};

export const isAddNodeSuccessEvent = (
  event: DrawerEvent
): event is AddNodeSuccessEvent => {
  return event.type === 'AddNodeSuccess';
};

export const isAddNodeToEdgeSuccessEvent = (
  event: DrawerEvent
): event is AddNodeToEdgeSuccessEvent => {
  return event.type === 'AddNodeToEdgeSuccess';
};

export const isUpdateNodeEvent = (
  event: DrawerEvent
): event is UpdateNodeEvent => {
  return event.type === 'UpdateNode';
};

export const isDeleteNodeEvent = (
  event: DrawerEvent
): event is DeleteNodeEvent => {
  return event.type === 'DeleteNode';
};

export const isDeleteNodeSuccessEvent = (
  event: DrawerEvent
): event is DeleteNodeSuccessEvent => {
  return event.type === 'DeleteNodeSuccess';
};

export const isViewNodeEvent = (event: DrawerEvent): event is ViewNodeEvent => {
  return event.type === 'ViewNode';
};

export const isDeleteEdgeEvent = (
  event: DrawerEvent
): event is DeleteEdgeEvent => {
  return event.type === 'DeleteEdge';
};

export const isDeleteEdgeSuccessEvent = (
  event: DrawerEvent
): event is DeleteEdgeSuccessEvent => {
  return event.type === 'DeleteEdgeSuccess';
};

export const createGraph = (
  container: HTMLElement,
  nodes: cytoscape.NodeDefinition[],
  edges: cytoscape.EdgeDefinition[]
) =>
  cytoscape({
    container,
    boxSelectionEnabled: false,
    autounselectify: true,
    style: [
      // Style all nodes/edges
      {
        selector: 'node[label]',
        style: {
          width: 280,
          height: 85,
          'background-width': '280px',
          'background-height': '85px',
          'border-color': '#565656',
          'border-width': 0,
          'border-opacity': 0,
          'background-opacity': 0,
          'font-size': '12px',
          shape: 'round-rectangle',
          'text-valign': 'center',
          'text-halign': 'center',
          'text-max-width': '150px',
          'text-wrap': 'wrap',
          'text-margin-x': 10,
          'text-margin-y': -5,
          'text-justification': 'left',
          'line-height': 1.3,
          'background-position-x': '0',
          'background-image': 'url(assets/images/node.png)',
          color: 'white',
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
    elements: nodes
      .map<cytoscape.ElementDefinition>((node) => ({
        data: node.data,
        group: 'nodes' as const,
        classes: 'bp-bd-node',
      }))
      .concat(
        edges.map((edge) => ({
          data: edge.data,
          group: 'edges' as const,
        }))
      ),
  }).nodeHtmlLabel([
    {
      query: '.bp-bd-node',
      tpl: function (data: { label: string; kind: string; image: string }) {
        return (
          `
        <div class="bd-custom-node">
          <div class="bd-custom-node-image" 
            style="
                  --bd-bg-image: ` +
          data.image +
          `; 
                  --bd-bg-width: 55px;
                  "
          > </div>
          <div class="bd-custom-node-text">
            <p> ` +
          data.kind +
          `</p>
            <h1>` +
          data.label +
          `</h1>
          </div>
        </div>
        `
        );
      },
    },
  ]);
