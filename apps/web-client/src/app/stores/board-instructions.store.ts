import { inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { PluginsService } from '../plugins';
import { TaskInstruction } from '../services';
import { Option } from '../utils';
import { BoardStore } from './board.store';

interface ViewModel {
  selectedInstructionId: Option<string>;
}

const initialState: ViewModel = {
  selectedInstructionId: null,
};

@Injectable()
export class BoardInstructionsStore extends ComponentStore<ViewModel> {
  private readonly _pluginsService = inject(PluginsService);
  private readonly _boardStore = inject(BoardStore);

  readonly selectedInstructionId$ = this.select(
    ({ selectedInstructionId }) => selectedInstructionId
  );
  readonly selectedInstruction$: Observable<Option<TaskInstruction>> =
    this.select(
      this._boardStore.workspaceInstructions$,
      this.selectedInstructionId$,
      (workspaceInstructions, selectedInstructionId) => {
        if (workspaceInstructions === null || selectedInstructionId === null) {
          return null;
        }

        const collection =
          workspaceInstructions?.find(
            (collection) => collection.id === selectedInstructionId
          ) ?? null;

        if (collection !== null) {
          return {
            id: collection.id,
            name: collection.name,
            thumbnailUrl: collection.thumbnailUrl,
            applicationId: collection.applicationId,
            workspaceId: collection.workspaceId,
            isInternal: true,
            namespace: null,
            plugin: null,
            instruction: null,
          };
        }

        const [namespace, pluginName, instructionName] =
          selectedInstructionId.split('/');

        const plugin =
          this._pluginsService.plugins.find(
            (plugin) =>
              plugin.namespace === namespace && plugin.name === pluginName
          ) ?? null;

        if (plugin === null) {
          return null;
        }

        const pluginAccount =
          plugin?.instructions.find(
            (instruction) => instruction.name === instructionName
          ) ?? null;

        if (pluginAccount === null) {
          return null;
        }

        return {
          id: selectedInstructionId,
          name: pluginAccount.name,
          thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/instructions/${pluginAccount.name}.png`,
          applicationId: null,
          workspaceId: null,
          isInternal: false,
          namespace,
          plugin: pluginName,
          instruction: instructionName,
        };
      }
    );

  readonly setSelectedInstructionId = this.updater<Option<string>>(
    (state, selectedInstructionId) => ({
      ...state,
      selectedInstructionId,
    })
  );

  constructor() {
    super(initialState);
  }
}
