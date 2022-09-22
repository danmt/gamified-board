import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  limitToLast,
  orderBy,
  query,
  startAfter,
  where,
} from '@angular/fire/firestore';
import { concatMap, defer, filter, from, map } from 'rxjs';
import { GraphApiService } from '../../drawer/services';
import { Graph } from '../../drawer/utils';
import { fromSnapshot } from '../../shared/utils';
import { WorkspaceGraphData, WorkspaceNodeData } from '../utils';

@Injectable({ providedIn: 'root' })
export class WorkspaceGraphApiService extends GraphApiService<WorkspaceGraphData> {
  private readonly _firestore = inject(Firestore);

  constructor() {
    super();
  }

  async getGraph(
    workspaceId: string
  ): Promise<Graph<WorkspaceGraphData, WorkspaceNodeData> | null> {
    const graphRef = doc(this._firestore, `graphs/${workspaceId}`);

    const graph = await getDoc(graphRef);
    const graphData = graph.data();

    if (graphData === undefined) {
      return null;
    }

    const nodesSnapshot = await getDocs(
      collection(this._firestore, `graphs/${workspaceId}/nodes`)
    );

    return {
      id: graph.id,
      nodes: nodesSnapshot.docs.map((node) => {
        const nodeData = node.data();
        return {
          id: node.id,
          data: nodeData['data'],
          kind: nodeData['kind'],
        };
      }),
      edges: [],
      lastEventId: graphData['lastEventId'],
      data: graphData['data'],
      kind: graphData['kind'],
    };
  }

  listen(workspaceId: string, types: string[]) {
    return defer(() =>
      from(getDoc(doc(this._firestore, `graphs/${workspaceId}`))).pipe(
        concatMap((graph) =>
          defer(() =>
            from(
              getDoc(
                doc(this._firestore, `events/${graph.data()?.['lastEventId']}`)
              )
            )
          )
        )
      )
    ).pipe(
      concatMap((lastEvent) =>
        fromSnapshot(
          query(
            collection(this._firestore, 'events'),
            where('referenceIds', 'array-contains', workspaceId),
            where('type', 'in', types),
            orderBy('createdAt', 'asc'),
            startAfter(lastEvent),
            limitToLast(1)
          )
        ).pipe(
          filter(
            (querySnapshot) =>
              !querySnapshot.metadata.hasPendingWrites && !querySnapshot.empty
          ),
          map((querySnapshot) => querySnapshot.docs[0].data())
        )
      )
    );
  }
}
