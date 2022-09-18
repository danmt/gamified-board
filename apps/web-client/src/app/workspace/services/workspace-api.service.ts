import { inject, Injectable } from '@angular/core';
import {
  collectionData,
  collectionGroup,
  doc,
  docData,
  documentId,
  Firestore,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { EventApiService } from '../../drawer/services';
import { Entity } from '../../shared/utils';
import { WorkspaceGraph } from '../utils';

export type CreateWorkspaceDto = Entity<{
  name: string;
}>;

export type UpdateWorkspaceDto = Partial<{
  name: string;
}>;

export interface UpdateWorkspaceThumbnailDto {
  fileId: string;
  fileUrl: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceApiService {
  private readonly _firestore = inject(Firestore);
  private readonly _eventApiService = inject(EventApiService);

  getWorkspace(workspaceId: string): Observable<WorkspaceGraph> {
    const workspaceRef = doc(this._firestore, `graphs/${workspaceId}`);

    return docData(workspaceRef).pipe(
      map((workspace) => ({
        id: workspaceId,
        kind: workspace['kind'],
        name: workspace['name'],
        thumbnailUrl: workspace['thumbnailUrl'],
        nodes: workspace['nodes'],
        edges: workspace['edges'],
      }))
    );
  }

  getWorkspacesByOwner(ownerId: string): Observable<WorkspaceGraph[]> {
    return collectionData(
      query(
        collectionGroup(this._firestore, 'graphs').withConverter({
          fromFirestore: (snapshot) => {
            const data = snapshot.data();

            return {
              id: snapshot.id,
              kind: data['kind'],
              name: data['name'],
              thumbnailUrl: data['thumbnailUrl'],
              nodes: data['nodes'],
              edges: data['edges'],
            };
          },
          toFirestore: (it) => it,
        }),
        where('userId', '==', ownerId),
        where('kind', '==', 'workspace'),
        orderBy(documentId())
      )
    );
  }

  createWorkspace(
    clientId: string,
    userId: string,
    { id, name }: CreateWorkspaceDto
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'createWorkspace',
      payload: {
        id,
        name,
        userId,
      },
      graphIds: [id],
    });
  }

  updateWorkspace(clientId: string, id: string, changes: UpdateWorkspaceDto) {
    return this._eventApiService.emit(clientId, {
      type: 'updateWorkspace',
      payload: {
        id,
        changes,
      },
      graphIds: [id],
    });
  }

  deleteWorkspace(clientId: string, id: string) {
    return this._eventApiService.emit(clientId, {
      type: 'deleteWorkspace',
      payload: { id },
      graphIds: [id],
    });
  }

  updateWorkspaceThumbnail(
    clientId: string,
    id: string,
    { fileId, fileUrl }: UpdateWorkspaceThumbnailDto
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'updateWorkspaceThumbnail',
      payload: { id, fileId, fileUrl },
      graphIds: [id],
    });
  }
}
