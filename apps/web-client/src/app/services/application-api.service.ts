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
            this.getInstruction(instructionRef.id)
          )
        );
      })
    );
  }

  getInstruction(instructionId: string) {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return combineLatest([
      docData(instructionRef),
      collectionData(
        query(
          collectionGroup(this._firestore, 'documents').withConverter<{
            id: string;
            name: string;
            collectionRef: DocumentReference<DocumentData>;
          }>({
            fromFirestore: (snapshot) => ({
              id: snapshot.id,
              name: snapshot.data()['name'] as string,
              collectionRef: snapshot.data()[
                'collectionRef'
              ] as DocumentReference<DocumentData>,
            }),
            toFirestore: (it: {
              id: string;
              name: string;
              collectionRef: DocumentReference<DocumentData>;
            }) => it,
          }),
          orderBy(documentId()),
          startAt(instructionRef.path),
          endAt(instructionRef.path + '\uf8ff')
        )
      ).pipe(
        switchMap((documents) => {
          if (documents.length === 0) {
            return of([]);
          }

          return combineLatest(
            documents.map((document) =>
              docData(document.collectionRef).pipe(
                map((collection) => ({
                  id: document.id,
                  name: document.name,
                  collection: {
                    id: document.collectionRef.id,
                    name: collection['name'],
                    workspaceId: collection['workspaceRef'].id,
                    applicationId: collection['applicationRef'].id,
                  },
                }))
              )
            )
          );
        })
      ),
      collectionData(
        query(
          collectionGroup(this._firestore, 'tasks').withConverter<{
            id: string;
            name: string;
            instructionRef: DocumentReference<DocumentData>;
          }>({
            fromFirestore: (snapshot) => ({
              id: snapshot.id,
              name: snapshot.data()['name'] as string,
              instructionRef: snapshot.data()[
                'instructionRef'
              ] as DocumentReference<DocumentData>,
            }),
            toFirestore: (it: {
              id: string;
              name: string;
              instructionRef: DocumentReference<DocumentData>;
            }) => it,
          }),
          orderBy(documentId()),
          startAt(instructionRef.path),
          endAt(instructionRef.path + '\uf8ff')
        )
      ).pipe(
        switchMap((tasks) => {
          if (tasks.length === 0) {
            return of([]);
          }

          return combineLatest(
            tasks.map((task) =>
              docData(task.instructionRef).pipe(
                map((instruction) => ({
                  id: task.id,
                  name: task.name,
                  instruction: {
                    id: task.instructionRef.id,
                    name: instruction['name'],
                    workspaceId: instruction['workspaceRef'].id,
                    applicationId: instruction['applicationRef'].id,
                  },
                }))
              )
            )
          );
        })
      ),
    ]).pipe(
      map(([instruction, documents, tasks]) => ({
        id: instructionRef.id,
        name: instruction['name'] as string,
        documents,
        tasks,
      }))
    );
  }
}
