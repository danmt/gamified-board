import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { defer, EMPTY, from, switchMap } from 'rxjs';
import { ApplicationGraphApiService } from '../../application/services';
import {
  CollectionNode,
  FieldNode,
  isCollectionNode,
  isFieldNode,
} from '../../application/utils';
import { isNull, Option } from '../../shared/utils';

interface ViewModel {
  workspaceId: Option<string>;
  applicationId: Option<string>;
  collections: Option<(CollectionNode & { fields: FieldNode[] })[]>;
}

const initialState: ViewModel = {
  workspaceId: null,
  applicationId: null,
  collections: null,
};

@Injectable()
export class CollectionsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _applicationGraphApiService = inject(
    ApplicationGraphApiService
  );

  readonly collections$ = this.select(({ collections }) => collections);

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

  private readonly _loadCollections = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    switchMap(({ workspaceId, applicationId }) => {
      if (isNull(workspaceId) || isNull(applicationId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._applicationGraphApiService.getGraph(workspaceId, applicationId)
        ).pipe(
          tapResponse(
            (application) => {
              this.patchState({
                collections:
                  application?.nodes
                    .filter(isCollectionNode)
                    .map((collection) => ({
                      ...collection,
                      fields: application.nodes
                        .filter(isFieldNode)
                        .filter((node) =>
                          application.edges.some(
                            (edge) =>
                              edge.data.source === collection.id &&
                              edge.data.target === node.id
                          )
                        ),
                    })) ?? [],
              });
            },
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
    this._loadCollections(
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
