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
  userId: Option<string>;
  selectedWorkspaceId: Option<string>;
  selectedApplicationId: Option<string>;
  favoriteWorkspaceIds: Option<string[]>;
  favoriteWorkspaces: (WorkspaceDto & { applicationIds: string[] })[];
  applications: ApplicationDto[];
}

const initialState: ViewModel = {
  userId: null,
  selectedWorkspaceId: null,
  selectedApplicationId: null,
  favoriteWorkspaceIds: null,
  favoriteWorkspaces: [],
  applications: [],
};

@Injectable()
export class LobbyStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _workspaceApiService = inject(WorkspaceApiService);
  private readonly _applicationApiService = inject(ApplicationApiService);

  readonly favoriteWorkspaces$ = this.select(
    ({ favoriteWorkspaces }) => favoriteWorkspaces
  );
  readonly applications$ = this.select(({ applications }) => applications);
  readonly selectedWorkspaceApplications$ = this.select(
    this.applications$,
    this.select(({ selectedWorkspaceId }) => selectedWorkspaceId),
    (applications, selectedWorkspace) => {
      if (applications === null || selectedWorkspace === null) {
        return [];
      }

      return applications.filter(
        ({ workspaceId }) => workspaceId === selectedWorkspace
      );
    }
  );
  readonly selectedWorkspace$ = this.select(
    this.favoriteWorkspaces$,
    this.select(({ selectedWorkspaceId }) => selectedWorkspaceId),
    (favoriteWorkspaces, selectedWorkspaceId) => {
      if (favoriteWorkspaces.length === 0 || selectedWorkspaceId === null) {
        return null;
      }

      return (
        favoriteWorkspaces.find(
          (workspace) => workspace.id === selectedWorkspaceId
        ) ?? null
      );
    }
  );
  readonly selectedApplication$ = this.select(
    this.selectedWorkspaceApplications$,
    this.select(({ selectedApplicationId }) => selectedApplicationId),
    (selectedWorkspaceApplications, selectedApplicationId) => {
      if (
        selectedWorkspaceApplications.length === 0 ||
        selectedApplicationId === null
      ) {
        return null;
      }

      return (
        selectedWorkspaceApplications.find(
          (application) => application.id === selectedApplicationId
        ) ?? null
      );
    }
  );

  readonly setUserId = this.updater<Option<string>>((state, userId) => ({
    ...state,
    userId,
  }));

  readonly setSelectedWorkspaceId = this.updater<Option<string>>(
    (state, selectedWorkspaceId) => ({
      ...state,
      selectedWorkspaceId,
    })
  );

  readonly setSelectedApplicationId = this.updater<Option<string>>(
    (state, selectedApplicationId) => ({
      ...state,
      selectedApplicationId,
    })
  );

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
    this._loadFavoriteWorkspaceIds$(this.select(({ userId }) => userId));
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
