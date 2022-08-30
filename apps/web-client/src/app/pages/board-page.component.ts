import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PushModule } from '@ngrx/component';
import { provideComponentStore } from '@ngrx/component-store';
import { map } from 'rxjs';
import {
  ApplicationSectionComponent,
  ApplicationsSectionComponent,
  BoardSectionComponent,
  CollectionSectionComponent,
  CollectionsSectionComponent,
  DockSectionComponent,
  InstructionDocumentSectionComponent,
  InstructionSectionComponent,
  InstructionsSectionComponent,
  InstructionTaskSectionComponent,
} from '../sections';
import { InstructionApplicationSectionComponent } from '../sections/instruction-application-section.component';
import { BoardStore } from '../stores';

@Component({
  selector: 'pg-board-page',
  template: `
    <pg-board-section></pg-board-section>

    <pg-dock-section
      *ngIf="(selected$ | ngrxPush) === null"
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-dock-section>

    <pg-instruction-document-section
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-instruction-document-section>

    <pg-instruction-task-section
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-instruction-task-section>

    <pg-instruction-application-section
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-instruction-application-section>

    <pg-collection-section
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-collection-section>

    <pg-instruction-section
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-instruction-section>

    <pg-application-section
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-application-section>

    <pg-collections-section
      *ngIf="isCollectionsSectionOpen$ | ngrxPush"
      class="fixed right-0 top-24"
      style="width: 300px; height: 500px"
    ></pg-collections-section>

    <pg-instructions-section
      *ngIf="isInstructionsSectionOpen$ | ngrxPush"
      class="fixed left-0 top-24"
      style="width: 300px; height: 500px"
    ></pg-instructions-section>

    <pg-applications-section
      *ngIf="isApplicationsSectionOpen$ | ngrxPush"
      class="fixed left-0 top-24"
      style="width: 300px; height: 500px"
    ></pg-applications-section>
  `,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DialogModule,
    PushModule,
    BoardSectionComponent,
    DockSectionComponent,
    CollectionsSectionComponent,
    InstructionsSectionComponent,
    ApplicationsSectionComponent,
    ApplicationSectionComponent,
    InstructionDocumentSectionComponent,
    InstructionTaskSectionComponent,
    InstructionApplicationSectionComponent,
    CollectionSectionComponent,
    InstructionSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideComponentStore(BoardStore)],
})
export class BoardPageComponent implements OnInit {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _boardStore = inject(BoardStore);

  readonly selected$ = this._boardStore.selected$;
  readonly isCollectionsSectionOpen$ =
    this._boardStore.isCollectionsSectionOpen$;
  readonly isInstructionsSectionOpen$ =
    this._boardStore.isInstructionsSectionOpen$;
  readonly isApplicationsSectionOpen$ =
    this._boardStore.isApplicationsSectionOpen$;

  @HostBinding('class') class = 'block relative min-h-screen min-w-screen';

  ngOnInit() {
    this._boardStore.setWorkspaceId(
      this._activatedRoute.paramMap.pipe(
        map((paramMap) => paramMap.get('workspaceId'))
      )
    );
    this._boardStore.setCurrentApplicationId(
      this._activatedRoute.paramMap.pipe(
        map((paramMap) => paramMap.get('applicationId'))
      )
    );
  }
}
