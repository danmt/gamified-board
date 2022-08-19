import { inject, Injectable } from '@angular/core';
import {
  collectionData,
  collectionGroup,
  doc,
  docData,
  documentId,
  endAt,
  Firestore,
  orderBy,
  query,
  runTransaction,
  startAt,
  updateDoc,
} from '@angular/fire/firestore';
import { combineLatest, defer, from, map, Observable, of } from 'rxjs';
import { Entity } from '../utils';
import { DocumentDto } from './document-api.service';
import { TaskDto } from './task-api.service';

export type InstructionDto = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  documentsOrder: string[];
  tasksOrder: string[];
}>;

export type GenericInstruction = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  isInternal: boolean;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionApiService {
  private readonly _firestore = inject(Firestore);

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
    const ownerRef = doc(this._firestore, `instructions/${instructionId}`);

    return collectionData(
      query(
        collectionGroup(this._firestore, 'tasks').withConverter({
          fromFirestore: (snapshot) => ({
            id: snapshot.id,
            name: snapshot.data()['name'],
            owner: snapshot.data()['owner'],
            instruction: snapshot.data()['instruction'],
          }),
          toFirestore: (it) => it,
        }),
        orderBy(documentId()),
        startAt(ownerRef.path),
        endAt(ownerRef.path + '\uf8ff')
      )
    ).pipe(
      map((tasks) =>
        tasks.map((task) => ({
          id: task['id'],
          name: task['name'],
          owner: task['owner'],
          instruction: task['instruction'],
        }))
      )
    );
  }

  getInstructionDocuments(instructionId: string): Observable<DocumentDto[]> {
    const ownerRef = doc(this._firestore, `instructions/${instructionId}`);

    return collectionData(
      query(
        collectionGroup(this._firestore, 'documents').withConverter({
          fromFirestore: (snapshot) => ({
            id: snapshot.id,
            name: snapshot.data()['name'],
            owner: snapshot.data()['owner'],
            collection: snapshot.data()['collection'],
          }),
          toFirestore: (it) => it,
        }),
        orderBy(documentId()),
        startAt(ownerRef.path),
        endAt(ownerRef.path + '\uf8ff')
      )
    ).pipe(
      map((tasks) =>
        tasks.map((task) => ({
          id: task['id'],
          name: task['name'],
          owner: task['owner'],
          collection: task['collection'],
        }))
      )
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
