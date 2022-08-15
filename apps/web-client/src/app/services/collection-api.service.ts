import { inject, Injectable } from '@angular/core';
import {
  doc,
  docData,
  Firestore,
  runTransaction,
} from '@angular/fire/firestore';
import { combineLatest, defer, from, map, Observable, of } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Entity } from '../utils';

export type CollectionDto = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
}>;

@Injectable({ providedIn: 'root' })
export class CollectionApiService {
  private readonly _firestore = inject(Firestore);

  getCollection(collectionId: string): Observable<CollectionDto> {
    return docData(doc(this._firestore, `collections/${collectionId}`)).pipe(
      map((collection) => ({
        id: collectionId,
        name: collection['name'],
        thumbnailUrl: collection['thumbnailUrl'],
        applicationId: collection['applicationRef'].id,
        workspaceId: collection['workspaceRef'].id,
      }))
    );
  }

  getCollections(collectionIds: string[]): Observable<CollectionDto[]> {
    if (collectionIds.length === 0) {
      return of([]);
    }

    return combineLatest(
      collectionIds.map((collectionId) => this.getCollection(collectionId))
    );
  }

  deleteCollection(applicationId: string, collectionId: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const applicationCollectionRef = doc(
            this._firestore,
            `applications/${applicationId}/collections/${collectionId}`
          );
          const collectionRef = doc(
            this._firestore,
            `collections/${collectionId}`
          );
          transaction.delete(applicationCollectionRef);
          transaction.delete(collectionRef);

          return {};
        })
      )
    );
  }

  createCollection(workspaceId: string, applicationId: string, name: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const workspaceRef = doc(
            this._firestore,
            `workspaces/${workspaceId}`
          );
          const applicationRef = doc(
            this._firestore,
            `applications/${applicationId}`
          );
          const newCollectionId = uuid();
          const newCollectionRef = doc(
            this._firestore,
            `collections/${newCollectionId}`
          );
          const newApplicationCollectionRef = doc(
            this._firestore,
            `applications/${applicationId}/collections/${newCollectionId}`
          );

          // create the new collection
          transaction.set(newCollectionRef, {
            name,
            applicationRef,
            workspaceRef,
            thumbnailUrl: `assets/workspaces/${workspaceId}/${applicationId}/${newCollectionId}.png`,
          });

          // push collection to application collections
          transaction.set(newApplicationCollectionRef, {
            collectionRef: newCollectionRef,
          });

          return {};
        })
      )
    );
  }
}
