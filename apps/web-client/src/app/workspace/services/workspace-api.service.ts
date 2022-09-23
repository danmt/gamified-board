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
import { WorkspaceDto } from '../utils';

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

  getWorkspace(workspaceId: string): Observable<WorkspaceDto> {
    const workspaceRef = doc(this._firestore, `graphs/${workspaceId}`);

    return docData(workspaceRef).pipe(
      map((workspace) => ({
        id: workspaceId,
        data: workspace['data'],
      }))
    );
  }

  getWorkspacesByOwner(ownerId: string): Observable<WorkspaceDto[]> {
    return collectionData(
      query(
        collectionGroup(this._firestore, 'graphs').withConverter({
          fromFirestore: (snapshot) => {
            const workspace = snapshot.data();

            return {
              id: snapshot.id,
              data: workspace['data'],
            };
          },
          toFirestore: (it) => it,
        }),
        where('data.userId', '==', ownerId),
        where('kind', '==', 'workspace'),
        orderBy(documentId())
      )
    );
  }

  saveCheckpoint(
    clientId: string,
    checkPointId: string,
    workspaceId: string,
    applicationId: string,
    checkpointName: string
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'saveCheckpoint',
      payload: {
        id: checkPointId,
        name: checkpointName,
        applicationId,
        workspaceId,
      },
    });
  }
}
