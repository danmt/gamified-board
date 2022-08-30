import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity } from '../utils';

export type InstructionSignerDto = Entity<{
  name: string;
  ownerId: string;
  saveChanges: boolean;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionSignerApiService {
  private readonly _firestore = inject(Firestore);

  transferInstructionSigner(
    previousInstructionId: string,
    newInstructionId: string,
    instructionSignerId: string,
    newIndex: number
  ) {
    const previousInstructionRef = doc(
      this._firestore,
      `instructions/${previousInstructionId}`
    );

    const newInstructionRef = doc(
      this._firestore,
      `instructions/${newInstructionId}`
    );

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const previousInstruction = await transaction.get(
            previousInstructionRef
          );
          const newInstruction = await transaction.get(newInstructionRef);

          const previousInstructionSigners = (previousInstruction.data()?.[
            'signers'
          ] ?? []) as InstructionSignerDto[];
          const newInstructionSigners = (newInstruction.data()?.['signers'] ??
            []) as InstructionSignerDto[];
          const signer =
            previousInstructionSigners.find(
              (signer) => signer.id === instructionSignerId
            ) ?? null;

          if (signer === null) {
            throw new Error('Signer not found');
          }

          transaction.update(previousInstructionRef, {
            signers: previousInstructionSigners.filter(
              (signer: InstructionSignerDto) =>
                signer.id !== instructionSignerId
            ),
          });
          transaction.update(newInstructionRef, {
            signers: [
              ...newInstructionSigners.slice(0, newIndex),
              signer,
              ...newInstructionSigners.slice(newIndex + 1),
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

  updateInstructionSigner(
    instructionId: string,
    instructionSignerId: string,
    name: string
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

  createInstructionSigner(
    ownerId: string,
    newInstructionSignerId: string,
    name: string,
    saveChanges: boolean
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
                id: newInstructionSignerId,
                name,
                ownerId,
                saveChanges,
              },
            ],
          });

          return {};
        })
      )
    );
  }

  updateInstructionSignersOrder(
    ownerId: string,
    instructionSignersOrder: string[]
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${ownerId}`
          );

          const instruction = await transaction.get(instructionRef);
          const signers = (instruction.data()?.['signers'] ??
            []) as InstructionSignerDto[];

          transaction.update(instructionRef, {
            signers: instructionSignersOrder.map((instructionSignerId) => {
              const instructionSignerIndex = signers.findIndex(
                (instructionSigner) =>
                  instructionSigner.id === instructionSignerId
              );

              return signers[instructionSignerIndex];
            }),
          });

          return {};
        })
      )
    );
  }
}
