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
import { PluginsService } from '../plugins';
import { Option } from '../utils';

@Injectable({ providedIn: 'root' })
export class ApplicationApiService {
  private readonly _firestore = inject(Firestore);
  private readonly _pluginsService = inject(PluginsService);

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
            collectionRef: Option<DocumentReference<DocumentData>>;
            isInternal: boolean;
            namespace: Option<string>;
            plugin: Option<string>;
            account: Option<string>;
          }>({
            fromFirestore: (snapshot) => ({
              id: snapshot.id,
              name: snapshot.data()['name'] as string,
              collectionRef:
                snapshot.data()['collectionRef'] ??
                (null as Option<DocumentReference<DocumentData>>),
              isInternal: snapshot.data()['isInternal'] as boolean,
              namespace:
                snapshot.data()['namespace'] ?? (null as Option<string>),
              plugin: snapshot.data()['plugin'] ?? (null as Option<string>),
              account: snapshot.data()['account'] ?? (null as Option<string>),
            }),
            toFirestore: (it: {
              id: string;
              name: string;
              collectionRef: Option<DocumentReference<DocumentData>>;
              isInternal: boolean;
              namespace: Option<string>;
              plugin: Option<string>;
              account: Option<string>;
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
            documents.map((document) => {
              const { isInternal, collectionRef } = document;

              if (isInternal) {
                if (collectionRef === null) {
                  throw new Error(
                    'CollectionRef is missing from internal document.'
                  );
                }

                return docData(collectionRef).pipe(
                  map((collection) => ({
                    id: document.id,
                    name: document.name,
                    collection: {
                      id: collectionRef.id,
                      name: collection['name'] as string,
                      isInternal: true,
                      thumbnailUrl: collection['thumbnailUrl'] as string,
                      workspaceId:
                        collection['workspaceRef'].id ??
                        (null as Option<string>),
                      applicationId:
                        collection['applicationRef'].id ??
                        (null as Option<string>),
                      namespace: null,
                      plugin: null,
                      account: null,
                    },
                  }))
                );
              } else {
                const plugin =
                  this._pluginsService.plugins.find(
                    (plugin) =>
                      plugin.namespace === document.namespace &&
                      plugin.name === document.plugin
                  ) ?? null;

                if (plugin === null) {
                  throw new Error('Plugin not found');
                }

                const account =
                  plugin.accounts.find(
                    (account) => account.name === document.account
                  ) ?? null;

                if (account === null) {
                  throw new Error('Account not found');
                }

                return of({
                  id: document.id,
                  name: document.name,
                  collection: {
                    id: account.name,
                    name: account.name,
                    isInternal: false,
                    namespace: document.namespace,
                    plugin: document.plugin,
                    account: document.account,
                    thumbnailUrl: `assets/plugins/${document.namespace}/${document.plugin}/accounts/${document.account}.png`,
                    workspaceId: null,
                    applicationId: null,
                  },
                });
              }
            })
          );
        })
      ),
      collectionData(
        query(
          collectionGroup(this._firestore, 'tasks').withConverter<{
            id: string;
            name: string;
            instructionRef: Option<DocumentReference<DocumentData>>;
            isInternal: boolean;
            namespace: Option<string>;
            plugin: Option<string>;
            instruction: Option<string>;
          }>({
            fromFirestore: (snapshot) => ({
              id: snapshot.id,
              name: snapshot.data()['name'] as string,
              instructionRef:
                snapshot.data()['instructionRef'] ??
                (null as Option<DocumentReference<DocumentData>>),
              isInternal: snapshot.data()['isInternal'] as boolean,
              namespace:
                snapshot.data()['namespace'] ?? (null as Option<string>),
              plugin: snapshot.data()['plugin'] ?? (null as Option<string>),
              instruction:
                snapshot.data()['instruction'] ?? (null as Option<string>),
            }),
            toFirestore: (it: {
              id: string;
              name: string;
              instructionRef: Option<DocumentReference<DocumentData>>;
              isInternal: boolean;
              namespace: Option<string>;
              plugin: Option<string>;
              instruction: Option<string>;
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
            tasks.map((task) => {
              const { isInternal, instructionRef } = task;

              if (isInternal) {
                if (instructionRef === null) {
                  throw new Error(
                    'InstructionRef is missing from internal task.'
                  );
                }

                return docData(instructionRef).pipe(
                  map((instruction) => ({
                    id: task.id,
                    name: task.name,
                    instruction: {
                      id: instructionRef.id,
                      name: instruction['name'] as string,
                      isInternal: true,
                      thumbnailUrl: instruction['thumbnailUrl'] as string,
                      workspaceId:
                        instruction['workspaceRef'].id ??
                        (null as Option<string>),
                      applicationId:
                        instruction['applicationRef'].id ??
                        (null as Option<string>),
                      namespace: null,
                      plugin: null,
                      instruction: null,
                    },
                  }))
                );
              } else {
                const plugin =
                  this._pluginsService.plugins.find(
                    (plugin) =>
                      plugin.namespace === task.namespace &&
                      plugin.name === task.plugin
                  ) ?? null;

                if (plugin === null) {
                  throw new Error('Plugin not found');
                }

                const instruction =
                  plugin.instructions.find(
                    (instruction) => instruction.name === task.instruction
                  ) ?? null;

                if (instruction === null) {
                  throw new Error('Account not found');
                }

                return of({
                  id: task.id,
                  name: task.name,
                  instruction: {
                    id: instruction.name,
                    name: instruction.name,
                    isInternal: false,
                    namespace: task.namespace,
                    plugin: task.plugin,
                    instruction: task.instruction,
                    thumbnailUrl: `assets/plugins/${task.namespace}/${task.plugin}/instructions/${task.instruction}.png`,
                    workspaceId: null,
                    applicationId: null,
                  },
                });
              }
            })
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
