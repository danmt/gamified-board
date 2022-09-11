import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity } from '../../shared';
import { InstructionApplicationDto } from '../utils';

export type CreateInstructionApplicationDto = Entity<{
  name: string;
  applicationId: string;
}>;

export type UpdateInstructionApplicationDto = Partial<{
  name: string;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionApplicationApiService {
  private readonly _firestore = inject(Firestore);

  createInstructionApplication(
    ownerId: string,
    { id, name, applicationId }: CreateInstructionApplicationDto
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

          // push application to the instruction's applications list
          transaction.update(instructionRef, {
            applications: [
              ...(instructionData && instructionData['applications']
                ? instructionData['applications']
                : []),
              {
                id,
                name,
                applicationId,
              },
            ],
          });

          return {};
        })
      )
    );
  }

  updateInstructionApplication(
    instructionId: string,
    instructionApplicationId: string,
    changes: UpdateInstructionApplicationDto
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

          const instruction = await transaction.get(instructionRef);
          const instructionApplications = (instruction.data()?.[
            'applications'
          ] ?? []) as InstructionApplicationDto[];
          const index = instructionApplications.findIndex(
            (instructionApplication) =>
              instructionApplication.id === instructionApplicationId
          );

          if (index === -1) {
            throw new Error('InstructionApplication not found');
          }

          transaction.update(instructionRef, {
            applications: [
              ...instructionApplications.slice(0, index),
              {
                ...instructionApplications[index],
                ...changes,
              },
              ...instructionApplications.slice(index + 1),
            ],
          });

          return {};
        })
      )
    );
  }

  deleteInstructionApplication(
    instructionId: string,
    instructionApplicationId: string
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

          const instruction = await transaction.get(instructionRef);

          transaction.update(instructionRef, {
            applications: instruction
              .data()
              ?.['applications'].filter(
                (applications: InstructionApplicationDto) =>
                  applications.id !== instructionApplicationId
              ),
          });

          return {};
        })
      )
    );
  }
}
