import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject } from 'rxjs';
import { EditInstructionModalDirective } from '../modals';
import { InstructionApiService } from '../services';
import { BoardStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-instructions-section',
  template: `
    <div class="flex flex-col relative mt-20">
      <!-- <div class="bp-skin-sidbar-left absolute -z-10"></div> -->
      <div class="flex relative" style="height:80px">
        <div class="bp-skin-metal-detail absolute -top-2 z-20"></div>
        <div class="bp-skin-metal-border flex-1 z-10"></div>
        <div class="absolute w-full bp-skin-title-box">
          <h1 class="bp-font-game text-3xl px-4 mt-6">Instructions</h1>
        </div>
        <div class="bp-skin-metal-corner-right-top z-10"></div>
      </div>

      <div class="relative bp-bg-futuristic">
        <div
          class="bp-skin-metal-border-right absolute right-0 h-full z-20"
        ></div>
        <div>
          <div class="flex-1 px-4 py-6 overflow-auto bp-skin-metal-body">
            <div
              *ngrxLet="instructions$; let instructions"
              id="instructions-section"
              cdkDropList
              [cdkDropListConnectedTo]="[
                'instruction-slot-0',
                'instruction-slot-1',
                'instruction-slot-2',
                'instruction-slot-3',
                'instruction-slot-4',
                'instruction-slot-5'
              ]"
              [cdkDropListData]="instructions"
              cdkDropListSortingDisabled
              class="flex flex-wrap gap-4"
            >
              <div
                *ngFor="let instruction of instructions; trackBy: trackBy"
                class="relative"
              >
                <ng-container
                  *ngIf="(isDragging$ | ngrxPush) === instruction.id"
                >
                  <div
                    class="w-full h-full absolute z-20 bg-black bg-opacity-50"
                  ></div>
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="instruction.thumbnailUrl"
                    />
                  </div>
                </ng-container>

                <div
                  cdkDrag
                  [cdkDragData]="instruction.id"
                  (click)="onSelectInstruction(instruction.id)"
                  (dblclick)="onActivateInstruction(instruction.id)"
                  (cdkDragStarted)="onDragStart($event)"
                  (cdkDragEnded)="onDragEnd()"
                >
                  <div class="bg-yellow-500 p-0.5 w-11 h-11">
                    <img
                      class="w-full h-full object-cover"
                      [src]="instruction.thumbnailUrl"
                    />
                  </div>

                  <div
                    *cdkDragPreview
                    class="bg-gray-500 p-1 w-12 h-12 rounded-md"
                  >
                    <img
                      class="w-full h-full object-cover"
                      [src]="instruction.thumbnailUrl"
                    />
                  </div>

                  <div *cdkDragPlaceholder></div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="w-full h-32 p-4 relative"
            *ngrxLet="selectedInstruction$; let instruction"
          >
            <div class="bp-skin-metal-divider"></div>
            {{ instruction?.name }}

            <div>
              <p class="bp-font-game text-2xl text-white mt-4">
                Instruction arguments
              </p>
              <div class="flex gap-2 flex-wrap">
                <div
                  *ngFor="let arg of instruction?.arguments"
                  class="border-2 border-black p-1 text-xs"
                >
                  {{ arg.name }} - {{ arg.type }}
                </div>
              </div>
            </div>

            <button
              *ngIf="
                instruction !== null &&
                instruction.applicationId !== null &&
                instruction.applicationId === (currentApplicationId$ | ngrxPush)
              "
              pgEditInstructionModal
              [instruction]="instruction"
              (updateInstruction)="
                onUpdateInstruction(
                  instruction.id,
                  $event.name,
                  $event.thumbnailUrl,
                  $event.arguments
                )
              "
            >
              edit
            </button>

            <button
              *ngIf="
                instruction !== null &&
                instruction.applicationId !== null &&
                instruction.applicationId === (currentApplicationId$ | ngrxPush)
              "
              class="rounded-full bg-slate-400 w-8 h-8"
              (click)="
                onDeleteInstruction(instruction.applicationId, instruction.id)
              "
            >
              x
            </button>

            <a
              class="underline"
              *ngIf="
                instruction !== null &&
                instruction.workspaceId === (workspaceId$ | ngrxPush) &&
                instruction.applicationId !== (currentApplicationId$ | ngrxPush)
              "
              [routerLink]="[
                '/board',
                instruction.workspaceId,
                instruction.applicationId
              ]"
            >
              view
            </a>
          </div>
        </div>
      </div>

      <div
        class="flex items-end relative"
        style="    top: -63px;
    z-index: 1000;"
      >
        <div class="bp-skin-metal-border-bottom flex-1"></div>
        <div class="bp-skin-metal-corner-right-bottom"></div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    DragDropModule,
    CommonModule,
    PushModule,
    LetModule,
    RouterModule,
    EditInstructionModalDirective,
  ],
})
export class InstructionsSectionComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionApiService = inject(InstructionApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  readonly isDragging$ = this._isDragging.asObservable();
  readonly selectedInstruction$ = this._boardStore.selectedInstruction$;
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly instructions$ = this._boardStore.instructions$;

  onActivateInstruction(instructionId: string) {
    this._boardStore.setActiveInstructionId(instructionId);
  }

  onSelectInstruction(instructionId: string) {
    this._boardStore.setSelectedInstructionId(instructionId);
  }

  onUpdateInstruction(
    instructionId: string,
    instructionName: string,
    thumbnailUrl: string,
    args: { id: string; name: string; type: string; isOption: boolean }[]
  ) {
    this._instructionApiService
      .updateInstruction(instructionId, instructionName, thumbnailUrl, args)
      .subscribe();
  }

  onDeleteInstruction(applicationId: string, instructionId: string) {
    this._instructionApiService
      .deleteInstruction(applicationId, instructionId)
      .subscribe(() => this._boardStore.setSelectedInstructionId(null));
  }

  onDragStart(event: CdkDragStart) {
    this._isDragging.next(event.source.data);
  }

  onDragEnd() {
    this._isDragging.next(null);
  }

  trackBy(index: number): number {
    return index;
  }
}
