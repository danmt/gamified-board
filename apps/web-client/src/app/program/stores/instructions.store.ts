import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Option } from '../../shared/utils';
import { isFieldNode, isInstructionNode, ProgramGraph } from '../utils';

interface ViewModel {
  graph: Option<ProgramGraph>;
}

const initialState: ViewModel = {
  graph: null,
};

@Injectable()
export class InstructionsStore extends ComponentStore<ViewModel> {
  readonly instructions$ = this.select(
    ({ graph }) =>
      graph?.nodes.filter(isInstructionNode).map((instruction) => ({
        ...instruction,
        fields: graph.nodes
          .filter(isFieldNode)
          .filter((node) =>
            graph.edges.some(
              (edge) =>
                edge.data.source === instruction.id &&
                edge.data.target === node.id
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
