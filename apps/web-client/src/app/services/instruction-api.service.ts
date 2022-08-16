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
import {
  combineLatest,
  defer,
  from,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { PluginsService } from '../plugins';
import { Entity, Option } from '../utils';

export type InstructionDto = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  documentsOrder: string[];
  tasksOrder: string[];
}>;

export type TaskDto = Entity<{
  name: string;
  instruction: Entity<{
    name: string;
    isInternal: boolean;
    thumbnailUrl: string;
    workspaceId: Option<string>;
    applicationId: Option<string>;
    namespace: Option<string>;
    plugin: Option<string>;
    instruction: Option<string>;
  }>;
}>;

export type DocumentDto = Entity<{
  name: string;
  collection: Entity<{
    name: string;
    isInternal: boolean;
    thumbnailUrl: string;
    workspaceId: Option<string>;
    applicationId: Option<string>;
    namespace: Option<string>;
    plugin: Option<string>;
    account: Option<string>;
  }>;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionApiService {
  private readonly _firestore = inject(Firestore);
  private readonly _pluginsService = inject(PluginsService);

  getInstruction(instructionId: string): Observable<InstructionDto> {
    return docData(doc(this._firestore, `instructions/${instructionId}`)).pipe(
      map((instruction) => ({
        id: instructionId,
        name: instruction['name'] as string,
        thumbnailUrl: instruction['thumbnailUrl'] as string,
        workspaceId: instruction['workspaceRef'].id as string,
        applicationId: instruction['applicationRef'].id as string,
        documentsOrder: instruction['documentsOrder'] as string[],
        tasksOrder: instruction['tasksOrder'] as string[],
      }))
    );
  }

  getInstructions(instructionIds: string[]): Observable<InstructionDto[]> {
    if (instructionIds.length === 0) {
      return of([]);
    }

    return combineLatest(
      instructionIds.map((instructionId) => this.getInstruction(instructionId))
    );
  }

  getInstructionTasks(instructionId: string): Observable<TaskDto[]> {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return collectionData(
      query(
        collectionGroup(this._firestore, 'tasks').withConverter<{
          id: string;
          name: string;
          isInternal: boolean;
          instructionRef: Option<DocumentReference<DocumentData>>;
          namespace: Option<string>;
          plugin: Option<string>;
          instruction: Option<string>;
        }>({
          fromFirestore: (snapshot) => ({
            id: snapshot.id,
            name: snapshot.data()['name'] as string,
            isInternal: snapshot.data()['isInternal'] as boolean,
            instructionRef:
              snapshot.data()['instructionRef'] ??
              (null as Option<DocumentReference<DocumentData>>),
            namespace: snapshot.data()['namespace'] ?? (null as Option<string>),
            plugin: snapshot.data()['plugin'] ?? (null as Option<string>),
            instruction:
              snapshot.data()['instruction'] ?? (null as Option<string>),
          }),
          toFirestore: (it: {
            id: string;
            name: string;
            isInternal: boolean;
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
    );
  }

  getInstructionDocuments(instructionId: string): Observable<DocumentDto[]> {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return collectionData(
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
            isInternal: snapshot.data()['isInternal'] as boolean,
            collectionRef:
              snapshot.data()['collectionRef'] ??
              (null as Option<DocumentReference<DocumentData>>),
            namespace: snapshot.data()['namespace'] ?? (null as Option<string>),
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
                      collection['workspaceRef'].id ?? (null as Option<string>),
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

  deleteInstruction(applicationId: string, instructionId: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const applicationInstructionRef = doc(
            this._firestore,
            `applications/${applicationId}/instructions/${instructionId}`
          );
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );
          transaction.delete(applicationInstructionRef);
          transaction.delete(instructionRef);

          return {};
        })
      )
    );
  }

  createInstruction(
    workspaceId: string,
    applicationId: string,
    newInstructionId: string,
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
          const applicationRef = doc(
            this._firestore,
            `applications/${applicationId}`
          );
          const newInstructionRef = doc(
            this._firestore,
            `instructions/${newInstructionId}`
          );
          const newApplicationInstructionRef = doc(
            this._firestore,
            `applications/${applicationId}/instructions/${newInstructionId}`
          );

          // create the new instruction
          transaction.set(newInstructionRef, {
            name,
            applicationRef,
            workspaceRef,
            thumbnailUrl,
            tasksOrder: [],
            documentsOrder: [],
          });

          // push instruction to application instructions
          transaction.set(newApplicationInstructionRef, {
            instructionRef: newInstructionRef,
          });

          return {};
        })
      )
    );
  }

  updateInstruction(instructionId: string, name: string, thumbnailUrl: string) {
    return defer(() =>
      from(
        updateDoc(doc(this._firestore, `instructions/${instructionId}`), {
          name,
          thumbnailUrl,
        })
      )
    );
  }
}
