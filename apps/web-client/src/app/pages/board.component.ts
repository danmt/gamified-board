import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {
  GlobalPositionStrategy,
  NoopScrollStrategy,
} from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  inject,
} from '@angular/core';
import { v4 as uuid } from 'uuid';
import {
  BoardComponent,
  CollectionsComponent,
  HotKey,
  InstructionsComponent,
  MainDockComponent,
  NavigationWrapperComponent,
  SelectedDockComponent,
} from '../components';
import { PluginsService } from '../plugins';
import {
  ActiveItem,
  BoardInstruction,
  BoardItemKind,
  Collection,
  Instruction,
  MainDockSlots,
  Option,
  SelectedBoardItem,
} from '../utils';

@Component({
  selector: 'pg-board-page',
  template: `
    <pg-navigation-wrapper zPosition="z-30"></pg-navigation-wrapper>
    <pg-main-dock
      *ngIf="selected === null"
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
      [slots]="slots"
      [hotkeys]="hotkeys"
      [active]="active"
      (swapSlots)="onSwapSlots($event[0], $event[1])"
      (removeFromSlot)="onRemoveFromSlot($event)"
      (activateSlot)="onSlotActivate($event)"
      (updateSlot)="onUpdateSlot($event.index, $event.data)"
    ></pg-main-dock>
    <pg-selected-dock
      *ngIf="selected !== null"
      [selected]="selected"
      class="fixed bottom-0 z-10 -translate-x-1/2 left-1/2"
    ></pg-selected-dock>
    <pg-board
      [instructions]="boardInstructions"
      [active]="active"
      (useItem)="onUseItem($event.instructionId, $event.item)"
      (selectItem)="
        onSelectItem($event.instructionId, $event.itemId, $event.kind)
      "
      (moveDocument)="
        onMoveDocument(
          $event.instructionId,
          $event.previousIndex,
          $event.newIndex
        )
      "
      (transferDocument)="
        onTransferDocument(
          $event.previousInstructionId,
          $event.newInstructionId,
          $event.previousIndex,
          $event.newIndex
        )
      "
      (moveTask)="
        onMoveTask($event.instructionId, $event.previousIndex, $event.newIndex)
      "
      (transferTask)="
        onTransferTask(
          $event.previousInstructionId,
          $event.newInstructionId,
          $event.previousIndex,
          $event.newIndex
        )
      "
    ></pg-board>
  `,
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    MainDockComponent,
    SelectedDockComponent,
    BoardComponent,
    NavigationWrapperComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPageComponent {
  private readonly _pluginsService = inject(PluginsService);
  private readonly _dialog = inject(Dialog);

  active: Option<ActiveItem> = null;
  selected: Option<SelectedBoardItem> = null;
  boardInstructions: BoardInstruction[] = [
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
    {
      id: uuid(),
      documents: [],
      tasks: [],
    },
  ];
  plugins = this._pluginsService.plugins;
  slots: MainDockSlots = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  hotkeys: HotKey[] = [
    {
      slot: 0,
      key: 'q',
    },
    {
      slot: 1,
      key: 'w',
    },
    {
      slot: 2,
      key: 'e',
    },
    {
      slot: 3,
      key: 'r',
    },
    {
      slot: 4,
      key: 't',
    },
    {
      slot: 5,
      key: 'y',
    },
    {
      slot: 6,
      key: '1',
    },
    {
      slot: 7,
      key: '2',
    },
    {
      slot: 8,
      key: '3',
    },
    {
      slot: 9,
      key: '4',
    },
    {
      slot: 10,
      key: '5',
    },
    {
      slot: 11,
      key: '6',
    },
  ];

  collectionsDialogRef: Option<
    DialogRef<CollectionsComponent, CollectionsComponent>
  > = null;
  instructionsDialogRef: Option<
    DialogRef<InstructionsComponent, InstructionsComponent>
  > = null;
  @HostBinding('class') class = 'block';
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Delete': {
        if (this.selected !== null) {
          if (confirm('Are you sure? This action cannot be reverted.')) {
            const instructionIndex =
              this.boardInstructions.findIndex(
                ({ id }) => id === this.selected?.instructionId
              ) ?? null;

            if (instructionIndex !== null) {
              this.boardInstructions = [
                ...this.boardInstructions.slice(0, instructionIndex),
                {
                  ...this.boardInstructions[instructionIndex],
                  // if kind is document remove the item from documents, otherwise dont change
                  documents:
                    this.selected.kind === 'document'
                      ? this.boardInstructions[
                          instructionIndex
                        ].documents.filter(({ id }) => id !== this.selected?.id)
                      : this.boardInstructions[instructionIndex].documents,
                  // if kind is task remove the item from tasks, otherwise dont change
                  tasks:
                    this.selected.kind === 'task'
                      ? this.boardInstructions[instructionIndex].tasks.filter(
                          ({ id }) => id !== this.selected?.id
                        )
                      : this.boardInstructions[instructionIndex].tasks,
                },
                ...this.boardInstructions.slice(instructionIndex + 1),
              ];
            }

            this.selected = null;
          }
        }

        break;
      }
      case 'Escape': {
        if (
          this.collectionsDialogRef !== null ||
          this.instructionsDialogRef !== null
        ) {
          this.collectionsDialogRef?.close();
          this.collectionsDialogRef = null;
          this.instructionsDialogRef?.close();
          this.instructionsDialogRef = null;
        } else if (this.active !== null) {
          this.active = null;
        } else if (this.selected !== null) {
          this.selected = null;
        }

        break;
      }
      case '.': {
        if (this.collectionsDialogRef === null) {
          this.collectionsDialogRef = this._dialog.open(CollectionsComponent, {
            data: this._pluginsService.plugins,
            width: '300px',
            height: '500px',
            hasBackdrop: false,
            scrollStrategy: new NoopScrollStrategy(),
            positionStrategy: new GlobalPositionStrategy()
              .right('0')
              .centerVertically(),
            disableClose: true,
          });
          this.collectionsDialogRef.closed.subscribe(() => {
            this.collectionsDialogRef = null;
          });
        } else {
          this.collectionsDialogRef.close();
          this.collectionsDialogRef = null;
        }

        break;
      }
      case ',': {
        if (this.instructionsDialogRef === null) {
          this.instructionsDialogRef = this._dialog.open(
            InstructionsComponent,
            {
              data: this._pluginsService.plugins,
              width: '300px',
              height: '500px',
              hasBackdrop: false,
              scrollStrategy: new NoopScrollStrategy(),
              positionStrategy: new GlobalPositionStrategy()
                .left('0')
                .centerVertically(),
              disableClose: true,
            }
          );
          this.instructionsDialogRef.closed.subscribe(() => {
            this.instructionsDialogRef = null;
          });
        } else {
          this.instructionsDialogRef.close();
          this.instructionsDialogRef = null;
        }

        break;
      }
    }
  }

  onRemoveFromSlot(index: number) {
    this.slots[index] = null;
  }

  onSwapSlots(previousIndex: number, newIndex: number) {
    const temp = this.slots[newIndex];
    this.slots[newIndex] = this.slots[previousIndex];
    this.slots[previousIndex] = temp;
  }

  onSlotActivate(index: number) {
    const data = this.slots[index] ?? null;

    if (data !== null) {
      this.active = {
        kind: index < 6 ? 'instruction' : 'collection',
        data: data,
      };
    }
  }

  onUpdateSlot(index: number, data: Instruction | Collection) {
    this.slots[index] = data;
  }

  onUseItem(instructionId: string, item: Option<ActiveItem>) {
    const instructionIndex =
      this.boardInstructions.findIndex(({ id }) => id === instructionId) ??
      null;

    if (item !== null && instructionIndex !== null) {
      this.active = null;

      if (item.kind === 'instruction') {
        this.boardInstructions[instructionIndex] = {
          ...this.boardInstructions[instructionIndex],
          tasks: [
            ...this.boardInstructions[instructionIndex].tasks,
            {
              id: uuid(),
              thumbnailUrl: item.data.thumbnailUrl,
              kind: 'task',
            },
          ],
        };
      } else {
        this.boardInstructions[instructionIndex] = {
          ...this.boardInstructions[instructionIndex],
          documents: [
            ...this.boardInstructions[instructionIndex].documents,
            {
              id: uuid(),
              thumbnailUrl: item.data.thumbnailUrl,
              kind: 'document',
            },
          ],
        };
      }
    }
  }

  onSelectItem(instructionId: string, itemId: string, kind: BoardItemKind) {
    const instruction =
      this.boardInstructions.find(({ id }) => id === instructionId) ?? null;

    if (instruction !== null) {
      if (kind === 'document') {
        const document =
          instruction.documents.find(({ id }) => id === itemId) ?? null;

        if (document !== null) {
          this.selected = { ...document, instructionId, kind };
        }
      } else if (kind === 'task') {
        const task = instruction.tasks.find(({ id }) => id === itemId) ?? null;

        if (task !== null) {
          this.selected = { ...task, instructionId, kind };
        }
      }
    }
  }

  onMoveDocument(
    instructionId: string,
    previousIndex: number,
    newIndex: number
  ) {
    const instructionIndex = this.boardInstructions.findIndex(
      ({ id }) => id === instructionId
    );

    if (instructionIndex === -1) {
      throw new Error('Invalid instruction.');
    }

    moveItemInArray(
      this.boardInstructions[instructionIndex].documents,
      previousIndex,
      newIndex
    );
  }

  onTransferDocument(
    previousInstructionId: string,
    newInstructionId: string,
    previousIndex: number,
    newIndex: number
  ) {
    const previousInstructionIndex = this.boardInstructions.findIndex(
      ({ id }) => id === previousInstructionId
    );

    if (previousInstructionIndex === -1) {
      throw new Error('Invalid previous instruction.');
    }

    const newInstructionIndex = this.boardInstructions.findIndex(
      ({ id }) => id === newInstructionId
    );

    if (newInstructionIndex === -1) {
      throw new Error('Invalid new instruction.');
    }

    transferArrayItem(
      this.boardInstructions[previousInstructionIndex].documents,
      this.boardInstructions[newInstructionIndex].documents,
      previousIndex,
      newIndex
    );
  }

  onMoveTask(instructionId: string, previousIndex: number, newIndex: number) {
    const instructionIndex = this.boardInstructions.findIndex(
      ({ id }) => id === instructionId
    );

    if (instructionIndex === -1) {
      throw new Error('Invalid instruction.');
    }

    moveItemInArray(
      this.boardInstructions[instructionIndex].tasks,
      previousIndex,
      newIndex
    );
  }

  onTransferTask(
    previousInstructionId: string,
    newInstructionId: string,
    previousIndex: number,
    newIndex: number
  ) {
    const previousInstructionIndex = this.boardInstructions.findIndex(
      ({ id }) => id === previousInstructionId
    );

    if (previousInstructionIndex === -1) {
      throw new Error('Invalid previous instruction.');
    }

    const newInstructionIndex = this.boardInstructions.findIndex(
      ({ id }) => id === newInstructionId
    );

    if (newInstructionIndex === -1) {
      throw new Error('Invalid new instruction.');
    }

    transferArrayItem(
      this.boardInstructions[previousInstructionIndex].tasks,
      this.boardInstructions[newInstructionIndex].tasks,
      previousIndex,
      newIndex
    );
  }
}
