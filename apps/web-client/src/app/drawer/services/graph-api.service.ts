import { inject, Injectable } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { Graph, GraphDataType, NodeDataType } from '../utils';

@Injectable({ providedIn: 'root' })
export class GraphApiService {
  private readonly _firestore = inject(Firestore);

  async getGraph<T extends GraphDataType, U extends NodeDataType>(
    graphId: string
  ): Promise<Graph<T, U> | null> {
    const graphRef = doc(this._firestore, `graphs/${graphId}`);

    const graph = await getDoc(graphRef);
    const graphData = graph.data();

    if (graphData === undefined) {
      return null;
    }

    return {
      id: graph.id,
      nodes: graphData['nodes'],
      edges: graphData['edges'],
      lastEventId: graphData['lastEventId'],
      data: graphData['data'],
    };
  }
}
