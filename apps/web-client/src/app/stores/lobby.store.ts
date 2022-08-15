import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { combineLatest, EMPTY, map, of, switchMap } from 'rxjs';
import {
  ApplicationApiService,
  ApplicationDto,
  WorkspaceApiService,
  WorkspaceDto,
} from '../services';
import { Option } from '../utils';

interface ViewModel {
  favoriteWorkspaceIds: Option<string[]>;
  favoriteWorkspaces: Option<(WorkspaceDto & { applicationIds: string[] })[]>;
  applications: Option<ApplicationDto[]>;
}

const initialState: ViewModel = {
  favoriteWorkspaceIds: null,
  favoriteWorkspaces: null,
  applications: null,
};

@Injectable()
export class LobbyStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _workspaceApiService = inject(WorkspaceApiService);
  private readonly _applicationApiService = inject(ApplicationApiService);

  readonly favoriteWorkspaceIds$ = this.select(
    ({ favoriteWorkspaceIds }) => favoriteWorkspaceIds
  );
  readonly favoriteWorkspaces$ = this.select(
    ({ favoriteWorkspaces }) => favoriteWorkspaces
  );
  readonly applications$ = this.select(({ applications }) => applications);

  private readonly _loadFavoriteWorkspaceIds$ = this.effect<Option<string>>(
    switchMap((userId) => {
      if (userId === null) {
        return EMPTY;
      }

      return this._workspaceApiService.getFavoriteWorkspaceIds(userId).pipe(
        tapResponse(
          (favoriteWorkspaceIds) =>
            this.patchState({
              favoriteWorkspaceIds,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadFavoriteWorkspaces$ = this.effect<Option<string[]>>(
    switchMap((favoriteWorkspaceIds) => {
      if (favoriteWorkspaceIds === null) {
        return of([]);
      }

      return combineLatest(
        favoriteWorkspaceIds.map((favoriteWorkspaceId) =>
          combineLatest([
            this._workspaceApiService.getWorkspace(favoriteWorkspaceId),
            this._workspaceApiService.getWorkspaceApplicationIds(
              favoriteWorkspaceId
            ),
          ]).pipe(
            map(([workspace, applicationIds]) => ({
              id: workspace.id,
              name: workspace.name,
              applicationIds,
            }))
          )
        )
      ).pipe(
        tapResponse(
          (favoriteWorkspaces) =>
            this.patchState({
              favoriteWorkspaces,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadApplications$ = this.effect<Option<string[]>>(
    switchMap((applicationIds) => {
      if (applicationIds === null) {
        return of([]);
      }

      return combineLatest(
        applicationIds.map((applicationId) =>
          this._applicationApiService.getApplication(applicationId)
        )
      ).pipe(
        tapResponse(
          (applications) =>
            this.patchState({
              applications,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._loadFavoriteWorkspaceIds$('p7xARjRPxv8cvbBOR59C');
    this._loadFavoriteWorkspaces$(
      this.select(({ favoriteWorkspaceIds }) => favoriteWorkspaceIds)
    );
    this._loadApplications$(
      this.select(this.favoriteWorkspaces$, (favoriteWorkspaces) => {
        if (favoriteWorkspaces === null) {
          return [];
        }

        return favoriteWorkspaces.reduce<string[]>(
          (applicationIds, favoriteWorkspace) => {
            return [
              ...new Set([
                ...applicationIds,
                ...favoriteWorkspace.applicationIds,
              ]),
            ];
          },
          []
        );
      })
    );
  }

  private _handleError(error: unknown) {
    console.log(error);
  }
}
