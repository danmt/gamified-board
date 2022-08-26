import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { provideComponentStore } from '@ngrx/component-store';
import { startWith } from 'rxjs';
import {
  EditApplicationModalDirective,
  EditWorkspaceModalDirective,
} from '../modals';
import { ApplicationApiService, WorkspaceApiService } from '../services';
import { LobbyStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-lobby-page',
  template: `
    <div>
      <h1>Lobby</h1>

      <div>
        <div>
          <button
            class="border border-blue-500"
            pgEditWorkspaceModal
            (createWorkspace)="
              onCreateWorkspace(userId, $event.id, $event.name)
            "
          >
            New workspace
          </button>
          <button
            *ngIf="selectedWorkspace$ | ngrxPush as selectedWorkspace"
            class="border border-blue-500"
            pgEditWorkspaceModal
            (updateWorkspace)="
              onUpdateWorkspace(selectedWorkspace.id, $event.name)
            "
            [workspace]="selectedWorkspace"
          >
            Update workspace
          </button>
          <button
            *ngIf="selectedWorkspace$ | ngrxPush as selectedWorkspace"
            class="border border-blue-500"
            (click)="onDeleteWorkspace(selectedWorkspace.id, userId)"
          >
            Delete workspace
          </button>
          <button
            *ngIf="selectedWorkspace$ | ngrxPush as selectedWorkspace"
            class="border border-blue-500"
            (click)="
              onRemoveWorkspaceFromFavorites(selectedWorkspace.id, userId)
            "
          >
            Remove workspace from favorites
          </button>
        </div>

        <select [formControl]="selectedWorkspaceIdControl">
          <option [ngValue]="null">Select a workspace</option>
          <option
            *ngFor="let favoriteWorkspace of favoriteWorkspaces$ | ngrxPush"
            [ngValue]="favoriteWorkspace.id"
          >
            {{ favoriteWorkspace.id }} - {{ favoriteWorkspace.name }}
          </option>
        </select>
      </div>

      <div>
        <div>
          <button
            *ngIf="selectedWorkspace$ | ngrxPush as selectedWorkspace"
            class="border border-blue-500"
            pgEditApplicationModal
            (createApplication)="
              onCreateApplication(
                selectedWorkspace.id,
                $event.id,
                $event.name,
                $event.thumbnailUrl
              )
            "
          >
            New application
          </button>
          <button
            *ngIf="selectedApplication$ | ngrxPush as selectedApplication"
            class="border border-blue-500"
            pgEditApplicationModal
            (updateApplication)="
              onUpdateApplication(
                selectedApplication.id,
                $event.name,
                $event.thumbnailUrl
              )
            "
            [application]="selectedApplication"
          >
            Update application
          </button>
          <button
            *ngIf="selectedApplication$ | ngrxPush as selectedApplication"
            class="border border-blue-500"
            (click)="
              onDeleteApplication(
                selectedApplication.id,
                selectedApplication.workspaceId
              )
            "
          >
            Delete application
          </button>
        </div>

        <select [formControl]="selectedApplicationIdControl">
          <option [ngValue]="null">Select a application</option>
          <option
            *ngFor="
              let application of selectedWorkspaceApplications$ | ngrxPush
            "
            [ngValue]="application.id"
          >
            {{ application.id }} - {{ application.name }}
          </option>
        </select>
      </div>

      <div *ngrxLet="selectedApplication$; let selectedApplication">
        <a
          *ngIf="selectedApplication !== null; else noApplicationSelected"
          [routerLink]="[
            '/board',
            selectedApplication.workspaceId,
            selectedApplication.id
          ]"
        >
          Go to board
        </a>

        <ng-template #noApplicationSelected>
          <p class="text-red-500">Select application to start</p>
        </ng-template>
      </div>
    </div>
  `,
  imports: [
    CommonModule,
    RouterModule,
    DialogModule,
    ReactiveFormsModule,
    LetModule,
    PushModule,
    EditWorkspaceModalDirective,
    EditApplicationModalDirective,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideComponentStore(LobbyStore)],
})
export class LobbyPageComponent implements OnInit {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _lobbyStore = inject(LobbyStore);
  private readonly _workspaceApiService = inject(WorkspaceApiService);
  private readonly _applicationApiService = inject(ApplicationApiService);

  readonly userId = 'p7xARjRPxv8cvbBOR59C';
  readonly selectedWorkspaceIdControl =
    this._formBuilder.control<Option<string>>(null);
  readonly selectedApplicationIdControl =
    this._formBuilder.control<Option<string>>(null);

  readonly favoriteWorkspaces$ = this._lobbyStore.favoriteWorkspaces$;
  readonly selectedWorkspaceApplications$ =
    this._lobbyStore.selectedWorkspaceApplications$;
  readonly selectedWorkspace$ = this._lobbyStore.selectedWorkspace$;
  readonly selectedApplication$ = this._lobbyStore.selectedApplication$;

  ngOnInit() {
    this._lobbyStore.setUserId(this.userId);
    this._lobbyStore.setSelectedWorkspaceId(
      this.selectedWorkspaceIdControl.valueChanges.pipe(
        startWith<Option<string>>(null)
      )
    );
    this._lobbyStore.setSelectedApplicationId(
      this.selectedApplicationIdControl.valueChanges.pipe(
        startWith<Option<string>>(null)
      )
    );
  }

  onCreateWorkspace(
    userId: string,
    workspaceId: string,
    workspaceName: string
  ) {
    this._workspaceApiService
      .createWorkspace(userId, workspaceId, workspaceName)
      .subscribe();
  }

  onUpdateWorkspace(workspaceId: string, workspaceName: string) {
    this._workspaceApiService
      .updateWorkspace(workspaceId, workspaceName)
      .subscribe();
  }

  onDeleteWorkspace(workspaceId: string, userId: string) {
    this._workspaceApiService.deleteWorkspace(workspaceId, userId).subscribe();
  }

  onRemoveWorkspaceFromFavorites(workspaceId: string, userId: string) {
    this._workspaceApiService
      .removeWorkspaceFromFavorites(workspaceId, userId)
      .subscribe();
  }

  onCreateApplication(
    workspaceId: string,
    applicationId: string,
    applicationName: string,
    thumbnailUrl: string
  ) {
    this._applicationApiService
      .createApplication(
        workspaceId,
        applicationId,
        applicationName,
        thumbnailUrl
      )
      .subscribe();
  }

  onUpdateApplication(
    applicationId: string,
    applicationName: string,
    thumbnailUrl: string
  ) {
    this._applicationApiService
      .updateApplication(applicationId, applicationName, thumbnailUrl)
      .subscribe();
  }

  onDeleteApplication(applicationId: string, workspaceId: string) {
    this._applicationApiService
      .deleteApplication(applicationId, workspaceId)
      .subscribe();
  }
}
