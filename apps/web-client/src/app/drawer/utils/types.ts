export interface Node {
  id: string;
  kind: string;
  label: string;
  ref: string;
  name: string;
  thumbnailUrl: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface Graph {
  id: string;
  name: string;
  kind: string;
  thumbnailUrl: string;
  nodes: Node[];
  edges: Edge[];
  lastEventId: string;
}

export type Direction = 'vertical' | 'horizontal';

export type EventDto = {
  type: string;
  payload: unknown;
  graphIds: string[];
};

export type DrawerEventName =
  | 'Init'
  | 'Click'
  | 'OneTapNode'
  | 'OneTapEdge'
  | 'AddNodeSuccess'
  | 'AddEdgeSuccess'
  | 'AddNodeToEdgeSuccess'
  | 'UpdateNode'
  | 'DeleteNode'
  | 'DeleteNodeSuccess'
  | 'ViewNode'
  | 'DeleteEdge'
  | 'DeleteEdgeSuccess'
  | 'GraphScrolled';

export interface InitEvent {
  type: 'Init';
}

export interface ClickEvent {
  type: 'Click';
  payload: { x: number; y: number };
}

export interface OneTapNodeEvent {
  type: 'OneTapNode';
  payload: Node;
}

export interface OneTapEdgeEvent {
  type: 'OneTapEdge';
  payload: string;
}

export interface UpdateGraphSuccessEvent {
  type: 'UpdateGraphSuccess';
  payload: Partial<Omit<Graph, 'id'>>;
}

export interface UpdateGraphThumbnailSuccessEvent {
  type: 'UpdateGraphThumbnailSuccess';
  payload: {
    fileId: string;
    fileUrl: string;
  };
}

export interface AddNodeSuccessEvent {
  type: 'AddNodeSuccess';
  payload: Node;
}

export interface AddEdgeSuccessEvent {
  type: 'AddEdgeSuccess';
  payload: {
    id: string;
    source: string;
    target: string;
  };
}

export interface AddNodeToEdgeSuccessEvent {
  type: 'AddNodeToEdgeSuccess';
  payload: {
    source: string;
    target: string;
    edgeId: string;
    node: Node;
  };
}

export interface UpdateNodeEvent {
  type: 'UpdateNode';
  payload: string;
}

export interface UpdateNodeSuccessEvent {
  type: 'UpdateNodeSuccess';
  payload: {
    id: string;
    changes: Partial<Omit<Node, 'id'>>;
  };
}

export interface UpdateNodeThumbnailSuccessEvent {
  type: 'UpdateNodeThumbnailSuccess';
  payload: {
    id: string;
    fileId: string;
    fileUrl: string;
  };
}

export interface DeleteNodeEvent {
  type: 'DeleteNode';
  payload: string;
}

export interface DeleteNodeSuccessEvent {
  type: 'DeleteNodeSuccess';
  payload: string;
}

export interface ViewNodeEvent {
  type: 'ViewNode';
  payload: string;
}

export interface DeleteEdgeEvent {
  type: 'DeleteEdge';
  payload: string;
}

export interface DeleteEdgeSuccessEvent {
  type: 'DeleteEdgeSuccess';
  payload: string;
}

export interface GraphScrolledEvent {
  type: 'GraphScrolled';
  payload: {
    zoomSize: string;
  };
}

export interface PanDraggedEvent {
  type: 'PanDragged';
  payload: {
    x: string;
    y: string;
  };
}

export type DrawerEvent =
  | InitEvent
  | ClickEvent
  | UpdateGraphSuccessEvent
  | UpdateGraphThumbnailSuccessEvent
  | AddNodeSuccessEvent
  | AddEdgeSuccessEvent
  | AddNodeToEdgeSuccessEvent
  | UpdateNodeEvent
  | UpdateNodeSuccessEvent
  | UpdateNodeThumbnailSuccessEvent
  | DeleteNodeEvent
  | DeleteNodeSuccessEvent
  | ViewNodeEvent
  | DeleteEdgeEvent
  | DeleteEdgeSuccessEvent
  | GraphScrolledEvent
  | PanDraggedEvent
  | OneTapNodeEvent
  | OneTapEdgeEvent;
