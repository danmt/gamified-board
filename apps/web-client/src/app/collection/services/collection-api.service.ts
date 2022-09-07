import { inject, Injectable } from '@angular/core';
import {
  deleteDoc,
  doc,
  docData,
  Firestore,
  runTransaction,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { combineLatest, defer, from, map, Observable, of } from 'rxjs';
import { Entity } from '../../shared/utils';

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

export type CreateCollectionDto = Entity<{
  name: string;
  applicationId: string;
  workspaceId: string;
  attributes: CollectionAttributeDto[];
}>;

export type UpdateCollectionDto = Partial<{
  name: string;
  attributes: CollectionAttributeDto[];
}>;

export interface UpdateCollectionThumbnailDto {
  fileId: string;
  fileUrl: string;
}

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

  createCollection({
    id,
    workspaceId,
    applicationId,
    name,
    attributes,
  }: CreateCollectionDto) {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );
    const newCollectionRef = doc(this._firestore, `collections/${id}`);

    return defer(() =>
      from(
        setDoc(newCollectionRef, {
          name,
          applicationRef,
          workspaceRef,
          thumbnailUrl: null,
          attributes,
        })
      )
    );
  }

  updateCollection(collectionId: string, changes: UpdateCollectionDto) {
    const collectionRef = doc(this._firestore, `collections/${collectionId}`);

    return defer(() => from(updateDoc(collectionRef, changes)));
  }

  updateCollectionThumbnail(
    collectionId: string,
    { fileId, fileUrl }: UpdateCollectionThumbnailDto
  ) {
    const collectionRef = doc(this._firestore, `collections/${collectionId}`);
    const uploadRef = doc(this._firestore, `uploads/${fileId}`);

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          transaction.set(uploadRef, {
            kind: 'collection',
            ref: collectionId,
          });
          transaction.update(collectionRef, { thumbnailUrl: fileUrl });

          return true;
        })
      )
    );
  }
}
