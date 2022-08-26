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
    <div class="h-full flex flex-col relative">
      <div class="bp-skin-sidbar-left absolute"></div>
      <div class="custom-style-1 pb-2 z-10 h-full flex flex-col">
        <h1
          class="pt-4 px-2 z-10 text-white bp-font-game text-3xl tracking-wider bp-bg-metal mt-2"
        >
          Instructions
        </h1>

        <div class="flex-1 overflow-auto z-10 px-2 py-4">
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
              <ng-container *ngIf="(isDragging$ | ngrxPush) === instruction.id">
                <div
                  class="w-full h-full absolute z-20 bg-black bg-opacity-50"
                ></div>
                <div class="bg-yellow-500 p-0.5 w-12 h-12">
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
                (cdkDragStarted)="onDragStart($event)"
                (cdkDragEnded)="onDragEnd()"
              >
                <div class="bg-yellow-500 p-0.5 w-12 h-12">
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
          class="w-full h-32 text-white bp-bg-metal overflow-auto z-10 px-2 pt-2"
          *ngrxLet="selectedInstruction$; let instruction"
        >
          <p class="bp-font-game text-lg tracking-wider">Instruction Name</p>
          <p class="bp-font-game text-base tracking-wider">
            {{ instruction?.name }}
          </p>
          <div>
            <p class="bp-font-game text-lg tracking-wider">
              Instruction Arguments
            </p>
            <div class="flex gap-2 flex-wrap">
              <div *ngIf="instruction?.arguments?.length === 0">
                <p class="bp-font-game text-base tracking-wider">None</p>
              </div>
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

  onSelectInstruction(instructionId: string) {
    this._boardStore.setSelectedInstructionId(instructionId);
  }

  onUpdateInstruction(
    instructionId: string,
    instructionName: string,
    thumbnailUrl: string,
    args: { name: string; type: string; isOption: boolean }[]
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
