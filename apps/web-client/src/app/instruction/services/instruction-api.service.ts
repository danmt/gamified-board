import { inject, Injectable } from '@angular/core';
import {
  deleteDoc,
  doc,
  docData,
  Firestore,
  runTransaction,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { combineLatest, defer, from, map, Observable, of } from 'rxjs';
import { InstructionApplicationDto } from '../../instruction-application/services';
import { InstructionDocumentDto } from '../../instruction-document/services';
import { InstructionSignerDto } from '../../instruction-signer/services';
import { InstructionSysvarDto } from '../../instruction-sysvar/services';
import { InstructionTaskDto } from '../../instruction-task/services';
import { Entity } from '../../shared/utils';

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

export type CreateInstructionDto = Entity<{
  name: string;
  applicationId: string;
  workspaceId: string;
  arguments: InstructionArgumentDto[];
}>;

export type UpdateInstructionDto = Partial<{
  name: string;
  arguments: InstructionArgumentDto[];
}>;

export interface UpdateInstructionThumbnailDto {
  fileId: string;
  fileUrl: string;
}

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

  createInstruction({
    id,
    applicationId,
    arguments: args,
    name,
    workspaceId,
  }: CreateInstructionDto) {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );
    const newInstructionRef = doc(this._firestore, `instructions/${id}`);

    return defer(() =>
      from(
        setDoc(newInstructionRef, {
          name,
          applicationRef,
          workspaceRef,
          thumbnailUrl: null,
          tasks: [],
          sysvars: [],
          applications: [],
          documents: [],
          arguments: args,
        })
      )
    );
  }

  updateInstruction(instructionId: string, changes: UpdateInstructionDto) {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return defer(() => from(updateDoc(instructionRef, changes)));
  }

  updateInstructionThumbnail(
    instructionId: string,
    { fileId, fileUrl }: UpdateInstructionThumbnailDto
  ) {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );
    const uploadRef = doc(this._firestore, `uploads/${fileId}`);

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          transaction.set(uploadRef, {
            kind: 'instruction',
            ref: instructionId,
          });
          transaction.update(instructionRef, { thumbnailUrl: fileUrl });

          return true;
        })
      )
    );
  }
}
