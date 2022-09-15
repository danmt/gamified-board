import { Pipe, PipeTransform } from '@angular/core';
import { isNull, Option } from '../../shared/utils';

type Kind = 'arguments' | 'applications' | 'documents' | 'signers' | 'sysvars';

interface Task {
  id: string;
  arguments: {
    id: string;
  }[];
  applications: {
    id: string;
  }[];
  documents: {
    id: string;
  }[];
  signers: {
    id: string;
  }[];
  sysvars: {
    id: string;
  }[];
}

interface Instruction {
  id: string;
  tasks: Task[];
}

@Pipe({
  name: 'pgInstructionsTasksReferencesDropListsIds',
  standalone: true,
})
export class InstructionsTasksReferencesDropListsIdsPipe
  implements PipeTransform
{
  transform(instructions: Option<Instruction[]>, kind: Kind): string[] {
    if (isNull(instructions)) {
      return [];
    }

    return instructions.reduce<string[]>(
      (dropListIds, instruction) =>
        dropListIds.concat(
          instruction.tasks.reduce<string[]>(
            (dropListIds, task) =>
              dropListIds.concat(
                this._getDropListIds(instruction.id, task, kind)
              ),
            []
          )
        ),
      []
    );
  }

  private _getDropListIds(instructionId: string, task: Task, kind: Kind) {
    switch (kind) {
      case 'arguments':
        return task.arguments.map(
          (argument) => `${instructionId}/${task.id}/${argument.id}`
        );

      case 'applications':
        return task.applications.map(
          (application) => `${instructionId}/${task.id}/${application.id}`
        );

      case 'documents':
        return task.documents.map(
          (document) => `${instructionId}/${task.id}/${document.id}`
        );

      case 'signers':
        return task.signers.map(
          (signer) => `${instructionId}/${task.id}/${signer.id}`
        );

      case 'sysvars':
        return task.sysvars.map(
          (sysvar) => `${instructionId}/${task.id}/${sysvar.id}`
        );
    }
  }
}
