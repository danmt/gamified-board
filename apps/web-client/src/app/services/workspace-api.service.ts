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
  where,
} from '@angular/fire/firestore';
import { defer, from, map, Observable } from 'rxjs';
import { Entity } from '../utils';
import { ApplicationDto } from './application-api.service';
import { CollectionDto } from './collection-api.service';
import { InstructionDto } from './instruction-api.service';

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

  getWorkspaceApplications(workspaceId: string): Observable<ApplicationDto[]> {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);

    return collectionData(
      query(
        collectionGroup(this._firestore, 'applications').withConverter({
          fromFirestore: (snapshot) => {
            const data = snapshot.data();

            return {
              id: snapshot.id,
              name: data['name'],
              thumbnailUrl: data['thumbnailUrl'],
              workspaceId,
            };
          },
          toFirestore: (it) => it,
        }),
        where('workspaceRef', '==', workspaceRef),
        orderBy(documentId())
      )
    );
  }

  getWorkspaceCollections(workspaceId: string): Observable<CollectionDto[]> {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);

    return collectionData(
      query(
        collectionGroup(this._firestore, 'collections').withConverter({
          fromFirestore: (snapshot) => {
            const data = snapshot.data();

            return {
              id: snapshot.id,
              name: data['name'],
              thumbnailUrl: data['thumbnailUrl'],
              attributes: data['attributes'] ?? [],
              workspaceId,
              applicationId: data['applicationRef'].id,
            };
          },
          toFirestore: (it) => it,
        }),
        where('workspaceRef', '==', workspaceRef),
        orderBy(documentId())
      )
    );
  }

  getWorkspaceInstructions(workspaceId: string): Observable<InstructionDto[]> {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);

    return collectionData(
      query(
        collectionGroup(this._firestore, 'instructions').withConverter({
          fromFirestore: (snapshot) => {
            const data = snapshot.data();

            return {
              id: snapshot.id,
              name: data['name'],
              thumbnailUrl: data['thumbnailUrl'],
              arguments: data['arguments'] ?? [],
              documents: data['documents'] ?? [],
              tasksOrder: data['tasksOrder'] ?? [],
              workspaceId,
              applicationId: data['applicationRef'].id,
            };
          },
          toFirestore: (it) => it,
        }),
        where('workspaceRef', '==', workspaceRef),
        orderBy(documentId())
      )
    );
  }

  createWorkspace(userId: string, newWorkspaceId: string, name: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
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

  updateWorkspace(workspaceId: string, name: string) {
    return defer(() =>
      from(
        updateDoc(doc(this._firestore, `workspaces/${workspaceId}`), { name })
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
