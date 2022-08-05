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
import { combineLatest, map, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApplicationApiService {
  private readonly _firestore = inject(Firestore);

  getWorkspaceApplications(workspaceId: string) {
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
      switchMap((applicationsRefs) =>
        combineLatest(
          applicationsRefs.map((applicationRef) =>
            docData(applicationRef).pipe(
              switchMap((application) =>
                combineLatest([
                  collectionData(
                    query(
                      collectionGroup(
                        this._firestore,
                        'collections'
                      ).withConverter<DocumentReference<DocumentData>>({
                        fromFirestore: (snapshot) =>
                          snapshot.data()['collectionRef'],
                        toFirestore: (it: DocumentReference<DocumentData>) =>
                          it,
                      }),
                      orderBy(documentId()),
                      startAt(applicationRef.path),
                      endAt(applicationRef.path + '\uf8ff')
                    )
                  ),
                  collectionData(
                    query(
                      collectionGroup(
                        this._firestore,
                        'instructions'
                      ).withConverter<DocumentReference<DocumentData>>({
                        fromFirestore: (snapshot) =>
                          snapshot.data()['instructionRef'],
                        toFirestore: (it: DocumentReference<DocumentData>) =>
                          it,
                      }),
                      orderBy(documentId()),
                      startAt(applicationRef.path),
                      endAt(applicationRef.path + '\uf8ff')
                    )
                  ),
                ]).pipe(
                  switchMap(([collectionsRefs, instructionsRefs]) =>
                    combineLatest([
                      combineLatest(
                        collectionsRefs.map((collectionRef) =>
                          docData(collectionRef).pipe(
                            map((collection) => ({
                              id: collectionRef.id,
                              name: collection['name'],
                            }))
                          )
                        )
                      ),
                      combineLatest(
                        instructionsRefs.map((instructionRef) =>
                          docData(instructionRef).pipe(
                            map((instruction) => ({
                              id: instructionRef.id,
                              name: instruction['name'],
                            }))
                          )
                        )
                      ),
                    ])
                  ),
                  map(([collections, instructions]) => ({
                    id: applicationRef.id,
                    name: application['name'],
                    collections,
                    instructions,
                  }))
                )
              )
            )
          )
        )
      )
    );
  }
}
