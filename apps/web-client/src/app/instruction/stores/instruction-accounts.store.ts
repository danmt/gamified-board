import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { EMPTY, switchMap, tap } from 'rxjs';
import { isNull, Option } from '../../shared/utils';
import { InstructionGraphApiService } from '../services';
import { InstructionGraph, isAccountNode } from '../utils';

interface AccountData {
  name: string;
  ref: {
    id: string;
    name: string;
  };
}

interface Account {
  id: string;
  data: AccountData;
}

interface ViewModel {
  accounts: { [key: string]: Account };
  graph: Option<InstructionGraph>;
}

const initialState: ViewModel = {
  accounts: {},
  graph: null,
};

@Injectable()
export class InstructionAccountsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _instructionGraphApiService = inject(
    InstructionGraphApiService
  );

  readonly accounts$ = this.select(({ accounts }) => Object.values(accounts));
  readonly graph$ = this.select(({ graph }) => graph);

  readonly setGraph = this.updater<Option<InstructionGraph>>(
    (state, graph) => ({
      ...state,
      graph,
    })
  );

  readonly setAccount = this.updater<Account>((state, account) => ({
    ...state,
    accounts: {
      ...state.accounts,
      [account.id]: account,
    },
  }));

  readonly updateAccount = this.updater<{
    id: string;
    changes: Partial<AccountData>;
  }>((state, { id, changes }) => ({
    ...state,
    accounts: {
      ...state.accounts,
      [id]: {
        ...state.accounts[id],
        ...changes,
      },
    },
  }));

  readonly removeAccount = this.updater<string>((state, accountId) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [accountId]: _, ...payload } = state.accounts;
    return {
      ...state,
      accounts: payload,
    };
  });

  private readonly _loadAccounts = this.effect<Option<InstructionGraph>>(
    switchMap((graph) => {
      if (isNull(graph)) {
        return EMPTY;
      }

      this.patchState({
        accounts: graph.nodes.filter(isAccountNode).reduce(
          (accountsMap, account) => ({
            ...accountsMap,
            [account.id]: account,
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
                if (event['payload'].kind === 'account') {
                  this.setAccount({
                    id: event['payload'].id,
                    data: {
                      name: event['payload'].name,
                      ref: {
                        id: event['payload'].ref.id,
                        name: event['payload'].ref.name,
                      },
                    },
                  });
                }

                break;
              }

              case 'updateNodeSuccess': {
                if (event['payload'].kind === 'account') {
                  this.updateAccount({
                    id: event['payload'].id,
                    changes: {
                      name: event['payload'].changes.name,
                    },
                  });
                }

                break;
              }

              case 'deleteNodeSuccess': {
                if (event['payload'].kind === 'account') {
                  this.removeAccount(event['payload'].id);
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
    this._loadAccounts(this.graph$);
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
