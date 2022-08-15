import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { v4 as uuid } from 'uuid';

@Injectable({ providedIn: 'root' })
export class CollectionApiService {
  private readonly _firestore = inject(Firestore);

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
