import { inject } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { Entity, isNull, Option } from '../../shared/utils';
import { Graph, GraphDataType, NodeDataType } from '../utils';
import { EventApiService } from './event-api.service';

export type CreateGraphDto<T> = T &
  Entity<{
    isNode: boolean;
  }>;

export type UpdateGraphDto<T> = {
  changes: Partial<T>;
  isNode: boolean;
};

export interface UpdateGraphThumbnailDto {
  fileId: string;
  fileUrl: string;
  isNode: boolean;
}

export type CreateNodeDto<T> = T &
  Entity<{
    isGraph: boolean;
  }>;

export type UpdateNodeDto<T> = {
  changes: Partial<T>;
  isGraph: boolean;
};

export type DeleteNodeDto = Entity<{
  isGraph: boolean;
}>;

export interface UpdateNodeThumbnailDto {
  fileId: string;
  fileUrl: string;
  isGraph: boolean;
}

export class GraphApiService<T extends GraphDataType, U extends NodeDataType> {
  private readonly _firestore = inject(Firestore);
  private readonly _eventApiService = inject(EventApiService);

  async getGraph(graphId: string): Promise<Graph<T, U> | null> {
    const graphRef = doc(this._firestore, `graphs/${graphId}`);

    const graph = await getDoc(graphRef);
    const graphData = graph.data();

    if (graphData === undefined) {
      return null;
    }

    return {
      id: graph.id,
      nodes: graphData['nodes'],
      edges: graphData['edges'],
      lastEventId: graphData['lastEventId'],
      data: graphData['data'],
    };
  }

  createGraph(
    clientId: string,
    parentId: Option<string>,
    payload: T & { id: string; isNode: boolean }
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'createGraph',
      payload: {
        ...payload,
        parentId,
      },
      graphIds: isNull(parentId) ? [payload.id] : [payload.id, parentId],
    });
  }

  updateGraph(
    clientId: string,
    parentId: Option<string>,
    id: string,
    payload: UpdateGraphDto<GraphDataType>
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'updateGraph',
      payload: {
        ...payload,
        parentId,
        id,
      },
      graphIds: isNull(parentId) ? [id] : [id, parentId],
    });
  }

  deleteGraph(
    clientId: string,
    parentId: Option<string>,
    id: string,
    payload: { isNode: boolean }
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'deleteGraph',
      payload: { ...payload, id, parentId },
      graphIds: isNull(parentId) ? [id] : [id, parentId],
    });
  }

  updateGraphThumbnail(
    clientId: string,
    parentId: Option<string>,
    id: string,
    payload: UpdateGraphThumbnailDto
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'updateGraphThumbnail',
      payload: { ...payload, id, parentId },
      graphIds: isNull(parentId) ? [id] : [id, parentId],
    });
  }

  createNode(
    clientId: string,
    graphId: string,
    payload: CreateNodeDto<NodeDataType>
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'createNode',
      payload: {
        ...payload,
        graphId,
      },
      graphIds: [payload.id, graphId],
    });
  }

  updateNode(
    clientId: string,
    graphId: string,
    id: string,
    payload: UpdateNodeDto<NodeDataType>
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'updateNode',
      payload: {
        ...payload,
        id,
        graphId,
      },
      graphIds: [id, graphId],
    });
  }

  updateNodeThumbnail(
    clientId: string,
    graphId: string,
    id: string,
    payload: UpdateNodeThumbnailDto
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'updateNodeThumbnail',
      payload: { ...payload, id, graphId },
      graphIds: [id, graphId],
    });
  }

  deleteNode(
    clientId: string,
    graphId: string,
    id: string,
    payload: { isGraph: boolean }
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'deleteNode',
      payload: { ...payload, id, graphId },
      graphIds: [id, graphId],
    });
  }
}
