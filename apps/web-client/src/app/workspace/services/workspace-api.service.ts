import { inject, Injectable } from '@angular/core';
import {
  collectionData,
  collectionGroup,
  deleteDoc,
  doc,
  docData,
  DocumentData,
  documentId,
  DocumentReference,
  endAt,
  Firestore,
  orderBy,
  query,
  runTransaction,
  startAt,
  updateDoc,
} from '@angular/fire/firestore';
import { defer, from, map, Observable } from 'rxjs';
import { Entity } from '../../shared/utils';
import { WorkspaceDto } from '../utils';

export type CreateWorkspaceDto = Entity<{
  name: string;
}>;

export type UpdateWorkspaceDto = Partial<{
  name: string;
}>;

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

    console.log('da fu');

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

  createWorkspace(userId: string, { id, name }: CreateWorkspaceDto) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const newWorkspaceRef = doc(this._firestore, `workspaces/${id}`);
          const newFavoriteWorkspaceRef = doc(
            this._firestore,
            `users/${userId}/favorite-workspaces/${id}`
          );

          // create the new workspace
          transaction.set(newWorkspaceRef, {
            name,
          });

          // push workspace to user favorite workspaces
          transaction.set(newFavoriteWorkspaceRef, {
            workspaceRef: newWorkspaceRef,
          });

          return {};
        })
      )
    );
  }

  updateWorkspace(workspaceId: string, changes: UpdateWorkspaceDto) {
    return defer(() =>
      from(
        updateDoc(doc(this._firestore, `workspaces/${workspaceId}`), changes)
      )
    );
  }

  deleteWorkspace(workspaceId: string, userId: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const workspaceRef = doc(
            this._firestore,
            `workspaces/${workspaceId}`
          );
          const favoriteWorkspaceRef = doc(
            this._firestore,
            `users/${userId}/favorite-workspaces/${workspaceId}`
          );

          // delete workspace
          transaction.delete(workspaceRef);

          // remove workspace from user favorite workspaces
          transaction.delete(favoriteWorkspaceRef);

          return {};
        })
      )
    );
  }

  removeWorkspaceFromFavorites(workspaceId: string, userId: string) {
    return defer(() =>
      from(
        deleteDoc(
          doc(
            this._firestore,
            `users/${userId}/favorite-workspaces/${workspaceId}`
          )
        )
      )
    );
  }
}
