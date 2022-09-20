import { CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { BoardStore } from '../../board/stores';
import { InventoryComponent } from '../../shared/components';
import { DefaultImageDirective } from '../../shared/directives';
import { isNull, Option } from '../../shared/utils';
import {
  CreateInstructionModalDirective,
  InstructionTooltipDirective,
} from '../components';
import { InstructionApiService } from '../services';

@Component({
  selector: 'pg-instructions-inventory',
  template: `
    <pg-inventory
      pgDirection="left"
      class="mt-10 min-w-[300px] min-h-[520px] max-h-[520px]"
      [pgTotal]="(total$ | ngrxPush) ?? 0"
      [pgPage]="(page$ | ngrxPush) ?? 1"
      [pgPageSize]="pageSize"
      (pgSetPage)="onSetPage($event)"
    >
      <h2 pgInventoryTitle class="bp-font-game-title text-3xl">Instructions</h2>

      <!-- <button
        class="bp-button-add-futuristic z-20"
        pgInventoryCreateButton
        pgCreateInstructionModal
        [pgWorkspaceId]="(workspaceId$ | ngrxPush) ?? null"
        [pgApplicationId]="(currentApplicationId$ | ngrxPush) ?? null"
        (pgCreateInstruction)="
          onCreateInstruction(
            $event.workspaceId,
            $event.applicationId,
            $event.id,
            $event.name
          )
        "
      ></button> -->

      <div
        pgInventoryBody
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
        class="flex flex-wrap gap-4 justify-center"
      >
        <div
          *ngFor="let instruction of instructions; trackBy: trackBy"
          class="relative"
          pgInstructionTooltip
          [pgInstruction]="instruction"
        >
          <ng-container *ngIf="(isDragging$ | ngrxPush) === instruction.id">
            <div
              class="w-full h-full absolute z-20 bg-black bg-opacity-50"
            ></div>
            <div class="bg-gray-600 p-0.5 w-11 h-11">
              <img
                class="w-full h-full object-cover"
                [src]="instruction.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction.png"
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
            <div class="bg-gray-600 p-0.5 w-11 h-11">
              <img
                class="w-full h-full object-cover"
                [src]="instruction.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction.png"
              />
            </div>

            <div *cdkDragPreview class="bg-gray-500 p-1 w-12 h-12 rounded-md">
              <img
                class="w-full h-full object-cover"
                [src]="instruction.thumbnailUrl"
                pgDefaultImage="assets/generic/instruction.png"
              />
            </div>

            <div *cdkDragPlaceholder></div>
          </div>
        </div>
      </div>
    </pg-inventory>
  `,
  standalone: true,
  imports: [
    DragDropModule,
    CommonModule,
    OverlayModule,
    PushModule,
    LetModule,
    RouterModule,
    CreateInstructionModalDirective,
    DefaultImageDirective,
    InstructionTooltipDirective,
    InventoryComponent,
  ],
})
export class InstructionsInventoryComponent {
  private readonly _boardStore = inject(BoardStore);
  private readonly _instructionApiService = inject(InstructionApiService);

  private readonly _isDragging = new BehaviorSubject<Option<string>>(null);
  private readonly _page = new BehaviorSubject(1);

  readonly isDragging$ = this._isDragging.asObservable();
  readonly workspaceId$ = this._boardStore.workspaceId$;
  readonly currentApplicationId$ = this._boardStore.currentApplicationId$;
  readonly total$ = this._boardStore.instructions$.pipe(
    map((instructions) => instructions?.length ?? 0)
  );
  readonly pageSize = 24;
  readonly page$ = this._page.asObservable();
  readonly instructions$ = combineLatest([
    this._boardStore.instructions$,
    this.page$,
  ]).pipe(
    map(([instructions, page]) => {
      if (isNull(instructions)) {
        return null;
      }

      return instructions.slice(
        page === 1 ? 0 : (page - 1) * this.pageSize,
        page * this.pageSize
      );
    })
  );

  onSetPage(page: number) {
    this._page.next(page);
  }

  onActivateInstruction(instructionId: string) {
    this._boardStore.setActive({ id: instructionId, kind: 'instruction' });
  }

  onSelectInstruction(instructionId: string) {
    this._boardStore.setSelected({ id: instructionId, kind: 'instruction' });
  }

  onCreateInstruction(
    workspaceId: string,
    applicationId: string,
    id: string,
    name: string
  ) {
    this._instructionApiService
      .createInstruction({
        workspaceId,
        applicationId,
        id,
        name,
      })
      .subscribe();
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
