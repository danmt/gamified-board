import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity } from '../../shared/utils';
import { InstructionSysvarDto } from '../utils';

export type CreateInstructionSysvarDto = Entity<{
  name: string;
  sysvarId: string;
}>;

export type UpdateInstructionSysvarDto = Partial<{
  name: string;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionSysvarApiService {
  private readonly _firestore = inject(Firestore);

  createInstructionSysvar(
    ownerId: string,
    { id, name, sysvarId }: CreateInstructionSysvarDto
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

          // push sysvar to the instruction's sysvars list
          transaction.update(instructionRef, {
            sysvars: [
              ...(instructionData && instructionData['sysvars']
                ? instructionData['sysvars']
                : []),
              {
                id,
                name,
                sysvarId,
              },
            ],
          });

          return {};
        })
      )
    );
  }

  updateInstructionSysvar(
    instructionId: string,
    instructionSysvarId: string,
    { name }: UpdateInstructionSysvarDto
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

          const instruction = await transaction.get(instructionRef);
          const instructionSysvars = (instruction.data()?.['sysvars'] ??
            []) as InstructionSysvarDto[];
          const index = instructionSysvars.findIndex(
            (instructionSysvar) => instructionSysvar.id === instructionSysvarId
          );

          if (index === -1) {
            throw new Error('InstructionSysvar not found');
          }

          transaction.update(instructionRef, {
            sysvars: [
              ...instructionSysvars.slice(0, index),
              {
                ...instructionSysvars[index],
                name,
              },
              ...instructionSysvars.slice(index + 1),
            ],
          });

          return {};
        })
      )
    );
  }

  deleteInstructionSysvar(instructionId: string, instructionSysvarId: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

          const instruction = await transaction.get(instructionRef);

          transaction.update(instructionRef, {
            sysvars: instruction
              .data()
              ?.['sysvars'].filter(
                (sysvars: InstructionSysvarDto) =>
                  sysvars.id !== instructionSysvarId
              ),
          });

          return {};
        })
      )
    );
  }
}
