import { inject, Injectable } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { Graph } from '../utils';

@Injectable({ providedIn: 'root' })
export class GraphApiService {
  private readonly _firestore = inject(Firestore);

  async getGraph(graphId: string): Promise<Graph | null> {
    const graphRef = doc(this._firestore, `graphs/${graphId}`);

    const graph = await getDoc(graphRef);
    const graphData = graph.data();

    if (graphData === undefined) {
      return null;
    }

    return {
      id: graph.id,
      name: graphData['name'],
      kind: graphData['kind'],
      thumbnailUrl: graphData['thumbnailUrl'],
      nodes: graphData['nodes'],
      edges: graphData['edges'],
      lastEventId: graphData['lastEventId'],
    };
  }
}
