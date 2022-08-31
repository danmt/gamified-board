import { inject, Injectable } from '@angular/core';
import {
  deleteDoc,
  doc,
  docData,
  Firestore,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { combineLatest, defer, from, map, Observable, of } from 'rxjs';
import { Entity } from '../utils';

export type CollectionAttributeDto = Entity<{
  name: string;
  type: string;
  isOption: boolean;
}>;

export type CollectionDto = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  attributes: CollectionAttributeDto[];
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
        attributes: collection['attributes'] ?? [],
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

  deleteCollection(collectionId: string) {
    const collectionRef = doc(this._firestore, `collections/${collectionId}`);

    return defer(() => from(deleteDoc(collectionRef)));
  }

  createCollection(
    workspaceId: string,
    applicationId: string,
    newCollectionId: string,
    name: string,
    thumbnailUrl: string,
    attributes: CollectionAttributeDto[]
  ) {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );
    const newCollectionRef = doc(
      this._firestore,
      `collections/${newCollectionId}`
    );

    return defer(() =>
      from(
        setDoc(newCollectionRef, {
          name,
          applicationRef,
          workspaceRef,
          thumbnailUrl,
          attributes,
        })
      )
    );
  }

  updateCollection(
    collectionId: string,
    name: string,
    thumbnailUrl: string,
    attributes: CollectionAttributeDto[]
  ) {
    const collectionRef = doc(this._firestore, `collections/${collectionId}`);

    return defer(() =>
      from(
        updateDoc(collectionRef, {
          name,
          thumbnailUrl,
          attributes,
        })
      )
    );
  }
}
