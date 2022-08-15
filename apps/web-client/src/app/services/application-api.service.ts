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
import { combineLatest, map, of, switchMap } from 'rxjs';
import { InstructionApiService } from './instruction-api.service';

@Injectable({ providedIn: 'root' })
export class ApplicationApiService {
  private readonly _firestore = inject(Firestore);
  private readonly _instructionApiService = inject(InstructionApiService);

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
                      collectionsRefs.length === 0
                        ? of([])
                        : combineLatest(
                            collectionsRefs.map((collectionRef) =>
                              docData(collectionRef).pipe(
                                map((collection) => ({
                                  id: collectionRef.id,
                                  name: collection['name'],
                                  thumbnailUrl: collection['thumbnailUrl'],
                                  workspaceId,
                                  applicationId: applicationRef.id,
                                }))
                              )
                            )
                          ),
                      instructionsRefs.length === 0
                        ? of([])
                        : combineLatest(
                            instructionsRefs.map((instructionRef) =>
                              docData(instructionRef).pipe(
                                map((instruction) => ({
                                  id: instructionRef.id,
                                  name: instruction['name'],
                                  thumbnailUrl: instruction['thumbnailUrl'],
                                  workspaceId,
                                  applicationId: applicationRef.id,
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

  getApplicationInstructions(applicationId: string) {
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
      switchMap((instructionsRefs) => {
        if (instructionsRefs.length === 0) {
          return of([]);
        }

        return combineLatest(
          instructionsRefs.map((instructionRef) =>
            this._instructionApiService.getInstruction(instructionRef.id)
          )
        );
      })
    );
  }
}
