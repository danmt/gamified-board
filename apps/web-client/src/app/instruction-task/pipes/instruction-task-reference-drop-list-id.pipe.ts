import { Pipe, PipeTransform } from '@angular/core';
import { Option } from '../../shared/utils';

@Pipe({
  name: 'pgInstructionTaskReferenceDropListId',
  standalone: true,
})
export class InstructionTaskReferenceDropListIdPipe implements PipeTransform {
  transform(
    instructionReferenceId: string,
    instructionId: string,
    taskId: string
  ): Option<string> {
    return `${instructionId}/${taskId}/${instructionReferenceId}`;
  }
}
