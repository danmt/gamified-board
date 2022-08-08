import { transferArrayItem } from '@angular/cdk/drag-drop';
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

import { combineLatest, defer, from, map, of, switchMap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { PluginsService } from '../plugins';
import {
  BoardDocument,
  BoardTask,
  Collection,
  Instruction,
  Option,
} from '../utils';

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
                              thumbnailUrl: collection['thumbnailUrl'],
                              workspaceId,
                              applicationId: applicationRef.id,
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
            position: number;
            namespace: Option<string>;
            plugin: Option<string>;
            account: Option<string>;
          }>({
            fromFirestore: (snapshot) => ({
              id: snapshot.id,
              name: snapshot.data()['name'] as string,
              isInternal: snapshot.data()['isInternal'] as boolean,
              position: snapshot.data()['position'] as number,
              collectionRef:
                snapshot.data()['collectionRef'] ??
                (null as Option<DocumentReference<DocumentData>>),
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
              position: number;
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
                    position: document.position,
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
                  position: document.position,
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
            isInternal: boolean;
            position: number;
            instructionRef: Option<DocumentReference<DocumentData>>;
            namespace: Option<string>;
            plugin: Option<string>;
            instruction: Option<string>;
          }>({
            fromFirestore: (snapshot) => ({
              id: snapshot.id,
              name: snapshot.data()['name'] as string,
              isInternal: snapshot.data()['isInternal'] as boolean,
              position: snapshot.data()['position'] as number,
              instructionRef:
                snapshot.data()['instructionRef'] ??
                (null as Option<DocumentReference<DocumentData>>),
              namespace:
                snapshot.data()['namespace'] ?? (null as Option<string>),
              plugin: snapshot.data()['plugin'] ?? (null as Option<string>),
              instruction:
                snapshot.data()['instruction'] ?? (null as Option<string>),
            }),
            toFirestore: (it: {
              id: string;
              name: string;
              isInternal: boolean;
              position: number;
              instructionRef: Option<DocumentReference<DocumentData>>;
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
                    position: task.position,
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
                  position: task.position,
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
        documents: instruction['documentsOrder'].reduce(
          (orderedDocuments: BoardDocument[], documentId: string) => {
            const documentFound =
              documents.find((document) => document.id === documentId) ?? null;

            if (documentFound === null) {
              return orderedDocuments;
            }

            return [...orderedDocuments, documentFound];
          },
          []
        ),
        tasks: instruction['tasksOrder'].reduce(
          (orderedTasks: BoardTask[], taskId: string) => {
            const taskFound = tasks.find((task) => task.id === taskId) ?? null;

            if (taskFound === null) {
              return orderedTasks;
            }

            return [...orderedTasks, taskFound];
          },
          []
        ),
      }))
    );
  }

  updateInstructionDocumentsOrder(
    instructionId: string,
    documentsOrder: string[]
  ) {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return defer(() => from(updateDoc(instructionRef, { documentsOrder })));
  }

  updateInstructionTasksOrder(instructionId: string, tasksOrder: string[]) {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return defer(() => from(updateDoc(instructionRef, { tasksOrder })));
  }

  transferInstructionDocument(
    instructions: { id: string; documents: { id: string }[] }[],
    previousInstructionId: string,
    newInstructionId: string,
    documentId: string,
    previousIndex: number,
    newIndex: number
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const previousInstructionIndex = instructions.findIndex(
            ({ id }) => id === previousInstructionId
          );

          if (previousInstructionIndex === -1) {
            throw new Error('Invalid previous instruction.');
          }

          const previousInstructionRef = doc(
            this._firestore,
            `instructions/${previousInstructionId}`
          );

          const newInstructionIndex = instructions.findIndex(
            ({ id }) => id === newInstructionId
          );

          if (newInstructionIndex === -1) {
            throw new Error('Invalid new instruction.');
          }

          const newInstructionRef = doc(
            this._firestore,
            `instructions/${newInstructionId}`
          );

          const previousInstructionDocuments = instructions[
            previousInstructionIndex
          ].documents.map(({ id }) => id);
          const newInstructionDocuments = instructions[
            newInstructionIndex
          ].documents.map(({ id }) => id);

          transferArrayItem(
            previousInstructionDocuments,
            newInstructionDocuments,
            previousIndex,
            newIndex
          );

          const currentDocumentRef = doc(
            this._firestore,
            `instructions/${previousInstructionId}/documents/${documentId}`
          );
          const newDocumentRef = doc(
            this._firestore,
            `instructions/${newInstructionId}/documents/${documentId}`
          );

          const document = await transaction.get(currentDocumentRef);
          // remove from previous instruction documents
          transaction.update(previousInstructionRef, {
            documentsOrder: previousInstructionDocuments,
          });
          // remove from previous instruction documentsOrder
          transaction.delete(currentDocumentRef);

          // add it to new instruction documents
          transaction.set(newDocumentRef, document.data());
          // update new instruction documents order
          transaction.update(newInstructionRef, {
            documentsOrder: newInstructionDocuments,
          });

          return {};
        })
      )
    );
  }

  transferInstructionTask(
    instructions: { id: string; tasks: { id: string }[] }[],
    previousInstructionId: string,
    newInstructionId: string,
    taskId: string,
    previousIndex: number,
    newIndex: number
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const previousInstructionIndex = instructions.findIndex(
            ({ id }) => id === previousInstructionId
          );

          if (previousInstructionIndex === -1) {
            throw new Error('Invalid previous instruction.');
          }

          const previousInstructionRef = doc(
            this._firestore,
            `instructions/${previousInstructionId}`
          );

          const newInstructionIndex = instructions.findIndex(
            ({ id }) => id === newInstructionId
          );

          if (newInstructionIndex === -1) {
            throw new Error('Invalid new instruction.');
          }

          const newInstructionRef = doc(
            this._firestore,
            `instructions/${newInstructionId}`
          );

          const previousInstructionTasks = instructions[
            previousInstructionIndex
          ].tasks.map(({ id }) => id);
          const newInstructionTasks = instructions[
            newInstructionIndex
          ].tasks.map(({ id }) => id);

          transferArrayItem(
            previousInstructionTasks,
            newInstructionTasks,
            previousIndex,
            newIndex
          );

          const currentTaskRef = doc(
            this._firestore,
            `instructions/${previousInstructionId}/tasks/${taskId}`
          );
          const newTaskRef = doc(
            this._firestore,
            `instructions/${newInstructionId}/tasks/${taskId}`
          );

          const task = await transaction.get(currentTaskRef);
          // remove from previous instruction tasks
          transaction.update(previousInstructionRef, {
            tasksOrder: previousInstructionTasks,
          });
          // remove from previous instruction tasksOrder
          transaction.delete(currentTaskRef);

          // add it to new instruction tasks
          transaction.set(newTaskRef, task.data());
          // update new instruction tasks order
          transaction.update(newInstructionRef, {
            tasksOrder: newInstructionTasks,
          });

          return {};
        })
      )
    );
  }

  deleteInstructionTask(instructionId: string, taskId: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

          const instruction = await transaction.get(instructionRef);
          const tasksOrder = instruction
            .data()
            ?.['tasksOrder'].filter((task: string) => task !== taskId);

          transaction.update(instructionRef, { tasksOrder });
          transaction.delete(
            doc(
              this._firestore,
              `instructions/${instructionId}/tasks/${taskId}`
            )
          );

          return {};
        })
      )
    );
  }

  createInstructionDocument(
    instructionId: string,
    documentCollection: Collection
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );
          const newDocumentId = uuid();
          const newDocumentRef = doc(
            this._firestore,
            `instructions/${instructionId}/documents/${newDocumentId}`
          );
          const instruction = await transaction.get(instructionRef);
          const instructionData = instruction.data();

          // create the new document
          transaction.set(newDocumentRef, {
            name: 'sample #1',
            isInternal: documentCollection.isInternal,
            collectionRef: doc(
              this._firestore,
              `collections/${documentCollection.id}`
            ),
            namespace: documentCollection.namespace ?? null,
            plugin: documentCollection.plugin ?? null,
            account: documentCollection.account ?? null,
          });
          // push document id to the documentsOrder
          transaction.update(instructionRef, {
            documentsOrder: [
              ...(instructionData ? instructionData['documentsOrder'] : []),
              newDocumentId,
            ],
          });

          return {};
        })
      )
    );
  }

  createInstructionTask(instructionId: string, taskInstruction: Instruction) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );
          const newTaskId = uuid();
          const newTaskRef = doc(
            this._firestore,
            `instructions/${instructionId}/tasks/${newTaskId}`
          );
          const instruction = await transaction.get(instructionRef);
          const instructionData = instruction.data();

          // create the new task
          transaction.set(newTaskRef, {
            name: 'sample #1',
            isInternal: taskInstruction.isInternal,
            instructionRef: doc(
              this._firestore,
              `instructions/${taskInstruction.id}`
            ),
            namespace: taskInstruction.namespace ?? null,
            plugin: taskInstruction.plugin ?? null,
            instruction: taskInstruction.name ?? null,
          });
          // push task id to the tasksOrder
          transaction.update(instructionRef, {
            tasksOrder: [
              ...(instructionData ? instructionData['tasksOrder'] : []),
              newTaskId,
            ],
          });

          return {};
        })
      )
    );
  }
}
