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
  runTransaction,
  startAt,
  updateDoc,
} from '@angular/fire/firestore';
import { defer, from, map, Observable } from 'rxjs';
import { Entity } from '../utils';

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
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const workspaceRef = doc(
            this._firestore,
            `workspaces/${workspaceId}`
          );
          const newApplicationRef = doc(
            this._firestore,
            `applications/${newApplicationId}`
          );
          const newWorkspaceApplicationRef = doc(
            this._firestore,
            `workspaces/${workspaceId}/applications/${newApplicationId}`
          );

          // create the new application
          transaction.set(newApplicationRef, {
            name,
            thumbnailUrl,
            workspaceRef,
          });

          // push application to workspace applications
          transaction.set(newWorkspaceApplicationRef, {
            applicationRef: newApplicationRef,
          });

          return {};
        })
      )
    );
  }

  updateApplication(applicationId: string, name: string, thumbnailUrl: string) {
    return defer(() =>
      from(
        updateDoc(doc(this._firestore, `applications/${applicationId}`), {
          name,
          thumbnailUrl,
        })
      )
    );
  }

  deleteApplication(applicationId: string, workspaceId: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const applicationRef = doc(
            this._firestore,
            `applications/${applicationId}`
          );
          const workspaceApplicationRef = doc(
            this._firestore,
            `workspaces/${workspaceId}/applications/${applicationId}`
          );

          // delete application
          transaction.delete(applicationRef);

          // remove application from workspace applications
          transaction.delete(workspaceApplicationRef);

          return {};
        })
      )
    );
  }
}
