import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { PluginsService } from '../../plugins';
import { Option } from '../../shared/utils';
import { InstructionApiService } from '../services';
import { InstructionDto } from '../utils';

interface ViewModel {
  workspaceId: Option<string>;
  instructions: Option<InstructionDto[]>;
}

const initialState: ViewModel = {
  workspaceId: null,
  instructions: null,
};

@Injectable()
export class InstructionsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _pluginsService = inject(PluginsService);
  private readonly _instructionApiService = inject(InstructionApiService);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly instructions$ = this.select(({ instructions }) => instructions);

  readonly setWorkspaceId = this.updater<Option<string>>(
    (state, workspaceId) => ({
      ...state,
      workspaceId,
    })
  );

  /* private readonly _loadInstructions$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._instructionApiService
        .getWorkspaceInstructions(workspaceId)
        .pipe(
          tapResponse(
            (instructions) =>
              this.patchState({
                instructions: instructions.concat(
                  this._pluginsService.plugins.map((plugin) => ({
                    id: plugin.name,
                    name: plugin.name,
                    workspaceId: plugin.namespace,
                    thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/instruction.png`,
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
    // this._loadInstructions$(this.workspaceId$);
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
