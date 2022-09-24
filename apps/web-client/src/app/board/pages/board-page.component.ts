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
import { ApplicationDockComponent } from '../../application/sections';
import { ApplicationsStore } from '../../application/stores';
import {
  ActiveCollectionComponent,
  CollectionDockComponent,
  CollectionsInventoryComponent,
} from '../../collection/sections';
import { CollectionsStore } from '../../collection/stores';
import { DrawerComponent } from '../../drawer/sections';
import { DrawerStore } from '../../drawer/stores';
import { InstructionApplicationDockComponent } from '../../instruction-application/sections';
import { InstructionDocumentDockComponent } from '../../instruction-document/sections';
import { InstructionSignerDockComponent } from '../../instruction-signer/sections';
import { InstructionSysvarDockComponent } from '../../instruction-sysvar/sections';
import { InstructionTaskDockComponent } from '../../instruction-task/sections';
import {
  ActiveInstructionComponent,
  InstructionDockComponent,
  InstructionsInventoryComponent,
} from '../../instruction/sections';
import { InstructionsStore } from '../../instruction/stores';
import { ActiveSignerComponent } from '../../signer/sections';
import {
  ActiveSysvarComponent,
  SysvarDockComponent,
  SysvarsInventoryComponent,
} from '../../sysvar/sections';
import { SysvarsStore } from '../../sysvar/stores';
import { WorkspaceStore } from '../../workspace/stores';
import {
  BoardSectionComponent,
  CenterDockSectionComponent,
  LeftDockSectionComponent,
  RightDockSectionComponent,
} from '../sections';
import { ActiveStore, BoardStore } from '../stores';

@Component({
  selector: 'pg-board-page',
  template: `
    <!-- <pg-board-section></pg-board-section> -->
    <pg-drawer></pg-drawer>

    <pg-left-dock-section class="fixed bottom-0 left-0"></pg-left-dock-section>

    <pg-right-dock-section
      class="fixed bottom-0 right-0"
    ></pg-right-dock-section>

    <pg-center-dock-section
      *ngIf="(selected$ | ngrxPush) === null"
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-center-dock-section>

    <pg-instruction-document-dock
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-instruction-document-dock>

    <pg-instruction-task-dock
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-instruction-task-dock>

    <pg-instruction-application-dock
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-instruction-application-dock>

    <pg-instruction-sysvar-dock
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-instruction-sysvar-dock>

    <pg-instruction-signer-dock
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-instruction-signer-dock>

    <pg-collection-dock
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-collection-dock>

    <pg-instruction-dock
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-instruction-dock>

    <pg-application-dock
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-application-dock>

    <pg-sysvar-dock
      class="fixed bottom-0 -translate-x-1/2 left-1/2"
    ></pg-sysvar-dock>

    <pg-collections-inventory
      *ngIf="isCollectionsSectionOpen$ | ngrxPush"
      class="fixed -right-4 top-24"
    ></pg-collections-inventory>

    <pg-sysvars-inventory
      *ngIf="isSysvarsSectionOpen$ | ngrxPush"
      class="fixed -right-4 top-24"
    ></pg-sysvars-inventory>

    <pg-instructions-inventory
      *ngIf="isInstructionsSectionOpen$ | ngrxPush"
      class="fixed -left-4 top-24"
    ></pg-instructions-inventory>

    <!-- <pg-applications-inventory
      *ngIf="isApplicationsSectionOpen$ | ngrxPush"
      class="fixed -left-4 top-24"
    ></pg-applications-inventory> -->

    <!-- <pg-active-application></pg-active-application> -->
    <pg-active-collection></pg-active-collection>
    <pg-active-instruction></pg-active-instruction>
    <pg-active-sysvar></pg-active-sysvar>
    <pg-active-signer></pg-active-signer>
  `,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DialogModule,
    PushModule,
    BoardSectionComponent,
    CenterDockSectionComponent,
    LeftDockSectionComponent,
    RightDockSectionComponent,
    CollectionsInventoryComponent,
    CollectionDockComponent,
    InstructionsInventoryComponent,
    InstructionDockComponent,
    // ApplicationsInventoryComponent,
    ApplicationDockComponent,
    InstructionDocumentDockComponent,
    InstructionTaskDockComponent,
    InstructionApplicationDockComponent,
    InstructionSysvarDockComponent,
    InstructionSignerDockComponent,
    SysvarsInventoryComponent,
    SysvarDockComponent,
    // ActiveApplicationComponent,
    ActiveCollectionComponent,
    ActiveInstructionComponent,
    ActiveSysvarComponent,
    ActiveSignerComponent,
    DrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideComponentStore(BoardStore),
    provideComponentStore(ActiveStore),
    provideComponentStore(WorkspaceStore),
    provideComponentStore(ApplicationsStore),
    provideComponentStore(CollectionsStore),
    provideComponentStore(InstructionsStore),
    provideComponentStore(SysvarsStore),
    provideComponentStore(DrawerStore),
  ],
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
  readonly isSysvarsSectionOpen$ = this._boardStore.isSysvarsSectionOpen$;

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
