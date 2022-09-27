import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { PushModule } from '@ngrx/component';
import { ComponentStore } from '@ngrx/component-store';
import {
  concatMap,
  EMPTY,
  exhaustMap,
  of,
  Subject,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ClickEvent } from '../../drawer/utils';
import { ActiveComponent } from '../../shared/components';
import {
  FollowCursorDirective,
  KeyListenerDirective,
} from '../../shared/directives';
import {
  Entity,
  generateId,
  isChildOf,
  isNotNull,
  isNull,
  Option,
} from '../../shared/utils';
import { CreateAccountModalDirective } from '../components';
import { AccountMethodType, SeedType } from '../utils';

export interface AddAccountNodeDto {
  payload: Entity<{
    kind: 'account';
    data: {
      name: string;
      thumbnailUrl: string;
      method: AccountMethodType;
      ref: {
        id: string;
        name: string;
      };
      payer: Option<string>;
      space: Option<number>;
      receiver: Option<string>;
      seeds: SeedType[];
    };
  }>;
  options: {
    position: {
      x: number;
      y: number;
    };
  };
}

export interface ActiveAccountData {
  id: string;
  name: string;
  thumbnailUrl: string;
}

interface ViewModel {
  canAdd: boolean;
  isAdding: boolean;
  active: Option<ActiveAccountData>;
}

const initialState: ViewModel = {
  canAdd: false,
  isAdding: false,
  active: null,
};

@Component({
  selector: 'pg-active-account',
  template: `
    <pg-active
      *ngIf="active$ | ngrxPush as active"
      [pgActive]="active"
      [pgCanAdd]="(canAdd$ | ngrxPush) ?? false"
      class="fixed z-50 pointer-events-none"
      pgFollowCursor
      [ngClass]="{ hidden: (isAdding$ | ngrxPush) }"
      pgKeyListener="Escape"
      (pgKeyDown)="onEscapePressed()"
      pgCreateAccountModal
      [pgInstructionAccounts]="pgInstructionAccounts"
    >
    </pg-active>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    FollowCursorDirective,
    ActiveComponent,
    KeyListenerDirective,
    CreateAccountModalDirective,
  ],
})
export class ActiveAccountComponent
  extends ComponentStore<ViewModel>
  implements OnInit
{
  private readonly _mouseMove = new Subject<MouseEvent>();

  readonly active$ = this.select(({ active }) => active);
  readonly canAdd$ = this.select(({ canAdd }) => canAdd);
  readonly isAdding$ = this.select(({ isAdding }) => isAdding);

  @Input() set pgActive(active: Option<ActiveAccountData>) {
    this.patchState({ active });
  }
  @Input() set pgClickEvent(event: Option<ClickEvent>) {
    if (isNotNull(event)) {
      this._handleDrawerClick(event);
    }
  }
  @Input() pgInstructionAccounts: {
    id: string;
    data: { name: string; ref: { name: string } };
  }[] = [];
  @Output() pgAddNode = new EventEmitter<AddAccountNodeDto>();
  @Output() pgDeactivate = new EventEmitter();
  @ViewChild(CreateAccountModalDirective)
  createAccountModal: Option<CreateAccountModalDirective> = null;

  private readonly _handleDrawerClick = this.effect<ClickEvent>(
    exhaustMap((event) => {
      return of(null).pipe(
        withLatestFrom(this.active$),
        concatMap(([, active]) => {
          if (isNull(active) || isNull(this.createAccountModal)) {
            return EMPTY;
          }

          this.patchState({ isAdding: true });

          return this.createAccountModal.open().closed.pipe(
            tap((account) => {
              if (account) {
                this.patchState({ isAdding: false });
                this.pgDeactivate.emit();
                this.pgAddNode.emit({
                  payload: {
                    id: generateId(),
                    kind: 'account',
                    data: {
                      name: account.name,
                      method: account.method,
                      thumbnailUrl: active.thumbnailUrl,
                      ref: {
                        id: active.id,
                        name: active.name,
                      },
                      payer: account.payer,
                      space: account.space,
                      receiver: account.receiver,
                      seeds: [],
                    },
                  },
                  options: {
                    position: event.payload,
                  },
                });
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
          element.matches('#cy')
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
    this._handleMouseMove(this._mouseMove.asObservable());
  }

  onEscapePressed() {
    this.pgDeactivate.emit();
  }
}
