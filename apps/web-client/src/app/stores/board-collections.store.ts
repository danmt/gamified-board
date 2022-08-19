import { inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { PluginsService } from '../plugins';
import { DocumentCollection } from '../services';
import { Option } from '../utils';
import { BoardStore } from './board.store';

interface ViewModel {
  selectedCollectionId: Option<string>;
}

const initialState: ViewModel = {
  selectedCollectionId: null,
};

@Injectable()
export class BoardCollectionsStore extends ComponentStore<ViewModel> {
  private readonly _pluginsService = inject(PluginsService);
  private readonly _boardStore = inject(BoardStore);

  readonly selectedCollectionId$ = this.select(
    ({ selectedCollectionId }) => selectedCollectionId
  );
  readonly selectedCollection$: Observable<Option<DocumentCollection>> =
    this.select(
      this._boardStore.workspaceCollections$,
      this.selectedCollectionId$,
      (workspaceCollections, selectedCollectionId) => {
        if (workspaceCollections === null || selectedCollectionId === null) {
          return null;
        }

        const collection =
          workspaceCollections?.find(
            (collection) => collection.id === selectedCollectionId
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
            account: null,
          };
        }

        const [namespace, pluginName, accountName] =
          selectedCollectionId.split('/');

        const plugin =
          this._pluginsService.plugins.find(
            (plugin) =>
              plugin.namespace === namespace && plugin.name === pluginName
          ) ?? null;

        if (plugin === null) {
          return null;
        }

        const pluginAccount =
          plugin?.accounts.find((account) => account.name === accountName) ??
          null;

        if (pluginAccount === null) {
          return null;
        }

        return {
          id: selectedCollectionId,
          name: pluginAccount.name,
          thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/accounts/${pluginAccount.name}.png`,
          applicationId: null,
          workspaceId: null,
          isInternal: false,
          namespace,
          plugin: pluginName,
          account: accountName,
        };
      }
    );

  readonly setSelectedCollectionId = this.updater<Option<string>>(
    (state, selectedCollectionId) => ({
      ...state,
      selectedCollectionId,
    })
  );

  constructor() {
    super(initialState);
  }
}
