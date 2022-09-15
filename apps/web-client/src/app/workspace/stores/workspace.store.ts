import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { EMPTY, switchMap } from 'rxjs';
import { isNull, Option } from '../../shared/utils';
import { WorkspaceApiService } from '../services';
import { WorkspaceDto } from '../utils';

interface ViewModel {
  workspaceId: Option<string>;
  workspace: Option<WorkspaceDto>;
}

const initialState: ViewModel = {
  workspaceId: null,
  workspace: null,
};

@Injectable()
export class WorkspaceStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _workspaceApiService = inject(WorkspaceApiService);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly workspace$ = this.select(({ workspace }) => workspace);

  readonly setWorkspaceId = this.updater<Option<string>>(
    (state, workspaceId) => ({
      ...state,
      workspaceId,
    })
  );

  private readonly _loadWorkspace$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._workspaceApiService.getWorkspace(workspaceId).pipe(
        tapResponse(
          (workspace) => this.patchState({ workspace }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._loadWorkspace$(this.workspaceId$);
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
