import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Option } from '../../shared/utils';
import { isAccountNode, isFieldNode, ProgramGraph } from '../utils';

interface ViewModel {
  graph: Option<ProgramGraph>;
}

const initialState: ViewModel = {
  graph: null,
};

@Injectable()
export class AccountsStore extends ComponentStore<ViewModel> {
  readonly accounts$ = this.select(
    ({ graph }) =>
      graph?.nodes.filter(isAccountNode).map((account) => ({
        ...account,
        fields: graph.nodes
          .filter(isFieldNode)
          .filter((node) =>
            graph.edges.some(
              (edge) =>
                edge.data.source === account.id && edge.data.target === node.id
            )
          ),
      })) ?? []
  );

  readonly setGraph = this.updater<Option<ProgramGraph>>((state, graph) => ({
    ...state,
    graph,
  }));

  constructor() {
    super(initialState);
  }
}
