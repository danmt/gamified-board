import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { of, switchMap } from 'rxjs';
import { isNull, Option } from '../../shared/utils';
import { WorkspaceApiService } from '../../workspace/services';
import { WorkspaceDto } from '../../workspace/utils';

interface ViewModel {
  userId: Option<string>;
  workspaces: WorkspaceDto[];
}

const initialState: ViewModel = {
  userId: null,
  workspaces: [],
};

@Injectable()
export class LobbyStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _workspaceApiService = inject(WorkspaceApiService);

  readonly workspaces$ = this.select(({ workspaces }) => workspaces);

  readonly setUserId = this.updater<Option<string>>((state, userId) => ({
    ...state,
    userId,
  }));

  private readonly _loadUserWorkspaces$ = this.effect<Option<string>>(
    switchMap((userId) => {
      if (isNull(userId)) {
        return of([]);
      }

      return this._workspaceApiService.getWorkspacesByOwner(userId).pipe(
        tapResponse(
          (workspaces) =>
            this.patchState({
              workspaces: workspaces.map((workspace) => ({
                ...workspace,
                applications: [],
              })),
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
    this._loadUserWorkspaces$(this.select(({ userId }) => userId));
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
