import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { EMPTY, switchMap, tap } from 'rxjs';
import { isNull, Option } from '../../shared/utils';
import { InstructionGraphApiService } from '../services';
import { InstructionGraph, isCollectionNode } from '../utils';

interface CollectionData {
  name: string;
  ref: {
    name: string;
  };
}

interface Collection {
  id: string;
  data: CollectionData;
}

interface ViewModel {
  collections: { [key: string]: Collection };
  graph: Option<InstructionGraph>;
}

const initialState: ViewModel = {
  collections: {},
  graph: null,
};

@Injectable()
export class InstructionCollectionsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _instructionGraphApiService = inject(
    InstructionGraphApiService
  );

  readonly collections$ = this.select(({ collections }) =>
    Object.values(collections)
  );
  readonly graph$ = this.select(({ graph }) => graph);

  readonly setGraph = this.updater<Option<InstructionGraph>>(
    (state, graph) => ({
      ...state,
      graph,
    })
  );

  readonly setCollection = this.updater<Collection>((state, collection) => ({
    ...state,
    collections: {
      ...state.collections,
      [collection.id]: collection,
    },
  }));

  readonly updateCollection = this.updater<{
    id: string;
    changes: Partial<CollectionData>;
  }>((state, { id, changes }) => ({
    ...state,
    collections: {
      ...state.collections,
      [id]: {
        ...state.collections[id],
        ...changes,
      },
    },
  }));

  readonly removeCollection = this.updater<string>((state, collectionId) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [collectionId]: _, ...payload } = state.collections;
    return {
      ...state,
      collections: payload,
    };
  });

  private readonly _loadCollections = this.effect<Option<InstructionGraph>>(
    switchMap((graph) => {
      if (isNull(graph)) {
        return EMPTY;
      }

      this.patchState({
        collections: graph.nodes.filter(isCollectionNode).reduce(
          (collectionsMap, collection) => ({
            ...collectionsMap,
            [collection.id]: collection,
          }),
          {}
        ),
      });

      return this._instructionGraphApiService
        .listen(graph.data.workspaceId, graph.data.applicationId, graph.id, [
          'createNodeSuccess',
          'updateNodeSuccess',
          'deleteNodeSuccess',
        ])
        .pipe(
          tap((event) => {
            switch (event['type']) {
              case 'createNodeSuccess': {
                if (event['payload'].kind === 'collection') {
                  this.setCollection({
                    id: event['payload'].id,
                    data: {
                      name: event['payload'].name,
                      ref: {
                        name: event['payload'].ref.name,
                      },
                    },
                  });
                }

                break;
              }

              case 'updateNodeSuccess': {
                if (event['payload'].kind === 'collection') {
                  this.updateCollection({
                    id: event['payload'].id,
                    changes: {
                      name: event['payload'].changes.name,
                    },
                  });
                }

                break;
              }

              case 'deleteNodeSuccess': {
                if (event['payload'].kind === 'collection') {
                  this.removeCollection(event['payload'].id);
                }

                break;
              }
            }
          })
        );
    })
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._loadCollections(this.graph$);
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
