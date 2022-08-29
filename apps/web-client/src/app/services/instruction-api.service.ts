import { inject, Injectable } from '@angular/core';
import {
  doc,
  docData,
  Firestore,
  runTransaction,
  updateDoc,
} from '@angular/fire/firestore';
import { combineLatest, defer, from, map, Observable, of } from 'rxjs';
import { Entity } from '../utils';
import { DocumentDto } from './document-api.service';
import { InstructionApplicationDto } from './instruction-application-api.service';
import { InstructionTaskDto } from './instruction-task-api.service';

export type InstructionArgumentDto = Entity<{
  name: string;
  type: string;
  isOption: boolean;
}>;

export type InstructionDto = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  documents: DocumentDto[];
  applications: InstructionApplicationDto[];
  tasks: InstructionTaskDto[];
  arguments: InstructionArgumentDto[];
}>;

@Injectable({ providedIn: 'root' })
export class InstructionApiService {
  private readonly _firestore = inject(Firestore);

  getInstruction(instructionId: string): Observable<InstructionDto> {
    return docData(doc(this._firestore, `instructions/${instructionId}`)).pipe(
      map((instruction) => ({
        id: instructionId,
        name: instruction['name'],
        thumbnailUrl: instruction['thumbnailUrl'],
        workspaceId: instruction['workspaceRef'].id,
        applicationId: instruction['applicationRef'].id,
        documents: instruction['documents'] ?? [],
        applications: instruction['applications'] ?? [],
        tasks: instruction['tasks'],
        arguments: instruction['arguments'] ?? [],
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
    thumbnailUrl: string,
    args: InstructionArgumentDto[]
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
            documents: [],
            arguments: args,
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

  updateInstruction(
    instructionId: string,
    name: string,
    thumbnailUrl: string,
    args: InstructionArgumentDto[]
  ) {
    return defer(() =>
      from(
        updateDoc(doc(this._firestore, `instructions/${instructionId}`), {
          name,
          thumbnailUrl,
          arguments: args,
        })
      )
    );
  }
}
