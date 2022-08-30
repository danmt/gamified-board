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
    <div class="flex flex-col relative mt-10 z-40">
      <div class="flex relative" style="height:78px">
        <div class="bp-skin-metal-detail absolute -top-2.5 z-20"></div>
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
          <div class="flex-1 px-4 pt-4 pb-10 overflow-auto bp-skin-metal-body">
            <div
              *ngrxLet="instructions$; let instructions"
              id="instructions-section"
              cdkDropList
              [cdkDropListConnectedTo]="[
                'slot-0',
                'slot-1',
                'slot-2',
                'slot-3',
                'slot-4',
                'slot-5',
                'slot-6',
                'slot-7',
                'slot-8',
                'slot-9'
              ]"
              [cdkDropListData]="instructions"
              cdkDropListSortingDisabled
              class="flex flex-wrap gap-2"
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
                  [cdkDragData]="{ id: instruction.id, kind: 'instruction' }"
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
        </div>
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
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly instructions$ = this._boardStore.instructions$;

  onActivateInstruction(instructionId: string) {
    console.log('alo');
    this._boardStore.setActiveId(instructionId);
  }

  onSelectInstruction(instructionId: string) {
    this._boardStore.setSelectedId(instructionId);
  }

  onCreateInstruction(
    workspaceId: string,
    applicationId: string,
    id: string,
    name: string,
    thumbnailUrl: string,
    args: { id: string; name: string; type: string; isOption: boolean }[]
  ) {
    this._instructionApiService
      .createInstruction(
        workspaceId,
        applicationId,
        id,
        name,
        thumbnailUrl,
        args
      )
      .subscribe();
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
      .subscribe(() => this._boardStore.setSelectedId(null));
  }

  onDragStart(event: CdkDragStart) {
    this._isDragging.next(event.source.data.id);
  }

  onDragEnd() {
    this._isDragging.next(null);
  }

  trackBy(index: number): number {
    return index;
  }
}
