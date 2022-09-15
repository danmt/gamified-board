import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { Entity, Option } from '../../shared/utils';
import { InstructionSignerTooltipDirective } from '../components';

type InstructionSigner = Entity<{
  kind: 'instructionSigner';
  name: string;
  ownerId: string;
}>;

@Component({
  selector: 'pg-instruction-signers-list',
  template: `
    <p>Signers</p>

    <div class="flex gap-2 flex-1 min-h-[4rem]">
      <div
        *ngFor="let instructionSigner of pgInstructionSigners; trackBy: trackBy"
        class="bg-gray-800 relative w-11 h-11"
        style="padding: 0.12rem"
        pgInstructionSignerTooltip
        [pgInstructionSigner]="instructionSigner"
      >
        <button
          class="w-full h-full"
          (click)="onSelect(instructionSigner.id)"
          (dblclick)="
            onActivate(instructionSigner.ownerId, instructionSigner.id)
          "
        >
          <img class="w-full h-full" src="assets/generic/signer.png" />
        </button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, InstructionSignerTooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionSignersListComponent {
  @HostBinding('class') class = 'flex flex-col';
  @Input() pgInstructionId: Option<string> = null;
  @Input() pgInstructionSigners: InstructionSigner[] = [];
  @Output() pgSelect = new EventEmitter<{
    id: string;
    kind: 'instructionSigner';
  }>();
  @Output() pgActivate = new EventEmitter<{
    id: string;
    instructionId: string;
    kind: 'instructionSigner';
  }>();

  onSelect(selectId: string) {
    this.pgSelect.emit({ id: selectId, kind: 'instructionSigner' });
  }

  onActivate(instructionId: string, activeId: string) {
    this.pgActivate.emit({
      id: activeId,
      instructionId,
      kind: 'instructionSigner',
    });
  }

  trackBy(index: number): number {
    return index;
  }
}
