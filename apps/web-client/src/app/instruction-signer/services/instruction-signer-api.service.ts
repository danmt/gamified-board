import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity } from '../../shared';
import { InstructionSignerDto } from '../utils';

export type CreateInstructionSignerDto = Entity<{
  name: string;
  saveChanges: boolean;
}>;

export type UpdateInstructionSignerDto = Partial<{
  name: string;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionSignerApiService {
  private readonly _firestore = inject(Firestore);

  createInstructionSigner(
    ownerId: string,
    { id, name, saveChanges }: CreateInstructionSignerDto
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${ownerId}`
          );
          const instruction = await transaction.get(instructionRef);
          const instructionData = instruction.data();

          // push signer to the instruction's signers list
          transaction.update(instructionRef, {
            signers: [
              ...(instructionData && instructionData['signers']
                ? instructionData['signers']
                : []),
              {
                id,
                name,
                saveChanges,
              },
            ],
          });

          return {};
        })
      )
    );
  }

  updateInstructionSigner(
    instructionId: string,
    instructionSignerId: string,
    { name }: UpdateInstructionSignerDto
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

          const instruction = await transaction.get(instructionRef);
          const instructionSigners = (instruction.data()?.['signers'] ??
            []) as InstructionSignerDto[];
          const index = instructionSigners.findIndex(
            (instructionSigner) => instructionSigner.id === instructionSignerId
          );

          if (index === -1) {
            throw new Error('InstructionSigner not found');
          }

          transaction.update(instructionRef, {
            signers: [
              ...instructionSigners.slice(0, index),
              {
                ...instructionSigners[index],
                name,
              },
              ...instructionSigners.slice(index + 1),
            ],
          });

          return {};
        })
      )
    );
  }

  deleteInstructionSigner(instructionId: string, instructionSignerId: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

          const instruction = await transaction.get(instructionRef);

          transaction.update(instructionRef, {
            signers: instruction
              .data()
              ?.['signers'].filter(
                (signers: InstructionSignerDto) =>
                  signers.id !== instructionSignerId
              ),
          });

          return {};
        })
      )
    );
  }
}
