import { inject, Injectable } from '@angular/core';
import {
  deleteDoc,
  doc,
  Firestore,
  runTransaction,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { EventApiService } from '../../drawer/services';
import { Entity } from '../../shared/utils';

export type CreateInstructionDto = Entity<{
  workspaceId: string;
  instructionId: string;
  name: string;
  kind: string;
}>;

export type UpdateInstructionDto = Partial<{
  name: string;
}>;

export interface UpdateInstructionThumbnailDto {
  fileId: string;
  fileUrl: string;
}

@Injectable({ providedIn: 'root' })
export class InstructionApiService {
  private readonly _firestore = inject(Firestore);
  private readonly _eventApiService = inject(EventApiService);

  createInstruction({ id, workspaceId, name }: CreateInstructionDto) {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);
    const newInstructionRef = doc(this._firestore, `instructions/${id}`);

    return defer(() =>
      from(
        setDoc(newInstructionRef, {
          name,
          thumbnailUrl: null,
          workspaceRef,
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

  deleteInstruction(instructionId: string) {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return defer(() => from(deleteDoc(instructionRef)));
  }
}
