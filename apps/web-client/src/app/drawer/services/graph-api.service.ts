import { inject } from '@angular/core';
import { Entity } from '../../shared/utils';
import { DefaultGraphDataType, DefaultNodeDataType } from '../utils';
import { EventApiService } from './event-api.service';

export type CreateGraphDto<T> = T &
  Entity<{
    kind: string;
  }>;

export type UpdateGraphDto<T> = {
  changes: Partial<T>;
  kind: string;
  referenceIds: string[];
};

export type DeleteGraphDto = {
  kind: string;
  referenceIds: string[];
};

export interface UpdateGraphThumbnailDto {
  fileId: string;
  fileUrl: string;
  kind: string;
  referenceIds: string[];
}

export type CreateNodeDto<T> = T &
  Entity<{
    parentIds: string[];
    kind: string;
    graphId: string;
    referenceIds: string[];
  }>;

export type UpdateNodeDto<T> = {
  changes: Partial<T>;
  parentIds: string[];
  kind: string;
  graphId: string;
  referenceIds: string[];
};

export interface DeleteNodeDto {
  parentIds: string[];
  kind: string;
  graphId: string;
  referenceIds: string[];
}

export interface UpdateNodeThumbnailDto {
  fileId: string;
  fileUrl: string;
  parentIds: string[];
  kind: string;
  graphId: string;
  referenceIds: string[];
}

export class GraphApiService<T extends DefaultGraphDataType> {
  private readonly _eventApiService = inject(EventApiService);

  createGraph(clientId: string, payload: CreateGraphDto<T>) {
    return this._eventApiService.emit(clientId, {
      type: 'createGraph',
      payload,
    });
  }

  updateGraph(
    clientId: string,
    id: string,
    payload: UpdateGraphDto<DefaultGraphDataType>
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'updateGraph',
      payload: {
        ...payload,
        id,
      },
    });
  }

  deleteGraph(clientId: string, id: string, payload: DeleteGraphDto) {
    return this._eventApiService.emit(clientId, {
      type: 'deleteGraph',
      payload: { ...payload, id },
    });
  }

  updateGraphThumbnail(
    clientId: string,
    id: string,
    payload: UpdateGraphThumbnailDto
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'updateGraphThumbnail',
      payload: { ...payload, id },
    });
  }

  createNode(clientId: string, payload: CreateNodeDto<DefaultNodeDataType>) {
    return this._eventApiService.emit(clientId, {
      type: 'createNode',
      payload: payload,
    });
  }

  updateNode(
    clientId: string,
    id: string,
    payload: UpdateNodeDto<DefaultNodeDataType>
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'updateNode',
      payload: {
        ...payload,
        id,
      },
    });
  }

  updateNodeThumbnail(
    clientId: string,
    id: string,
    payload: UpdateNodeThumbnailDto
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'updateNodeThumbnail',
      payload: { ...payload, id },
    });
  }

  deleteNode(clientId: string, id: string, payload: DeleteNodeDto) {
    return this._eventApiService.emit(clientId, {
      type: 'deleteNode',
      payload: { ...payload, id },
    });
  }
}
