import { inject, Injectable } from '@angular/core';
import {
  collectionData,
  collectionGroup,
  doc,
  docData,
  DocumentData,
  documentId,
  DocumentReference,
  endAt,
  Firestore,
  orderBy,
  query,
  startAt,
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { Entity } from '../utils';

export type WorkspaceDto = Entity<{ name: string }>;

@Injectable({ providedIn: 'root' })
export class WorkspaceApiService {
  private readonly _firestore = inject(Firestore);

  getWorkspace(workspaceId: string): Observable<WorkspaceDto> {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);

    return docData(workspaceRef).pipe(
      map((workspace) => ({
        id: workspaceId,
        name: workspace['name'],
      }))
    );
  }

  getFavoriteWorkspaceIds(userId: string) {
    const userRef = doc(this._firestore, `users/${userId}`);

    return collectionData(
      query(
        collectionGroup(this._firestore, 'favorite-workspaces').withConverter<
          DocumentReference<DocumentData>
        >({
          fromFirestore: (snapshot) => snapshot.data()['workspaceRef'],
          toFirestore: (it: DocumentData) => it,
        }),
        orderBy(documentId()),
        startAt(userRef.path),
        endAt(userRef.path + '\uf8ff')
      )
    ).pipe(
      map((favoriteWorkspacesRefs) =>
        favoriteWorkspacesRefs.map(
          (favoriteWorkspacesRef) => favoriteWorkspacesRef.id
        )
      )
    );
  }

  getWorkspaceApplicationIds(workspaceId: string) {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);

    return collectionData(
      query(
        collectionGroup(this._firestore, 'applications').withConverter<
          DocumentReference<DocumentData>
        >({
          fromFirestore: (snapshot) => snapshot.data()['applicationRef'],
          toFirestore: (it: DocumentData) => it,
        }),
        orderBy(documentId()),
        startAt(workspaceRef.path),
        endAt(workspaceRef.path + '\uf8ff')
      )
    ).pipe(
      map((applicationsRefs) =>
        applicationsRefs.map((applicationRef) => applicationRef.id)
      )
    );
  }
}
