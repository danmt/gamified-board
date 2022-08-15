import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LetModule } from '@ngrx/component';
import { provideComponentStore } from '@ngrx/component-store';
import { combineLatest, map, startWith } from 'rxjs';
import { LobbyStore } from '../stores';
import { Option } from '../utils';

@Component({
  selector: 'pg-lobby-page',
  template: `
    <div>
      <h1>Lobby</h1>

      <select [formControl]="selectedWorkspaceControl">
        <option [value]="null">Select a workspace</option>
        <option
          *ngFor="let favoriteWorkspace of favoriteWorkspaces$ | async"
          [value]="favoriteWorkspace.id"
        >
          {{ favoriteWorkspace.id }} - {{ favoriteWorkspace.name }}
        </option>
      </select>

      <select [formControl]="selectedApplicationControl">
        <option [value]="null">Select a application</option>
        <option
          *ngFor="let application of selectedWorkspaceApplications$ | async"
          [value]="application.id"
        >
          {{ application.id }} - {{ application.name }}
        </option>
      </select>

      <ng-container *ngrxLet="selectedWorkspace$; let selectedWorkspace">
        <div *ngrxLet="selectedApplication$; let selectedApplication">
          <a
            *ngIf="selectedApplication !== null; else noApplicationSelected"
            [routerLink]="['/board', selectedWorkspace, selectedApplication]"
          >
            Go to board
          </a>

          <ng-template #noApplicationSelected>
            <p class="text-red-500">Select application to start</p>
          </ng-template>
        </div>
      </ng-container>
    </div>
  `,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LetModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideComponentStore(LobbyStore)],
})
export class LobbyPageComponent {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _lobbyStore = inject(LobbyStore);

  readonly selectedWorkspaceControl =
    this._formBuilder.control<Option<string>>(null);
  readonly selectedWorkspace$ = this.selectedWorkspaceControl.valueChanges.pipe(
    startWith(null)
  );
  readonly selectedApplicationControl =
    this._formBuilder.control<Option<string>>(null);
  readonly selectedApplication$ =
    this.selectedApplicationControl.valueChanges.pipe(startWith(null));

  readonly favoriteWorkspaces$ = this._lobbyStore.favoriteWorkspaces$;
  readonly selectedWorkspaceApplications$ = combineLatest([
    this._lobbyStore.applications$,
    this.selectedWorkspace$,
  ]).pipe(
    map(([applications, selectedWorkspace]) => {
      if (applications === null || selectedWorkspace === null) {
        return [];
      }

      return applications.filter(
        ({ workspaceId }) => workspaceId === selectedWorkspace
      );
    })
  );
}
