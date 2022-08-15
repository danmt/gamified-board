import { transferArrayItem } from '@angular/cdk/drag-drop';
import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Instruction } from '../utils';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly _firestore = inject(Firestore);

  createTask(instructionId: string, taskInstruction: Instruction) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );
          const newTaskId = uuid();
          const newTaskRef = doc(
            this._firestore,
            `instructions/${instructionId}/tasks/${newTaskId}`
          );
          const instruction = await transaction.get(instructionRef);
          const instructionData = instruction.data();

          // create the new task
          transaction.set(newTaskRef, {
            name: 'sample #1',
            isInternal: taskInstruction.isInternal,
            instructionRef: doc(
              this._firestore,
              `instructions/${taskInstruction.id}`
            ),
            namespace: taskInstruction.namespace ?? null,
            plugin: taskInstruction.plugin ?? null,
            instruction: taskInstruction.name ?? null,
          });
          // push task id to the tasksOrder
          transaction.update(instructionRef, {
            tasksOrder: [
              ...(instructionData ? instructionData['tasksOrder'] : []),
              newTaskId,
            ],
          });

          return {};
        })
      )
    );
  }

  transferTask(
    instructions: { id: string; tasks: { id: string }[] }[],
    previousInstructionId: string,
    newInstructionId: string,
    taskId: string,
    previousIndex: number,
    newIndex: number
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const previousInstructionIndex = instructions.findIndex(
            ({ id }) => id === previousInstructionId
          );

          if (previousInstructionIndex === -1) {
            throw new Error('Invalid previous instruction.');
          }

          const previousInstructionRef = doc(
            this._firestore,
            `instructions/${previousInstructionId}`
          );

          const newInstructionIndex = instructions.findIndex(
            ({ id }) => id === newInstructionId
          );

          if (newInstructionIndex === -1) {
            throw new Error('Invalid new instruction.');
          }

          const newInstructionRef = doc(
            this._firestore,
            `instructions/${newInstructionId}`
          );

          const previousInstructionTasks = instructions[
            previousInstructionIndex
          ].tasks.map(({ id }) => id);
          const newInstructionTasks = instructions[
            newInstructionIndex
          ].tasks.map(({ id }) => id);

          transferArrayItem(
            previousInstructionTasks,
            newInstructionTasks,
            previousIndex,
            newIndex
          );

          const currentTaskRef = doc(
            this._firestore,
            `instructions/${previousInstructionId}/tasks/${taskId}`
          );
          const newTaskRef = doc(
            this._firestore,
            `instructions/${newInstructionId}/tasks/${taskId}`
          );

          const task = await transaction.get(currentTaskRef);
          // remove from previous instruction tasks
          transaction.update(previousInstructionRef, {
            tasksOrder: previousInstructionTasks,
          });
          // remove from previous instruction tasksOrder
          transaction.delete(currentTaskRef);

          // add it to new instruction tasks
          transaction.set(newTaskRef, task.data());
          // update new instruction tasks order
          transaction.update(newInstructionRef, {
            tasksOrder: newInstructionTasks,
          });

          return {};
        })
      )
    );
  }

  deleteTask(instructionId: string, taskId: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

          const instruction = await transaction.get(instructionRef);

          const tasksOrder = instruction
            .data()
            ?.['tasksOrder'].filter((task: string) => task !== taskId);

          transaction.update(instructionRef, { tasksOrder });
          transaction.delete(
            doc(
              this._firestore,
              `instructions/${instructionId}/tasks/${taskId}`
            )
          );

          return {};
        })
      )
    );
  }
}
