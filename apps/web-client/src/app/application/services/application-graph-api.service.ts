import { inject, Injectable } from '@angular/core';
import { EventApiService } from '../../drawer/services';
import { Entity } from '../../shared/utils';

export type CreateNodeDto = Entity<{
  name: string;
  kind: string;
  applicationId: string;
  workspaceId: string;
  isGraph: boolean;
}>;

export interface UpdateNodeDto {
  changes: Partial<{ name: string }>;
  isGraph: boolean;
}

export type DeleteNodeDto = Entity<{
  isGraph: boolean;
}>;

export interface UpdateNodeThumbnailDto {
  fileId: string;
  fileUrl: string;
  isGraph: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApplicationGraphApiService {
  private readonly _eventApiService = inject(EventApiService);

  createNode(clientId: string, payload: CreateNodeDto) {
    return this._eventApiService.emit(clientId, {
      type: 'createNode',
      payload: {
        ...payload,
        graphId: payload.applicationId,
      },
      graphIds: [payload.id, payload.applicationId],
    });
  }

  updateNode(
    clientId: string,
    graphId: string,
    id: string,
    payload: UpdateNodeDto
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
