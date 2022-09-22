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
import { ApplicationGraphData, ApplicationNodeData } from '../utils';

@Injectable({ providedIn: 'root' })
export class ApplicationGraphApiService extends GraphApiService<ApplicationGraphData> {
  private readonly _firestore = inject(Firestore);

  constructor() {
    super();
  }

  async getGraph(
    workspaceId: string,
    applicationId: string
  ): Promise<Graph<ApplicationGraphData, ApplicationNodeData> | null> {
    const graphRef = doc(
      this._firestore,
      `graphs/${workspaceId}/nodes/${applicationId}`
    );

    const graph = await getDoc(graphRef);
    const graphData = graph.data();

    if (graphData === undefined) {
      return null;
    }

    const nodesSnapshot = await getDocs(
      collection(
        this._firestore,
        `graphs/${workspaceId}/nodes/${applicationId}/nodes`
      )
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

  listen(workspaceId: string, applicationId: string, types: string[]) {
    return defer(() =>
      from(
        getDoc(
          doc(this._firestore, `graphs/${workspaceId}/nodes/${applicationId}`)
        )
      ).pipe(
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
            where('referenceIds', 'array-contains', applicationId),
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
