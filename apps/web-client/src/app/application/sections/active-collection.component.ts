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
import { CreateCollectionModalDirective } from '../components';

export interface AddCollectionNodeDto {
  payload: Entity<{
    kind: 'collection';
    data: {
      name: string;
      thumbnailUrl: string;
    };
  }>;
  options: {
    position: {
      x: number;
      y: number;
    };
  };
}

export interface ActiveCollectionData {
  thumbnailUrl: string;
}

interface ViewModel {
  canAdd: boolean;
  isAdding: boolean;
  active: Option<ActiveCollectionData>;
}

const initialState: ViewModel = {
  canAdd: false,
  isAdding: false,
  active: null,
};

@Component({
  selector: 'pg-active-collection',
  template: `
    <pg-active
      *ngIf="active$ | ngrxPush as active"
      [pgActive]="active"
      [pgCanAdd]="(canAdd$ | ngrxPush) ?? false"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [ngClass]="{ hidden: (isAdding$ | ngrxPush) }"
      pgKeyListener="Escape"
      (pgKeyDown)="onEscapePressed()"
      pgCreateCollectionModal
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
    CreateCollectionModalDirective,
  ],
})
export class ActiveCollectionComponent
  extends ComponentStore<ViewModel>
  implements OnInit
{
  private readonly _mouseMove = new Subject<MouseEvent>();

  readonly active$ = this.select(({ active }) => active);
  readonly canAdd$ = this.select(({ canAdd }) => canAdd);
  readonly isAdding$ = this.select(({ isAdding }) => isAdding);

  @Input() set pgActive(active: Option<ActiveCollectionData>) {
    this.patchState({ active });
  }
  @Input() set pgClickEvent(event: Option<ClickEvent>) {
    if (isNotNull(event)) {
      this._handleDrawerClick(event);
    }
  }
  @Output() pgAddNode = new EventEmitter<AddCollectionNodeDto>();
  @Output() pgDeactivate = new EventEmitter();
  @ViewChild(CreateCollectionModalDirective)
  createCollectionModal: Option<CreateCollectionModalDirective> = null;

  private readonly _handleDrawerClick = this.effect<ClickEvent>(
    exhaustMap((event) => {
      return of(null).pipe(
        withLatestFrom(this.active$),
        concatMap(([, active]) => {
          if (isNull(active) || isNull(this.createCollectionModal)) {
            return EMPTY;
          }

          return this.createCollectionModal.open().closed.pipe(
            tap((collection) => {
              if (collection) {
                this.pgDeactivate.emit();
                this.pgAddNode.emit({
                  payload: {
                    id: generateId(),
                    kind: 'collection',
                    data: {
                      name: collection.name,
                      thumbnailUrl: active.thumbnailUrl,
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
