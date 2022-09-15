export interface Node {
  id: string;
  kind: string;
  label: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface Graph {
  id: string;
  nodes: Node[];
  edges: Edge[];
  lastEventId: string;
}

export type Direction = 'vertical' | 'horizontal';

export type EventDto = {
  type: string;
  payload: unknown;
};

export interface InitEvent {
  type: 'Init';
}

export interface AddNodeSuccessEvent {
  type: 'AddNodeSuccess';
  payload: {
    id: string;
    kind: string;
    label: string;
    image: string;
  };
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
    node: {
      id: string;
      kind: string;
      label: string;
      image: string;
    };
  };
}

export interface UpdateNodeEvent {
  type: 'UpdateNode';
  payload: string;
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

export type DrawerEvent =
  | InitEvent
  | AddNodeSuccessEvent
  | AddEdgeSuccessEvent
  | AddNodeToEdgeSuccessEvent
  | UpdateNodeEvent
  | DeleteNodeEvent
  | DeleteNodeSuccessEvent
  | ViewNodeEvent
  | DeleteEdgeEvent
  | DeleteEdgeSuccessEvent;
