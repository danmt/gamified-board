import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { EMPTY, switchMap } from 'rxjs';
import { PluginsService } from '../../plugins';
import { isNull, Option } from '../../shared/utils';
import { WorkspaceApiService } from '../../workspace/services';
import { InstructionDto } from '../services';

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
  private readonly _workspaceApiService = inject(WorkspaceApiService);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly instructions$ = this.select(({ instructions }) => instructions);

  readonly setWorkspaceId = this.updater<Option<string>>(
    (state, workspaceId) => ({
      ...state,
      workspaceId,
    })
  );

  private readonly _loadInstructions$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._workspaceApiService
        .getWorkspaceInstructions(workspaceId)
        .pipe(
          tapResponse(
            (instructions) =>
              this.patchState({
                instructions: instructions.concat(
                  this._pluginsService.plugins.reduce<InstructionDto[]>(
                    (pluginsInstructions, plugin) => [
                      ...pluginsInstructions,
                      ...plugin.instructions.reduce<InstructionDto[]>(
                        (pluginInstructions, instruction) => {
                          const args = instruction.args;

                          return [
                            ...pluginInstructions,
                            {
                              id: `${plugin.namespace}/${plugin.name}/${instruction.name}`,
                              name: instruction.name,
                              thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/instructions/${instruction.name}.png`,
                              applicationId: plugin.name,
                              workspaceId: plugin.namespace,
                              documents: [],
                              tasks: [],
                              applications: [],
                              sysvars: [],
                              signers: [],
                              arguments: args.map((arg) => {
                                if (typeof arg.type === 'string') {
                                  return {
                                    id: `${instruction.name}/${arg.name}`,
                                    name: arg.name,
                                    type: arg.type,
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                } else if ('option' in arg.type) {
                                  return {
                                    id: `${instruction.name}/${arg.name}`,
                                    name: arg.name,
                                    type: arg.type.option,
                                    isOption: true,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                } else if ('coption' in arg.type) {
                                  return {
                                    id: `${instruction.name}/${arg.name}`,
                                    name: arg.name,
                                    type: arg.type.coption,
                                    isOption: false,
                                    isCOption: true,
                                    isDefined: false,
                                  };
                                } else if ('defined' in arg.type) {
                                  return {
                                    id: `${instruction.name}/${arg.name}`,
                                    name: arg.name,
                                    type: arg.type.defined,
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: true,
                                  };
                                } else {
                                  return {
                                    id: `${instruction.name}/${arg.name}`,
                                    name: arg.name,
                                    type: JSON.stringify(arg.type),
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                }
                              }),
                            },
                          ];
                        },
                        []
                      ),
                    ],
                    []
                  )
                ),
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
    this._loadInstructions$(this.workspaceId$);
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
