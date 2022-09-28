import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { defer, EMPTY, from, switchMap } from 'rxjs';
import { isNull, Option } from '../../shared/utils';
import { ProgramApiService } from '../services';
import {
  AccountNode,
  FieldNode,
  Installation,
  InstructionNode,
  isAccountNode,
  isFieldNode,
  isInstructionNode,
} from '../utils';

interface ViewModel {
  workspaceId: Option<string>;
  programId: Option<string>;
  installations: Option<Installation[]>;
}

const initialState: ViewModel = {
  workspaceId: null,
  programId: null,
  installations: null,
};

@Injectable()
export class InstallationsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _programApiService = inject(ProgramApiService);

  readonly installations$ = this.select(({ installations }) => installations);

  readonly accounts$ = this.select(this.installations$, (installations) => {
    if (isNull(installations)) {
      return [];
    }

    return (
      installations.reduce<(AccountNode & { fields: FieldNode[] })[]>(
        (accounts, installation) =>
          accounts.concat(
            installation.data.nodes.filter(isAccountNode).map((account) => ({
              ...account,
              fields: installation.data.nodes
                .filter(isFieldNode)
                .filter((node) =>
                  installation.data.edges.some(
                    (edge) =>
                      edge.data.source === account.id &&
                      edge.data.target === node.id
                  )
                ),
            })) ?? []
          ),
        []
      ) ?? []
    );
  });

  readonly instructions$ = this.select(this.installations$, (installations) => {
    if (isNull(installations)) {
      return [];
    }

    return (
      installations.reduce<(InstructionNode & { fields: FieldNode[] })[]>(
        (instructions, installation) =>
          instructions.concat(
            installation.data.nodes
              .filter(isInstructionNode)
              .map((instruction) => ({
                ...instruction,
                fields: installation.data.nodes
                  .filter(isFieldNode)
                  .filter((node) =>
                    installation.data.edges.some(
                      (edge) =>
                        edge.data.source === instruction.id &&
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

  readonly setProgramId = this.updater<Option<string>>((state, programId) => ({
    ...state,
    programId,
  }));

  private readonly _loadInstallations = this.effect<{
    workspaceId: Option<string>;
    programId: Option<string>;
  }>(
    switchMap(({ workspaceId, programId }) => {
      if (isNull(workspaceId) || isNull(programId)) {
        return EMPTY;
      }

      return defer(() =>
        from(
          this._programApiService.getProgramInstallations(
            workspaceId,
            programId
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
