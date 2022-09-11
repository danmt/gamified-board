import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { DefaultImageDirective, Entity, Option } from '../../shared';
import { InstructionSysvarTooltipDirective } from '../components';

type InstructionSysvar = Entity<{
  kind: 'instructionSysvar';
  name: string;
  ownerId: string;
  sysvar: {
    name: string;
    thumbnailUrl: string;
  };
}>;

@Component({
  selector: 'pg-instruction-sysvars-list',
  template: `
    <p>Sysvars</p>

    <div class="flex gap-2 flex-1 min-h-[4rem]">
      <div
        *ngFor="let instructionSysvar of pgInstructionSysvars; trackBy: trackBy"
        class="bg-gray-800 relative w-11 h-11"
        style="padding: 0.12rem"
        pgInstructionSysvarTooltip
        [pgInstructionSysvar]="instructionSysvar"
      >
        <button
          class="w-full h-full"
          (click)="onSelect(instructionSysvar.id)"
          (dblclick)="
            onActivate(instructionSysvar.ownerId, instructionSysvar.id)
          "
        >
          <img
            class="w-full h-full"
            [src]="instructionSysvar.sysvar.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-sysvar.png"
          />
        </button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DefaultImageDirective,
    InstructionSysvarTooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionSysvarsListComponent {
  @HostBinding('class') class = 'flex flex-col';
  @Input() pgInstructionId: Option<string> = null;
  @Input() pgInstructionSysvars: InstructionSysvar[] = [];
  @Output() pgSelect = new EventEmitter<{
    id: string;
    kind: 'instructionSysvar';
  }>();
  @Output() pgActivate = new EventEmitter<{
    id: string;
    instructionId: string;
    kind: 'instructionSysvar';
  }>();

  onSelect(selectId: string) {
    this.pgSelect.emit({ id: selectId, kind: 'instructionSysvar' });
  }

  onActivate(instructionId: string, activeId: string) {
    this.pgActivate.emit({
      id: activeId,
      instructionId,
      kind: 'instructionSysvar',
    });
  }

  trackBy(index: number): number {
    return index;
  }
}
