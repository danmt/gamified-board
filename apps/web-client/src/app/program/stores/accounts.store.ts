import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { defer, EMPTY, from, switchMap } from 'rxjs';
import { isNull, Option } from '../../shared/utils';
import { ProgramGraphApiService } from '../services';
import { AccountNode, FieldNode, isAccountNode, isFieldNode } from '../utils';

interface ViewModel {
  workspaceId: Option<string>;
  programId: Option<string>;
  accounts: (AccountNode & { fields: FieldNode[] })[];
}

const initialState: ViewModel = {
  workspaceId: null,
  programId: null,
  accounts: [],
};

@Injectable()
export class AccountsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _programGraphApiService = inject(ProgramGraphApiService);

  readonly accounts$ = this.select(({ accounts }) => accounts);

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

  private readonly _loadAccounts = this.effect<{
    workspaceId: Option<string>;
    programId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._programGraphApiService.getGraph(workspaceId, programId)
        ).pipe(
          tapResponse(
            (program) => {
              this.patchState({
                accounts:
                  program?.nodes.filter(isAccountNode).map((account) => ({
                    ...account,
                    fields: program.nodes
                      .filter(isFieldNode)
                      .filter((node) =>
                        program.edges.some(
                          (edge) =>
                            edge.data.source === account.id &&
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
    this._loadAccounts(
      this.select(
        this.select(({ workspaceId }) => workspaceId),
        this.select(({ programId }) => programId),
        (workspaceId, programId) => ({
          workspaceId,
          programId,
        })
      )
    );
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
