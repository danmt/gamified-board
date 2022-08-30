import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity } from '../utils';

export type InstructionTaskDto = Entity<{
  name: string;
  ownerId: string;
  instructionId: string;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionTaskApiService {
  private readonly _firestore = inject(Firestore);

  transferInstructionTask(
    previousInstructionId: string,
    newInstructionId: string,
    instructionTaskId: string,
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

          const previousInstructionTasks = (previousInstruction.data()?.[
            'tasks'
          ] ?? []) as InstructionTaskDto[];
          const newInstructionTasks = (newInstruction.data()?.['tasks'] ??
            []) as InstructionTaskDto[];
          const task =
            previousInstructionTasks.find(
              (task) => task.id === instructionTaskId
            ) ?? null;

          if (task === null) {
            throw new Error('Task not found');
          }

          transaction.update(previousInstructionRef, {
            tasks: previousInstructionTasks.filter(
              (task: InstructionTaskDto) => task.id !== instructionTaskId
            ),
          });
          transaction.update(newInstructionRef, {
            tasks: [
              ...newInstructionTasks.slice(0, newIndex),
              task,
              ...newInstructionTasks.slice(newIndex + 1),
            ],
          });

          return {};
        })
      )
    );
  }

  deleteInstructionTask(instructionId: string, instructionTaskId: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

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

  updateInstructionTask(
    instructionId: string,
    instructionTaskId: string,
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
                name,
              },
              ...instructionTasks.slice(index + 1),
            ],
          });

          return {};
        })
      )
    );
  }

  createInstructionTask(
    ownerId: string,
    newInstructionTaskId: string,
    name: string,
    instructionId: string
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

          // push task to the instruction's tasks list
          transaction.update(instructionRef, {
            tasks: [
              ...(instructionData && instructionData['tasks']
                ? instructionData['tasks']
                : []),
              {
                id: newInstructionTaskId,
                name,
                ownerId,
                instructionId,
              },
            ],
          });

          return {};
        })
      )
    );
  }

  updateInstructionTasksOrder(
    ownerId: string,
    instructionTasksOrder: string[]
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${ownerId}`
          );

          const instruction = await transaction.get(instructionRef);
          const tasks = (instruction.data()?.['tasks'] ??
            []) as InstructionTaskDto[];

          transaction.update(instructionRef, {
            tasks: instructionTasksOrder.map((instructionTaskId) => {
              const instructionTaskIndex = tasks.findIndex(
                (instructionTask) => instructionTask.id === instructionTaskId
              );

              return tasks[instructionTaskIndex];
            }),
          });

          return {};
        })
      )
    );
  }
}
