import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { concatMap, defer, EMPTY, from, switchMap } from 'rxjs';
import { patchGraph, patchNode } from '../../drawer/utils';
import { isNull, Option } from '../../shared/utils';
import { ProgramGraphApiService } from '../services';
import {
  PartialProgramNode,
  ProgramGraph,
  ProgramGraphData,
  ProgramNode,
} from '../utils';

interface ViewModel {
  workspaceId: Option<string>;
  programId: Option<string>;
  graph: Option<ProgramGraph>;
}

const initialState: ViewModel = {
  workspaceId: null,
  programId: null,
  graph: null,
};

@Injectable()
export class ProgramGraphStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _programGraphApiService = inject(ProgramGraphApiService);

  readonly graph$ = this.select(({ graph }) => graph);

  readonly setWorkspaceId = this.updater<Option<string>>(
    (state, workspaceId) => ({
      ...state,
      workspaceId,
    })
  );

  readonly setProgramId = this.updater<Option<string>>((state, programId) => ({
    ...state,
    programId,
  }));

  readonly createNode = this.updater<ProgramNode>((state, node) => {
    return {
      ...state,
      graph: state.graph
        ? {
            ...state.graph,
            nodes: [...state.graph.nodes, node],
          }
        : null,
    };
  });

  readonly updateNode = this.updater<PartialProgramNode>(
    (state, partialNode) => {
      return {
        ...state,
        graph: state.graph
          ? {
              ...state.graph,
              nodes: state.graph.nodes.map((node) =>
                node.id === partialNode.id && node.kind === partialNode.kind
                  ? patchNode(node, partialNode.data)
                  : node
              ),
            }
          : null,
      };
    }
  );

  readonly deleteNode = this.updater<string>((state, nodeId) => {
    return {
      ...state,
      graph: state.graph
        ? {
            ...state.graph,
            nodes: state.graph.nodes.filter((node) => node.id !== nodeId),
          }
        : null,
    };
  });

  readonly updateGraph = this.updater<Partial<ProgramGraphData>>(
    (state, changes) => {
      return {
        ...state,
        graph: state.graph ? patchGraph(state.graph, changes) : null,
      };
    }
  );

  readonly deleteGraph = this.updater((state) => {
    return {
      ...state,
      graph: null,
    };
  });

  private readonly _handleEvents = this.effect<{
    programId: Option<string>;
    workspaceId: Option<string>;
  }>(
    switchMap(({ programId, workspaceId }) => {
      if (isNull(programId) || isNull(workspaceId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._programGraphApiService.getGraph(workspaceId, programId)
        ).pipe(
          tapResponse(
            (graph) => this.patchState({ graph }),
            (error) => this._handleError(error)
          ),
          concatMap((graph) => {
            if (isNull(graph)) {
              return EMPTY;
            }

            return this._programGraphApiService
              .listen(workspaceId, programId, [
                'createNodeSuccess',
                'updateNodeSuccess',
                'deleteNodeSuccess',
              ])
              .pipe(
                tapResponse(
                  (event) => {
                    switch (event['type']) {
                      case 'createNodeSuccess': {
                        if (event['payload'].kind !== 'program') {
                          const { id, kind, ...payload } = event['payload'];

                          this.createNode({
                            id,
                            kind,
                            data: payload,
                          });
                        }

                        break;
                      }

                      case 'updateNodeSuccess': {
                        if (event['payload'].kind === 'program') {
                          this.updateGraph(event['payload'].changes);
                        } else {
                          this.updateNode({
                            id: event['payload'].id,
                            kind: event['payload'].kind,
                            data: event['payload'].changes,
                          });
                        }

                        break;
                      }

                      case 'deleteNodeSuccess': {
                        if (event['payload'].kind === 'program') {
                          this.deleteGraph();
                        } else {
                          this.deleteNode(event['payload'].id);
                        }

                        break;
                      }
                    }
                  },
                  (error) => this._handleError(error)
                )
              );
          })
        )
      );
    })
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._handleEvents(
      this.select(
        this.select(({ workspaceId }) => workspaceId),
        this.select(({ programId }) => programId),
        (workspaceId, programId) => ({ workspaceId, programId })
      )
    );
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
