export interface DefaultNodeDataType {
  name: string;
  thumbnailUrl: string;
}

export interface Node<K extends string, T = DefaultNodeDataType> {
  id: string;
  data: T;
  kind: K;
}

/* 

export interface Node<NodeTypes> {
  id: string;
  data: T;
  kind: string;
}


*/

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface DefaultGraphDataType {
  name: string;
  thumbnailUrl: string;
}

export type Graph<
  NodeKinds extends string,
  NodeDataType extends DefaultNodeDataType,
  GraphKind extends string,
  GraphDataType extends DefaultGraphDataType
> = {
  id: string;
  nodes: Node<NodeKinds, NodeDataType>[];
  edges: Edge[];
  lastEventId: string;
  kind: GraphKind;
  data: GraphDataType;
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

export interface OneTapNodeEvent<
  NodeKinds extends string,
  NodeDataType extends DefaultNodeDataType
> {
  type: 'OneTapNode';
  payload: Node<NodeKinds, NodeDataType>;
}

export interface OneTapEdgeEvent {
  type: 'OneTapEdge';
  payload: string;
}

export interface UpdateGraphSuccessEvent<
  GraphKind extends string,
  GraphDataType extends DefaultGraphDataType
> {
  type: 'UpdateGraphSuccess';
  payload: {
    changes: Partial<GraphDataType>;
    kind: GraphKind;
  };
}

export interface UpdateGraphThumbnailSuccessEvent<GraphKind extends string> {
  type: 'UpdateGraphThumbnailSuccess';
  payload: {
    fileId: string;
    fileUrl: string;
    kind: GraphKind;
  };
}

export interface AddNodeSuccessEvent<
  NodeKinds extends string,
  NodeDataType extends DefaultNodeDataType
> {
  type: 'AddNodeSuccess';
  payload: Node<NodeKinds, NodeDataType>;
}

export interface AddEdgeSuccessEvent {
  type: 'AddEdgeSuccess';
  payload: {
    id: string;
    source: string;
    target: string;
  };
}

export interface UpdateNodeEvent {
  type: 'UpdateNode';
  payload: string;
}

export interface UpdateNodeSuccessEvent<
  NodeKinds extends string,
  NodeDataType extends DefaultNodeDataType
> {
  type: 'UpdateNodeSuccess';
  payload: {
    id: string;
    changes: Partial<NodeDataType>;
    kind: NodeKinds;
  };
}

export interface UpdateNodeThumbnailSuccessEvent<NodeKinds extends string> {
  type: 'UpdateNodeThumbnailSuccess';
  payload: {
    id: string;
    fileId: string;
    fileUrl: string;
    kind: NodeKinds;
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

export type DrawerEvent<
  NodeKinds extends string,
  NodeDataType extends DefaultNodeDataType,
  GraphKind extends string,
  GraphDataType extends DefaultGraphDataType
> =
  | InitEvent
  | ClickEvent
  | UpdateGraphSuccessEvent<GraphKind, GraphDataType>
  | UpdateGraphThumbnailSuccessEvent<GraphKind>
  | AddNodeSuccessEvent<NodeKinds, NodeDataType>
  | AddEdgeSuccessEvent
  | UpdateNodeEvent
  | UpdateNodeSuccessEvent<NodeKinds, NodeDataType>
  | UpdateNodeThumbnailSuccessEvent<NodeKinds>
  | DeleteNodeEvent
  | DeleteNodeSuccessEvent
  | ViewNodeEvent
  | DeleteEdgeEvent
  | DeleteEdgeSuccessEvent
  | GraphScrolledEvent
  | PanDraggedEvent
  | OneTapNodeEvent<NodeKinds, NodeDataType>
  | OneTapEdgeEvent;
