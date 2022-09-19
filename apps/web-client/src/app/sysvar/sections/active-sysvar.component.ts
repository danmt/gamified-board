import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { PushModule } from '@ngrx/component';
import { ComponentStore } from '@ngrx/component-store';
import {
  concatMap,
  EMPTY,
  exhaustMap,
  filter,
  of,
  Subject,
  tap,
  withLatestFrom,
} from 'rxjs';
import { BoardStore } from '../../board/stores';
import { DrawerStore } from '../../drawer/stores';
import { ClickEvent, isClickEvent } from '../../drawer/utils';
import { openEditInstructionSysvarModal } from '../../instruction-sysvar/components';
import { ActiveComponent } from '../../shared/components';
import { FollowCursorDirective } from '../../shared/directives';
import { isChildOf, isNull } from '../../shared/utils';

interface ViewModel {
  canAdd: boolean;
  isAdding: boolean;
}

const initialState: ViewModel = {
  canAdd: false,
  isAdding: false,
};

@Component({
  selector: 'pg-active-sysvar',
  template: `
    <pg-active
      *ngIf="active$ | ngrxPush as active"
      [pgActive]="active"
      [pgCanAdd]="(canAdd$ | ngrxPush) ?? false"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [ngClass]="{ hidden: (isAdding$ | ngrxPush) }"
    ></pg-active>
  `,
  standalone: true,
  imports: [CommonModule, PushModule, FollowCursorDirective, ActiveComponent],
})
export class ActiveSysvarComponent
  extends ComponentStore<ViewModel>
  implements OnInit
{
  private readonly _boardStore = inject(BoardStore);
  private readonly _drawerStore = inject(DrawerStore);
  private readonly _dialog = inject(Dialog);

  private readonly _mouseMove = new Subject<MouseEvent>();

  readonly active$ = this.select(
    this._boardStore.sysvars$,
    this._boardStore.active$,
    (sysvars, active) => {
      if (isNull(sysvars) || isNull(active) || active.kind !== 'sysvar') {
        return null;
      }

      return sysvars.find((sysvar) => sysvar.id === active.id) ?? null;
    }
  );
  readonly canAdd$ = this.select(({ canAdd }) => canAdd);
  readonly isAdding$ = this.select(({ isAdding }) => isAdding);

  private readonly _handleDrawerClick = this.effect<ClickEvent>(
    exhaustMap((event) => {
      return of(event).pipe(
        withLatestFrom(this.active$),
        concatMap(([, active]) => {
          if (isNull(active)) {
            return EMPTY;
          }

          this.patchState({ isAdding: true });

          return openEditInstructionSysvarModal(this._dialog, {
            instructionSysvar: null,
          }).closed.pipe(
            tap((instructionSysvar) => {
              this.patchState({ isAdding: false });

              if (instructionSysvar) {
                this._boardStore.setActive(null);
                /* this._drawerStore.addNode(
                  {
                    id: generateId(),
                    kind: active.kind,
                    name: active.name,
                    ref: active.id,
                    label: instructionSysvar.name,
                    image: active.thumbnailUrl,
                  },
                  event.payload
                ); */
              }
            })
          );
        })
      );
    })
  );

  private readonly _handleMouseMove = this.effect<MouseEvent>(
    tap((event) => {
      this.patchState({
        canAdd: isChildOf(event.target as HTMLElement, (element) =>
          element.matches('pg-drawer')
        ),
      });
    })
  );

  @HostListener('window:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    this._mouseMove.next(event);
  }

  constructor() {
    super(initialState);
  }

  ngOnInit() {
    this._handleDrawerClick(
      this._drawerStore.event$.pipe(filter(isClickEvent))
    );
    this._handleMouseMove(this._mouseMove.asObservable());
  }
}
