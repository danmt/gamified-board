import { inject, Injectable } from '@angular/core';
import {
  collectionData,
  collectionGroup,
  deleteDoc,
  doc,
  docData,
  documentId,
  Firestore,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { combineLatest, defer, from, map, Observable, of } from 'rxjs';
import { InstructionArgumentDto } from '../../instruction-argument/utils';
import { Entity } from '../../shared/utils';
import { InstructionDto } from '../utils';

export type CreateInstructionDto = Entity<{
  name: string;
  applicationId: string;
  workspaceId: string;
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

  getWorkspaceInstructions(workspaceId: string): Observable<InstructionDto[]> {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);

    return collectionData(
      query(
        collectionGroup(this._firestore, 'instructions').withConverter({
          fromFirestore: (snapshot) => {
            const data = snapshot.data();

            return {
              id: snapshot.id,
              name: data['name'],
              thumbnailUrl: data['thumbnailUrl'],
              arguments: data['arguments'] ?? [],
              documents: data['documents'] ?? [],
              tasks: data['tasks'] ?? [],
              workspaceId,
              applicationId: data['applicationRef'].id,
              applications: data['applications'] ?? [],
              sysvars: data['sysvars'] ?? [],
              signers: data['signers'] ?? [],
            };
          },
          toFirestore: (it) => it,
        }),
        where('workspaceRef', '==', workspaceRef),
        orderBy(documentId())
      )
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
          arguments: [],
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
