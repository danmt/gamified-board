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

export type ApplicationDto = Entity<{ name: string; workspaceId: string }>;

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
}
