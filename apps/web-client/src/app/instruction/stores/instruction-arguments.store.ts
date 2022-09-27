import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { isFieldNode, ProgramGraph } from '../../program/utils';
import { isNull, Option } from '../../shared/utils';

interface ViewModel {
  graph: Option<ProgramGraph>;
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

  readonly setGraph = this.updater<Option<ProgramGraph>>((state, graph) => ({
    ...state,
    graph,
  }));

  constructor() {
    super(initialState);
  }
}
