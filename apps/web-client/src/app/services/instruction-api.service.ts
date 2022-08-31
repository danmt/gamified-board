import { inject, Injectable } from '@angular/core';
import {
  deleteDoc,
  doc,
  docData,
  Firestore,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { combineLatest, defer, from, map, Observable, of } from 'rxjs';
import { Entity } from '../utils';
import { InstructionApplicationDto } from './instruction-application-api.service';
import { InstructionDocumentDto } from './instruction-document-api.service';
import { InstructionSignerDto } from './instruction-signer-api.service';
import { InstructionSysvarDto } from './instruction-sysvar-api.service';
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
  documents: InstructionDocumentDto[];
  applications: InstructionApplicationDto[];
  tasks: InstructionTaskDto[];
  arguments: InstructionArgumentDto[];
  sysvars: InstructionSysvarDto[];
  signers: InstructionSignerDto[];
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
        tasks: instruction['tasks'] ?? [],
        arguments: instruction['arguments'] ?? [],
        sysvars: instruction['sysvars'] ?? [],
        signers: instruction['signers'] ?? [],
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

  deleteInstruction(instructionId: string) {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return defer(() => from(deleteDoc(instructionRef)));
  }

  createInstruction(
    workspaceId: string,
    applicationId: string,
    newInstructionId: string,
    name: string,
    thumbnailUrl: string,
    args: InstructionArgumentDto[]
  ) {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );
    const newInstructionRef = doc(
      this._firestore,
      `instructions/${newInstructionId}`
    );

    return defer(() =>
      from(
        setDoc(newInstructionRef, {
          name,
          applicationRef,
          workspaceRef,
          thumbnailUrl,
          tasks: [],
          sysvars: [],
          applications: [],
          documents: [],
          arguments: args,
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
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return defer(() =>
      from(
        updateDoc(instructionRef, {
          name,
          thumbnailUrl,
          arguments: args,
        })
      )
    );
  }
}
