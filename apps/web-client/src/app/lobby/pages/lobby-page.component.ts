import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LetModule, PushModule } from '@ngrx/component';
import { provideComponentStore } from '@ngrx/component-store';
import { environment } from '../../../environments/environment';
import {
  CreateProgramModalDirective,
  UpdateProgramModalDirective,
} from '../../program/components';
import { generateId } from '../../shared/utils';
import {
  CreateWorkspaceModalDirective,
  CreateWorkspaceSubmit,
  UpdateWorkspaceModalDirective,
} from '../../workspace/components';
import { WorkspaceGraphApiService } from '../../workspace/services';
import { LobbyStore } from '../stores';

@Component({
  selector: 'pg-lobby-page',
  template: `
    <div>
      <h1>Lobby</h1>

      <div>
        <div>
          <button
            class="border border-blue-500"
            pgCreateWorkspaceModal
            (pgCreateWorkspace)="onCreateWorkspace(userId, $event)"
          >
            New workspace
          </button>
        </div>

        <ul>
          <li *ngFor="let userWorkspace of userWorkspaces$ | ngrxPush">
            {{ userWorkspace.id }} - {{ userWorkspace.data.name }}
            <a
              [routerLink]="['/workspaces', userWorkspace.id]"
              class="text-blue-500 underline"
            >
              view
            </a>
          </li>
        </ul>
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
    CreateWorkspaceModalDirective,
    UpdateWorkspaceModalDirective,
    CreateProgramModalDirective,
    UpdateProgramModalDirective,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideComponentStore(LobbyStore)],
})
export class LobbyPageComponent implements OnInit {
  private readonly _lobbyStore = inject(LobbyStore);
  private readonly _workspaceGraphApiService = inject(WorkspaceGraphApiService);

  readonly userId = environment.userId;

  readonly userWorkspaces$ = this._lobbyStore.workspaces$;

  ngOnInit() {
    this._lobbyStore.setUserId(this.userId);
  }

  onCreateWorkspace(userId: string, data: CreateWorkspaceSubmit) {
    this._workspaceGraphApiService
      .createGraph(environment.clientId, {
        id: generateId(),
        thumbnailUrl: 'assets/generic/workspace.png',
        name: data.name,
        userId,
        kind: 'workspace',
      })
      .subscribe();
  }
}
