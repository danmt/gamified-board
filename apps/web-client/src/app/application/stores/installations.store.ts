import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { defer, EMPTY, from, switchMap } from 'rxjs';
import { ApplicationApiService } from '../../application/services';
import {
  CollectionNode,
  FieldNode,
  Installation,
  isCollectionNode,
  isFieldNode,
} from '../../application/utils';
import { isNull, Option } from '../../shared/utils';

interface ViewModel {
  workspaceId: Option<string>;
  applicationId: Option<string>;
  installations: Option<Installation[]>;
}

const initialState: ViewModel = {
  workspaceId: null,
  applicationId: null,
  installations: null,
};

@Injectable()
export class InstallationsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _applicationApiService = inject(ApplicationApiService);

  readonly installations$ = this.select(({ installations }) => installations);

  readonly collections$ = this.select(this.installations$, (installations) => {
    if (isNull(installations)) {
      return [];
    }

    return (
      installations.reduce<(CollectionNode & { fields: FieldNode[] })[]>(
        (collections, installation) =>
          collections.concat(
            installation.data.nodes
              .filter(isCollectionNode)
              .map((collection) => ({
                ...collection,
                fields: installation.data.nodes
                  .filter(isFieldNode)
                  .filter((node) =>
                    installation.data.edges.some(
                      (edge) =>
                        edge.data.source === collection.id &&
                        edge.data.target === node.id
                    )
                  ),
              })) ?? []
          ),
        []
      ) ?? []
    );
  });

  readonly setWorkspaceId = this.updater<Option<string>>(
    (state, workspaceId) => ({
      ...state,
      workspaceId,
    })
  );

  readonly setApplicationId = this.updater<Option<string>>(
    (state, applicationId) => ({
      ...state,
      applicationId,
    })
  );

  private readonly _loadInstallations = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._applicationApiService.getApplicationInstallations(
            workspaceId,
            applicationId
          )
        ).pipe(
          tapResponse(
            (installations) => this.patchState({ installations }),
            (error) => this._handleError(error)
          )
        )
      );
    })
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._loadInstallations(
      this.select(
        this.select(({ workspaceId }) => workspaceId),
        this.select(({ applicationId }) => applicationId),
        (workspaceId, applicationId) => ({
          workspaceId,
          applicationId,
        })
      )
    );
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
