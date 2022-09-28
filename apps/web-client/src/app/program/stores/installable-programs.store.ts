import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { defer, from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isNull, Option } from '../../shared/utils';
import { ProgramApiService } from '../services';
import { InstallableProgram } from '../utils';

interface ViewModel {
  programs: Option<InstallableProgram[]>;
}

const initialState: ViewModel = {
  programs: null,
};

@Injectable()
export class InstallableProgramsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _programApiService = inject(ProgramApiService);

  readonly programs$ = this.select(({ programs }) => programs);

  private readonly _loadPrograms = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return [];
      }

      return this._programApiService.getWorkspacePrograms(workspaceId).pipe(
        switchMap((programs) =>
          defer(() =>
            from(
              Promise.all(
                programs.map((program) =>
                  this._programApiService
                    .getProgramLastCheckpoint(workspaceId, program.id)
                    .then((checkpoints) => ({
                      ...program,
                      checkpoints,
                    }))
                )
              )
            )
          ).pipe(
            tapResponse(
              (programs) => this.patchState({ programs }),
              (error) => this._handleError(error)
            )
          )
        )
      );
    })
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._loadPrograms(environment.installableAppsWorkspace);
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
