import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity } from '../../shared';
import { InstructionTaskDto, TaskReferenceDto } from '../utils';

export type CreateInstructionTaskDto = Entity<{
  name: string;
  instructionId: string;
}>;

export type UpdateInstructionTaskDto = Partial<{
  name: string;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionTaskApiService {
  private readonly _firestore = inject(Firestore);

  createInstructionTask(
    ownerId: string,
    { id, name, instructionId }: CreateInstructionTaskDto
  ) {
    const ownerRef = doc(this._firestore, `instructions/${ownerId}`);

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const owner = await transaction.get(ownerRef);
          const ownerData = owner.data();

          // push task to the owner's tasks list
          transaction.update(ownerRef, {
            tasks: [
              ...(ownerData && ownerData['tasks'] ? ownerData['tasks'] : []),
              {
                id,
                name,
                instructionId,
                references: [],
              },
            ],
          });

          return {};
        })
      )
    );
  }

  updateInstructionTask(
    instructionId: string,
    instructionTaskId: string,
    changes: UpdateInstructionTaskDto
  ) {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instruction = await transaction.get(instructionRef);
          const instructionTasks = (instruction.data()?.['tasks'] ??
            []) as InstructionTaskDto[];

          const index = instructionTasks.findIndex(
            (instructionTask) => instructionTask.id === instructionTaskId
          );

          if (index === -1) {
            throw new Error('InstructionTask not found');
          }

          transaction.update(instructionRef, {
            tasks: [
              ...instructionTasks.slice(0, index),
              {
                ...instructionTasks[index],
                ...changes,
              },
              ...instructionTasks.slice(index + 1),
            ],
          });

          return {};
        })
      )
    );
  }

  deleteInstructionTask(instructionId: string, instructionTaskId: string) {
    const instructionRef = doc(
      this._firestore,
      `instructions/${instructionId}`
    );

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instruction = await transaction.get(instructionRef);

          transaction.update(instructionRef, {
            tasks: instruction
              .data()
              ?.['tasks'].filter(
                (tasks: InstructionTaskDto) => tasks.id !== instructionTaskId
              ),
          });

          return {};
        })
      )
    );
  }

  setTaskReference(
    ownerId: string,
    taskId: string,
    reference: TaskReferenceDto
  ) {
    const instructionRef = doc(this._firestore, `instructions/${ownerId}`);

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instruction = await transaction.get(instructionRef);
          const tasks = (instruction.data()?.['tasks'] ??
            []) as InstructionTaskDto[];

          const taskIndex = tasks.findIndex((task) => task.id === taskId);
          const referenceIndex = tasks[taskIndex].references.findIndex(
            ({ id }) => id === reference.id
          );

          transaction.update(instructionRef, {
            tasks: [
              ...tasks.slice(0, taskIndex),
              {
                ...tasks[taskIndex],
                references: [
                  ...tasks[taskIndex].references.slice(0, referenceIndex),
                  reference,
                  ...tasks[taskIndex].references.slice(referenceIndex + 1),
                ],
              },
              ...tasks.slice(taskIndex + 1),
            ],
          });

          return {};
        })
      )
    );
  }
}
