import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { combineLatest, EMPTY, map, of, switchMap } from 'rxjs';
import { ApplicationApiService, ApplicationDto } from '../../application';
import { isNull, Option } from '../../shared';
import { WorkspaceApiService, WorkspaceDto } from '../../workspace';

interface ViewModel {
  userId: Option<string>;
  selectedWorkspaceId: Option<string>;
  selectedApplicationId: Option<string>;
  favoriteWorkspaceIds: Option<string[]>;
  favoriteWorkspaces: (WorkspaceDto & { applications: ApplicationDto[] })[];
}

const initialState: ViewModel = {
  userId: null,
  selectedWorkspaceId: null,
  selectedApplicationId: null,
  favoriteWorkspaceIds: null,
  favoriteWorkspaces: [],
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
  readonly selectedWorkspace$ = this.select(
    this.favoriteWorkspaces$,
    this.select(({ selectedWorkspaceId }) => selectedWorkspaceId),
    (favoriteWorkspaces, selectedWorkspaceId) => {
      if (favoriteWorkspaces.length === 0 || isNull(selectedWorkspaceId)) {
        return null;
      }

      return (
        favoriteWorkspaces.find(
          (workspace) => workspace.id === selectedWorkspaceId
        ) ?? null
      );
    }
  );
  readonly selectedWorkspaceApplications$ = this.select(
    this.selectedWorkspace$,
    (selectedWorkspace) => {
      if (isNull(selectedWorkspace)) {
        return [];
      }

      return selectedWorkspace.applications;
    }
  );

  readonly selectedApplication$ = this.select(
    this.selectedWorkspaceApplications$,
    this.select(({ selectedApplicationId }) => selectedApplicationId),
    (selectedWorkspaceApplications, selectedApplicationId) => {
      if (
        selectedWorkspaceApplications.length === 0 ||
        isNull(selectedApplicationId)
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
      if (isNull(userId)) {
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
      if (isNull(favoriteWorkspaceIds)) {
        return of([]);
      }

      return combineLatest(
        favoriteWorkspaceIds.map((favoriteWorkspaceId) =>
          combineLatest([
            this._workspaceApiService.getWorkspace(favoriteWorkspaceId),
            this._workspaceApiService.getWorkspaceApplications(
              favoriteWorkspaceId
            ),
          ]).pipe(
            map(([workspace, applications]) => ({
              id: workspace.id,
              name: workspace.name,
              applications,
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

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._loadFavoriteWorkspaceIds$(this.select(({ userId }) => userId));
    this._loadFavoriteWorkspaces$(
      this.select(({ favoriteWorkspaceIds }) => favoriteWorkspaceIds)
    );
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
