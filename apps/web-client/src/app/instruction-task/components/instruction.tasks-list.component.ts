import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { Brick } from '../../board';
import { DefaultImageDirective, Entity, Option } from '../../shared';
import { InstructionTaskTooltipDirective } from '../components';
import { InstructionTaskReferenceDropListIdPipe } from '../pipes';

type InstructionTask = Entity<{
  kind: 'instructionTask';
  name: string;
  instruction: {
    id: string;
    name: string;
    thumbnailUrl: string;
  };
  arguments: {
    id: string;
    name: string;
    type: string;
    reference: Option<{
      name: string;
    }>;
  }[];
  documents: {
    id: string;
    name: string;
    method: string;
    collection: {
      name: string;
      thumbnailUrl: string;
    };
    reference: Option<{
      name: string;
    }>;
  }[];
  signers: {
    id: string;
    name: string;
    reference: Option<{
      name: string;
    }>;
  }[];
  sysvars: {
    id: string;
    name: string;
    sysvar: {
      name: string;
      thumbnailUrl: string;
    };
    reference: Option<{
      name: string;
    }>;
  }[];
  applications: {
    id: string;
    name: string;
    application: {
      name: string;
      thumbnailUrl: string;
    };
    reference: Option<{
      name: string;
    }>;
  }[];
}>;

@Component({
  selector: 'pg-instruction-tasks-list',
  template: `
    <p>Tasks</p>

    <div class="flex gap-4" *ngIf="pgInstructionId !== null">
      <div
        *ngFor="
          let instructionTask of pgInstructionTasks;
          trackBy: trackBy;
          let i = index
        "
        class="bg-gray-800 relative w-80 min-h-[10rem]"
        style="padding: 0.12rem"
      >
        <h3>Task # {{ i + 1 }}</h3>

        <div>
          <p>{{ instructionTask.instruction.name }}</p>

          <button class="w-11 h-11" (click)="onSelect(instructionTask.id)">
            <img
              class="w-full h-full"
              [src]="instructionTask.instruction.thumbnailUrl"
              pgDefaultImage="assets/generic/instruction-task.png"
            />
          </button>
        </div>

        <div>
          <div>Arguments</div>

          <div class="flex flex-col gap-2">
            <div
              *ngFor="let arg of instructionTask.arguments; trackBy: trackBy"
              [id]="
                arg.id
                  | pgInstructionTaskReferenceDropListId
                    : pgInstructionId
                    : instructionTask.id
              "
              class="bg-black bg-opacity-20 flex gap-2 items-center border-2"
              [ngClass]="{
                'border-yellow-300':
                  pgActive !== null &&
                  pgActive.kind === 'instructionArgument' &&
                  pgActive.instructionId === pgInstructionId,
                'border-transparent':
                  pgActive === null ||
                  pgActive.kind !== 'instructionArgument' ||
                  pgActive.instructionId !== pgInstructionId
              }"
            >
              <div>
                <p>{{ arg.name }}: {{ arg.type }}</p>
                <p>
                  <ng-container *ngIf="arg.reference === null">
                    No reference yet.
                  </ng-container>

                  <ng-container *ngIf="arg.reference !== null">
                    References {{ arg.reference.name }}

                    <button
                      (click)="
                        onRemoveReference(
                          pgInstructionId,
                          instructionTask.id,
                          arg.id,
                          'argument'
                        )
                      "
                    >
                      x
                    </button>
                  </ng-container>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div>Documents</div>

          <div class="flex flex-col gap-2">
            <div
              *ngFor="let doc of instructionTask.documents; trackBy: trackBy"
              [id]="
                doc.id
                  | pgInstructionTaskReferenceDropListId
                    : pgInstructionId
                    : instructionTask.id
              "
              class="bg-black bg-opacity-20 flex gap-2 items-center border-2"
              [ngClass]="{
                'border-yellow-300':
                  pgActive !== null &&
                  pgActive.kind === 'instructionDocument' &&
                  pgActive.instructionId === pgInstructionId,
                'border-transparent':
                  pgActive === null ||
                  pgActive.kind !== 'instructionDocument' ||
                  pgActive.instructionId !== pgInstructionId
              }"
            >
              <img
                class="w-10 h-10"
                [src]="doc.collection.thumbnailUrl"
                pgDefaultImage="assets/generic/collection.png"
              />
              <div>
                <p>{{ doc.name }}: {{ doc.collection.name }}</p>
                <p>method: {{ doc.method }}</p>
                <p>
                  <ng-container *ngIf="doc.reference === null">
                    No reference yet.
                  </ng-container>

                  <ng-container *ngIf="doc.reference !== null">
                    References {{ doc.reference.name }}

                    <button
                      (click)="
                        onRemoveReference(
                          pgInstructionId,
                          instructionTask.id,
                          doc.id,
                          'document'
                        )
                      "
                    >
                      x
                    </button>
                  </ng-container>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div>Signers</div>

          <div class="flex flex-col gap-2">
            <div
              *ngFor="let signer of instructionTask.signers"
              [id]="
                signer.id
                  | pgInstructionTaskReferenceDropListId
                    : pgInstructionId
                    : instructionTask.id
              "
              class="bg-black bg-opacity-20 flex gap-2 items-center border-2"
              [ngClass]="{
                'border-yellow-300':
                  pgActive !== null &&
                  pgActive.kind === 'instructionSigner' &&
                  pgActive.instructionId === pgInstructionId,
                'border-transparent':
                  pgActive === null ||
                  pgActive.kind !== 'instructionSigner' ||
                  pgActive.instructionId !== pgInstructionId
              }"
            >
              <img class="w-10 h-10" src="assets/generic/signer.png" />
              <div>
                <p>{{ signer.name }}</p>

                <p>
                  <ng-container *ngIf="signer.reference === null">
                    No reference yet.
                  </ng-container>

                  <ng-container *ngIf="signer.reference !== null">
                    References {{ signer.reference.name }}

                    <button
                      (click)="
                        onRemoveReference(
                          pgInstructionId,
                          instructionTask.id,
                          signer.id,
                          'signer'
                        )
                      "
                    >
                      x
                    </button>
                  </ng-container>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div>Applications</div>

          <div class="flex flex-col gap-2">
            <div
              *ngFor="let application of instructionTask.applications"
              [id]="
                application.id
                  | pgInstructionTaskReferenceDropListId
                    : pgInstructionId
                    : instructionTask.id
              "
              class="bg-black bg-opacity-20 flex gap-2 items-center border-2"
              [ngClass]="{
                'border-yellow-300':
                  pgActive !== null &&
                  pgActive.kind === 'instructionApplication' &&
                  pgActive.instructionId === pgInstructionId,
                'border-transparent':
                  pgActive === null ||
                  pgActive.kind !== 'instructionApplication' ||
                  pgActive.instructionId !== pgInstructionId
              }"
            >
              <img
                class="w-10 h-10"
                [src]="application.application.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-application.png"
              />
              <div>
                <p>{{ application.name }}</p>

                <p>
                  <ng-container *ngIf="application.reference === null">
                    No reference yet.
                  </ng-container>

                  <ng-container *ngIf="application.reference !== null">
                    References {{ application.reference.name }}

                    <button
                      (click)="
                        onRemoveReference(
                          pgInstructionId,
                          instructionTask.id,
                          application.id,
                          'application'
                        )
                      "
                    >
                      x
                    </button>
                  </ng-container>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div>Sysvars</div>

          <div class="flex flex-col gap-2">
            <div
              *ngFor="let sysvar of instructionTask.sysvars"
              [id]="
                sysvar.id
                  | pgInstructionTaskReferenceDropListId
                    : pgInstructionId
                    : instructionTask.id
              "
              class="bg-black bg-opacity-20 flex gap-2 items-center border-2"
              [ngClass]="{
                'border-yellow-300':
                  pgActive !== null &&
                  pgActive.kind === 'instructionSysvar' &&
                  pgActive.instructionId === pgInstructionId,
                'border-transparent':
                  pgActive === null ||
                  pgActive.kind !== 'instructionSysvar' ||
                  pgActive.instructionId !== pgInstructionId
              }"
            >
              <img
                class="w-10 h-10"
                [src]="sysvar.sysvar.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction-sysvar.png"
              />
              <div>
                <p>{{ sysvar.name }}</p>

                <p>
                  <ng-container *ngIf="sysvar.reference === null">
                    No reference yet.
                  </ng-container>

                  <ng-container *ngIf="sysvar.reference !== null">
                    References {{ sysvar.reference.name }}

                    <button
                      (click)="
                        onRemoveReference(
                          pgInstructionId,
                          instructionTask.id,
                          sysvar.id,
                          'sysvar'
                        )
                      "
                    >
                      x
                    </button>
                  </ng-container>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DefaultImageDirective,
    InstructionTaskTooltipDirective,
    InstructionTaskReferenceDropListIdPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'instructionTasksList',
})
export class InstructionTasksListComponent {
  @Input() pgInstructionId: Option<string> = null;
  @Input() pgActive: Option<Brick> = null;
  @Input() pgInstructionTasks: InstructionTask[] = [];
  @Output() pgSelect = new EventEmitter<{
    id: string;
    kind: 'instructionTask';
  }>();
  @Output() pgRemoveReference = new EventEmitter<{
    instructionId: string;
    taskId: string;
    referenceId: string;
    kind: 'document' | 'signer' | 'sysvar' | 'application' | 'argument';
  }>();

  @HostBinding('class') class = 'flex flex-col';

  onSelect(selectId: string) {
    this.pgSelect.emit({ id: selectId, kind: 'instructionTask' });
  }

  trackBy(index: number): number {
    return index;
  }

  onRemoveReference(
    instructionId: string,
    taskId: string,
    referenceId: string,
    kind: 'document' | 'signer' | 'sysvar' | 'application' | 'argument'
  ) {
    this.pgRemoveReference.emit({ instructionId, taskId, referenceId, kind });
  }
}
