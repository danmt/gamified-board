import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LetModule } from '@ngrx/component';
import { combineLatest, map, startWith } from 'rxjs';
import { WorkspaceApiService } from '../services';
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
})
export class LobbyPageComponent {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _workspaceApiService = inject(WorkspaceApiService);

  readonly selectedWorkspaceControl =
    this._formBuilder.control<Option<string>>(null);
  readonly selectedWorkspace$ = this.selectedWorkspaceControl.valueChanges.pipe(
    startWith(null)
  );
  readonly selectedApplicationControl =
    this._formBuilder.control<Option<string>>(null);
  readonly selectedApplication$ =
    this.selectedApplicationControl.valueChanges.pipe(startWith(null));

  readonly favoriteWorkspaces$ =
    this._workspaceApiService.getFavoriteWorkspaces('p7xARjRPxv8cvbBOR59C');
  readonly selectedWorkspaceApplications$ = combineLatest([
    this.favoriteWorkspaces$,
    this.selectedWorkspace$,
  ]).pipe(
    map(([favoriteWorkspaces, selectedWorkspace]) => {
      if (selectedWorkspace === null) {
        return [];
      }

      const workspace =
        favoriteWorkspaces.find(({ id }) => id === selectedWorkspace) ?? null;

      if (workspace === null) {
        return [];
      }

      return workspace.applications;
    })
  );
}
