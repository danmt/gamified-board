export interface NodeDataType {
  name: string;
  thumbnailUrl: string;
}

export interface Node<T = NodeDataType> {
  id: string;
  data: T;
  kind: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface GraphDataType {
  name: string;
  thumbnailUrl: string;
}

export type Graph<T extends GraphDataType, U extends NodeDataType> = {
  id: string;
  nodes: Node<U>[];
  edges: Edge[];
  lastEventId: string;
  kind: string;
  data: T;
};

export type Direction = 'vertical' | 'horizontal';

export type EventDto = {
  type: string;
  payload: unknown;
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

export interface OneTapNodeEvent<T extends NodeDataType> {
  type: 'OneTapNode';
  payload: Node<T>;
}

export interface OneTapEdgeEvent {
  type: 'OneTapEdge';
  payload: string;
}

export interface UpdateGraphSuccessEvent<T extends GraphDataType> {
  type: 'UpdateGraphSuccess';
  payload: {
    changes: Partial<T>;
    kind: string;
  };
}

export interface UpdateGraphThumbnailSuccessEvent {
  type: 'UpdateGraphThumbnailSuccess';
  payload: {
    fileId: string;
    fileUrl: string;
    kind: string;
  };
}

export interface AddNodeSuccessEvent<T extends NodeDataType> {
  type: 'AddNodeSuccess';
  payload: Node<T>;
}

export interface AddEdgeSuccessEvent {
  type: 'AddEdgeSuccess';
  payload: {
    id: string;
    source: string;
    target: string;
  };
}

export interface AddNodeToEdgeSuccessEvent<T extends NodeDataType> {
  type: 'AddNodeToEdgeSuccess';
  payload: {
    source: string;
    target: string;
    edgeId: string;
    node: Node<T>;
  };
}

export interface UpdateNodeEvent {
  type: 'UpdateNode';
  payload: string;
}

export interface UpdateNodeSuccessEvent<T extends NodeDataType> {
  type: 'UpdateNodeSuccess';
  payload: {
    id: string;
    changes: Partial<T>;
    kind: string;
  };
}

export interface UpdateNodeThumbnailSuccessEvent {
  type: 'UpdateNodeThumbnailSuccess';
  payload: {
    id: string;
    fileId: string;
    fileUrl: string;
    kind: string;
  };
}

export interface DeleteNodeEvent {
  type: 'DeleteNode';
  payload: string;
}

export interface DeleteNodeSuccessEvent {
  type: 'DeleteNodeSuccess';
  payload: {
    id: string;
    kind: string;
  };
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

export type DrawerEvent<T extends GraphDataType, U extends NodeDataType> =
  | InitEvent
  | ClickEvent
  | UpdateGraphSuccessEvent<T>
  | UpdateGraphThumbnailSuccessEvent
  | AddNodeSuccessEvent<U>
  | AddEdgeSuccessEvent
  | AddNodeToEdgeSuccessEvent<U>
  | UpdateNodeEvent
  | UpdateNodeSuccessEvent<U>
  | UpdateNodeThumbnailSuccessEvent
  | DeleteNodeEvent
  | DeleteNodeSuccessEvent
  | ViewNodeEvent
  | DeleteEdgeEvent
  | DeleteEdgeSuccessEvent
  | GraphScrolledEvent
  | PanDraggedEvent
  | OneTapNodeEvent<U>
  | OneTapEdgeEvent;
