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
  setDoc,
  startAt,
  updateDoc,
} from '@angular/fire/firestore';
import { defer, from, map, Observable } from 'rxjs';
import { Entity } from '../../shared/utils';

export type ApplicationDto = Entity<{
  name: string;
  workspaceId: string;
  thumbnailUrl: string;
}>;

@Injectable({ providedIn: 'root' })
export class ApplicationApiService {
  private readonly _firestore = inject(Firestore);

  getApplication(applicationId: string): Observable<ApplicationDto> {
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );

    return docData(applicationRef).pipe(
      map((application) => ({
        id: applicationId,
        name: application['name'],
        workspaceId: application['workspaceRef'].id,
        thumbnailUrl: application['thumbnailUrl'],
      }))
    );
  }

  getApplicationInstructionIds(applicationId: string) {
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );

    return collectionData(
      query(
        collectionGroup(this._firestore, 'instructions').withConverter<
          DocumentReference<DocumentData>
        >({
          fromFirestore: (snapshot) => snapshot.data()['instructionRef'],
          toFirestore: (it: DocumentData) => it,
        }),
        orderBy(documentId()),
        startAt(applicationRef.path),
        endAt(applicationRef.path + '\uf8ff')
      )
    ).pipe(
      map((instructionsRefs) =>
        instructionsRefs.map((instructionRef) => instructionRef.id)
      )
    );
  }

  getApplicationCollectionIds(applicationId: string) {
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );

    return collectionData(
      query(
        collectionGroup(this._firestore, 'collections').withConverter<
          DocumentReference<DocumentData>
        >({
          fromFirestore: (snapshot) => snapshot.data()['collectionRef'],
          toFirestore: (it: DocumentData) => it,
        }),
        orderBy(documentId()),
        startAt(applicationRef.path),
        endAt(applicationRef.path + '\uf8ff')
      )
    ).pipe(
      map((collectionsRefs) =>
        collectionsRefs.map((collectionRef) => collectionRef.id)
      )
    );
  }

  createApplication(
    workspaceId: string,
    newApplicationId: string,
    name: string,
    thumbnailUrl: string
  ) {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);
    const newApplicationRef = doc(
      this._firestore,
      `applications/${newApplicationId}`
    );

    return defer(() =>
      from(
        setDoc(newApplicationRef, {
          name,
          thumbnailUrl,
          workspaceRef,
        })
      )
    );
  }

  updateApplication(applicationId: string, name: string, thumbnailUrl: string) {
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );

    return defer(() =>
      from(
        updateDoc(applicationRef, {
          name,
          thumbnailUrl,
        })
      )
    );
  }

  deleteApplication(applicationId: string) {
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );

    return defer(() => from(deleteDoc(applicationRef)));
  }
}
