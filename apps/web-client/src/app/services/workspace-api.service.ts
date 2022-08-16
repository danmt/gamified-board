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
} from '@angular/fire/firestore';
import { defer, from, map, Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
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

  createWorkspace(userId: string, name: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const newWorkspaceId = uuid();
          const newWorkspaceRef = doc(
            this._firestore,
            `workspaces/${newWorkspaceId}`
          );
          const newFavoriteWorkspaceRef = doc(
            this._firestore,
            `users/${userId}/favorite-workspaces/${newWorkspaceId}`
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
    deleteDoc(
      doc(this._firestore, `users/${userId}/favorite-workspaces/${workspaceId}`)
    );

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
