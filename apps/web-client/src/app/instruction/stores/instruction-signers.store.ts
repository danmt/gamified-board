import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { EMPTY, switchMap, tap } from 'rxjs';
import { isNull, Option } from '../../shared/utils';
import { InstructionGraphApiService } from '../services';
import {
  InstructionGraph,
  isSignerNode,
  SignerNode,
  SignerNodeData,
} from '../utils';

interface ViewModel {
  signers: { [key: string]: SignerNode };
  graph: Option<InstructionGraph>;
}

const initialState: ViewModel = {
  signers: {},
  graph: null,
};

@Injectable()
export class InstructionSignersStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _instructionGraphApiService = inject(
    InstructionGraphApiService
  );

  readonly signers$ = this.select(({ signers }) => Object.values(signers));
  readonly graph$ = this.select(({ graph }) => graph);

  readonly setGraph = this.updater<Option<InstructionGraph>>(
    (state, graph) => ({
      ...state,
      graph,
    })
  );

  readonly setSigner = this.updater<SignerNode>((state, signer) => ({
    ...state,
    signers: {
      ...state.signers,
      [signer.id]: signer,
    },
  }));

  readonly updateSigner = this.updater<{
    id: string;
    changes: Partial<SignerNodeData>;
  }>((state, { id, changes }) => ({
    ...state,
    signers: {
      ...state.signers,
      [id]: {
        ...state.signers[id],
        ...changes,
      },
    },
  }));

  readonly removeSigner = this.updater<string>((state, signerId) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [signerId]: _, ...payload } = state.signers;
    return {
      ...state,
      signers: payload,
    };
  });

  private readonly _loadSigners = this.effect<Option<InstructionGraph>>(
    switchMap((graph) => {
      if (isNull(graph)) {
        return EMPTY;
      }

      this.patchState({
        signers: graph.nodes.filter(isSignerNode).reduce(
          (signersMap, signer) => ({
            ...signersMap,
            [signer.id]: signer,
          }),
          {}
        ),
      });

      return this._instructionGraphApiService
        .listen(graph.data.workspaceId, graph.data.programId, graph.id, [
          'createNodeSuccess',
          'updateNodeSuccess',
          'deleteNodeSuccess',
        ])
        .pipe(
          tap((event) => {
            switch (event['type']) {
              case 'createNodeSuccess': {
                if (event['payload'].kind === 'signer') {
                  const { id, kind, ...payload } = event['payload'];
                  this.setSigner({
                    id,
                    kind,
                    data: payload,
                  });
                }

                break;
              }

              case 'updateNodeSuccess': {
                if (event['payload'].kind === 'signer') {
                  this.updateSigner({
                    id: event['payload'].id,
                    changes: {
                      name: event['payload'].changes.name,
                    },
                  });
                }

                break;
              }

              case 'deleteNodeSuccess': {
                if (event['payload'].kind === 'signer') {
                  this.removeSigner(event['payload'].id);
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
    this._loadSigners(this.graph$);
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
