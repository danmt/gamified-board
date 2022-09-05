import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { EMPTY, switchMap, tap } from 'rxjs';
import { IdlStructField, PluginsService } from '../../plugins';
import { isNull, Option } from '../../shared/utils';
import { WorkspaceApiService } from '../../workspace/services';
import { CollectionDto } from '../services';

interface ViewModel {
  workspaceId: Option<string>;
  collections: Option<CollectionDto[]>;
}

const initialState: ViewModel = {
  workspaceId: null,
  collections: null,
};

@Injectable()
export class CollectionsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _pluginsService = inject(PluginsService);
  private readonly _workspaceApiService = inject(WorkspaceApiService);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly collections$ = this.select(({ collections }) => collections);

  readonly setWorkspaceId = this.updater<Option<string>>(
    (state, workspaceId) => ({
      ...state,
      workspaceId,
    })
  );

  private readonly _loadCollections$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (isNull(workspaceId)) {
        return EMPTY;
      }

      return this._workspaceApiService
        .getWorkspaceCollections(workspaceId)
        .pipe(
          tap((a) => console.log(a)),
          tapResponse(
            (collections) =>
              this.patchState({
                collections: collections.concat(
                  this._pluginsService.plugins.reduce<CollectionDto[]>(
                    (collections, plugin) => [
                      ...collections,
                      ...plugin.accounts.reduce<CollectionDto[]>(
                        (innerCollections, account) => {
                          const fields: IdlStructField[] =
                            typeof account.type === 'string'
                              ? []
                              : 'kind' in account.type
                              ? account.type.fields
                              : [];

                          return [
                            ...innerCollections,
                            {
                              id: `${plugin.namespace}/${plugin.name}/${account.name}`,
                              name: account.name,
                              thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/accounts/${account.name}.png`,
                              applicationId: plugin.name,
                              workspaceId: plugin.namespace,
                              attributes: fields.map((field) => {
                                if (typeof field.type === 'string') {
                                  return {
                                    id: field.name,
                                    name: field.name,
                                    type: field.type,
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                } else if ('option' in field.type) {
                                  return {
                                    id: field.name,
                                    name: field.name,
                                    type: field.type.option,
                                    isOption: true,
                                    isCOption: false,
                                    isDefined: false,
                                  };
                                } else if ('coption' in field.type) {
                                  return {
                                    id: field.name,
                                    name: field.name,
                                    type: field.type.coption,
                                    isOption: false,
                                    isCOption: true,
                                    isDefined: false,
                                  };
                                } else if ('defined' in field.type) {
                                  return {
                                    id: field.name,
                                    name: field.name,
                                    type: field.type.defined,
                                    isOption: false,
                                    isCOption: false,
                                    isDefined: true,
                                  };
                                } else {
                                  return {
                                    id: field.name,
                                    name: field.name,
                                    type: JSON.stringify(field.type),
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
    this._loadCollections$(this.workspaceId$);
  }

  private _handleError(error: unknown) {
    console.log(error);
  }
}
