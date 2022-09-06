import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity, isNull } from '../../shared/utils';

export type InstructionSysvarDto = Entity<{
  name: string;
  sysvarId: string;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionSysvarApiService {
  private readonly _firestore = inject(Firestore);

  transferInstructionSysvar(
    previousInstructionId: string,
    newInstructionId: string,
    instructionSysvarId: string,
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

          const previousInstructionSysvars = (previousInstruction.data()?.[
            'sysvars'
          ] ?? []) as InstructionSysvarDto[];
          const newInstructionSysvars = (newInstruction.data()?.['sysvars'] ??
            []) as InstructionSysvarDto[];
          const sysvar =
            previousInstructionSysvars.find(
              (sysvar) => sysvar.id === instructionSysvarId
            ) ?? null;

          if (isNull(sysvar)) {
            throw new Error('Sysvar not found');
          }

          transaction.update(previousInstructionRef, {
            sysvars: previousInstructionSysvars.filter(
              (sysvar: InstructionSysvarDto) =>
                sysvar.id !== instructionSysvarId
            ),
          });
          transaction.update(newInstructionRef, {
            sysvars: [
              ...newInstructionSysvars.slice(0, newIndex),
              sysvar,
              ...newInstructionSysvars.slice(newIndex),
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

  updateInstructionSysvar(
    instructionId: string,
    instructionSysvarId: string,
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

  createInstructionSysvar(
    ownerId: string,
    newInstructionSysvarId: string,
    name: string,
    sysvarId: string
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
                id: newInstructionSysvarId,
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

  updateInstructionSysvarsOrder(
    ownerId: string,
    instructionSysvarsOrder: string[]
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${ownerId}`
          );

          const instruction = await transaction.get(instructionRef);
          const sysvars = (instruction.data()?.['sysvars'] ??
            []) as InstructionSysvarDto[];

          transaction.update(instructionRef, {
            sysvars: instructionSysvarsOrder.map((instructionSysvarId) => {
              const instructionSysvarIndex = sysvars.findIndex(
                (instructionSysvar) =>
                  instructionSysvar.id === instructionSysvarId
              );

              return sysvars[instructionSysvarIndex];
            }),
          });

          return {};
        })
      )
    );
  }
}
