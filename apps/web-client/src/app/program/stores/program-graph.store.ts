import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { concatMap, defer, EMPTY, from, switchMap } from 'rxjs';
import { patchNode } from '../../drawer/utils';
import { isNull, Option } from '../../shared/utils';
import { ProgramGraphApiService } from '../services';
import { PartialProgramNode, ProgramGraph } from '../utils';

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
                    console.log(event, {
                      id: event['payload'].id,
                      kind: event['payload'].kind,
                      data: event['payload'].changes,
                    });

                    this.updateNode({
                      id: event['payload'].id,
                      kind: event['payload'].kind,
                      data: event['payload'].changes,
                    });
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
