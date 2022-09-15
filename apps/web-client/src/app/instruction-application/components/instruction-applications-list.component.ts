import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { DefaultImageDirective } from '../../shared/directives';
import { Entity, Option } from '../../shared/utils';
import { InstructionApplicationTooltipDirective } from '../components';

type InstructionApplication = Entity<{
  kind: 'instructionApplication';
  name: string;
  ownerId: string;
  application: {
    name: string;
    thumbnailUrl: string;
  };
}>;

@Component({
  selector: 'pg-instruction-applications-list',
  template: `
    <p>Applications</p>

    <div class="flex gap-2 flex-1 min-h-[4rem]">
      <div
        *ngFor="
          let instructionApplication of pgInstructionApplications;
          trackBy: trackBy
        "
        class="bg-gray-800 relative w-11 h-11"
        style="padding: 0.12rem"
        pgInstructionApplicationTooltip
        [pgInstructionApplication]="instructionApplication"
      >
        <button
          class="w-full h-full"
          (click)="onSelect(instructionApplication.id)"
          (dblclick)="
            onActivate(
              instructionApplication.ownerId,
              instructionApplication.id
            )
          "
        >
          <img
            class="w-full h-full"
            [src]="instructionApplication.application.thumbnailUrl"
            pgDefaultImage="assets/generic/instruction-application.png"
          />
        </button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DefaultImageDirective,
    InstructionApplicationTooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructionApplicationsListComponent {
  @HostBinding('class') class = 'flex flex-col';
  @Input() pgInstructionId: Option<string> = null;
  @Input() pgInstructionApplications: InstructionApplication[] = [];
  @Output() pgSelect = new EventEmitter<{
    id: string;
    kind: 'instructionApplication';
  }>();
  @Output() pgActivate = new EventEmitter<{
    id: string;
    instructionId: string;
    kind: 'instructionApplication';
  }>();

  onSelect(selectId: string) {
    this.pgSelect.emit({ id: selectId, kind: 'instructionApplication' });
  }

  onActivate(instructionId: string, activeId: string) {
    this.pgActivate.emit({
      id: activeId,
      instructionId,
      kind: 'instructionApplication',
    });
  }

  trackBy(index: number): number {
    return index;
  }
}
