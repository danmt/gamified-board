import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { PluginsService } from '../../plugins';
import { Option } from '../../shared/utils';
import { ApplicationApiService } from '../services';
import { ApplicationDto } from '../utils';

interface ViewModel {
  workspaceId: Option<string>;
  applications: Option<ApplicationDto[]>;
}

const initialState: ViewModel = {
  workspaceId: null,
  applications: null,
};

@Injectable()
export class ApplicationsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _pluginsService = inject(PluginsService);
  private readonly _applicationApiService = inject(ApplicationApiService);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly applications$ = this.select(({ applications }) => applications);

  readonly setWorkspaceId = this.updater<Option<string>>(
    (state, workspaceId) => ({
      ...state,
      workspaceId,
    })
  );

  /* private readonly _loadApplications$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._applicationApiService
        .getWorkspaceApplications(workspaceId)
        .pipe(
          tapResponse(
            (applications) =>
              this.patchState({
                applications: applications.concat(
                  this._pluginsService.plugins.map((plugin) => ({
                    id: plugin.name,
                    name: plugin.name,
                    workspaceId: plugin.namespace,
                    thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/application.png`,
                  }))
                ),
              }),
            (error) => this._handleError(error)
          )
        );
    })
  ); */

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    // this._loadApplications$(this.workspaceId$);
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
