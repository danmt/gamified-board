import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity, isNull } from '../../shared/utils';

export type InstructionApplicationDto = Entity<{
  name: string;
  applicationId: string;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionApplicationApiService {
  private readonly _firestore = inject(Firestore);

  transferInstructionApplication(
    previousInstructionId: string,
    newInstructionId: string,
    instructionApplicationId: string,
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

          const previousInstructionApplications = (previousInstruction.data()?.[
            'applications'
          ] ?? []) as InstructionApplicationDto[];
          const newInstructionApplications = (newInstruction.data()?.[
            'applications'
          ] ?? []) as InstructionApplicationDto[];
          const application =
            previousInstructionApplications.find(
              (application) => application.id === instructionApplicationId
            ) ?? null;

          if (isNull(application)) {
            throw new Error('Application not found');
          }

          transaction.update(previousInstructionRef, {
            applications: previousInstructionApplications.filter(
              (application: InstructionApplicationDto) =>
                application.id !== instructionApplicationId
            ),
          });
          transaction.update(newInstructionRef, {
            applications: [
              ...newInstructionApplications.slice(0, newIndex),
              application,
              ...newInstructionApplications.slice(newIndex),
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

  updateInstructionApplication(
    instructionId: string,
    instructionApplicationId: string,
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
                name,
              },
              ...instructionApplications.slice(index + 1),
            ],
          });

          return {};
        })
      )
    );
  }

  createInstructionApplication(
    ownerId: string,
    newInstructionApplicationId: string,
    name: string,
    applicationId: string
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
                id: newInstructionApplicationId,
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

  updateInstructionApplicationsOrder(
    ownerId: string,
    instructionApplicationsOrder: string[]
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${ownerId}`
          );

          const instruction = await transaction.get(instructionRef);
          const applications = (instruction.data()?.['applications'] ??
            []) as InstructionApplicationDto[];

          transaction.update(instructionRef, {
            applications: instructionApplicationsOrder.map(
              (instructionApplicationId) => {
                const instructionApplicationIndex = applications.findIndex(
                  (instructionApplication) =>
                    instructionApplication.id === instructionApplicationId
                );

                return applications[instructionApplicationIndex];
              }
            ),
          });

          return {};
        })
      )
    );
  }
}
