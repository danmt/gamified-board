import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { ApplicationGraph, isFieldNode } from '../../application/utils';
import { isNull, Option } from '../../shared/utils';

interface ViewModel {
  graph: Option<ApplicationGraph>;
  instructionId: Option<string>;
}

const initialState: ViewModel = {
  graph: null,
  instructionId: null,
};

@Injectable()
export class InstructionArgumentsStore extends ComponentStore<ViewModel> {
  readonly instructionArguments$ = this.select(({ graph, instructionId }) => {
    if (isNull(graph) || isNull(instructionId)) {
      return [];
    }

    return graph.nodes
      .filter(isFieldNode)
      .filter((fieldNode) =>
        graph.edges.some(
          (edge) =>
            edge.data.source === instructionId &&
            edge.data.target === fieldNode.id
        )
      );
  });

  readonly setInstructionId = this.updater<Option<string>>(
    (state, instructionId) => ({
      ...state,
      instructionId,
    })
  );

  readonly setGraph = this.updater<Option<ApplicationGraph>>(
    (state, graph) => ({
      ...state,
      graph,
    })
  );

  constructor() {
    super(initialState);
  }
}
