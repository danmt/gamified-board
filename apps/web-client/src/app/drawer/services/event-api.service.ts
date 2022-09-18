import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  DocumentData,
  Firestore,
  getDoc,
  limitToLast,
  onSnapshot,
  orderBy,
  Query,
  query,
  QuerySnapshot,
  startAfter,
  where,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { concatMap, defer, filter, from, map, Observable } from 'rxjs';
import { EventDto } from '../utils';

const fromSnapshot = (query: Query<DocumentData>) => {
  return new Observable<QuerySnapshot<DocumentData>>((subscriber) => {
    return onSnapshot(
      query,
      (querySnapshot) => subscriber.next(querySnapshot),
      (error) => subscriber.error(error),
      () => subscriber.complete()
    );
  });
};

@Injectable({ providedIn: 'root' })
export class EventApiService {
  private readonly _functions = inject(Functions);
  private readonly _firestore = inject(Firestore);

  emit(clientId: string, { type, payload, graphIds = [] }: EventDto) {
    const publishEvent = httpsCallable(this._functions, 'publishEvent');

    return defer(() =>
      from(publishEvent({ type, payload, clientId, graphIds }))
    );
  }

  onServerCreate(graphId: string, types: string[]) {
    return defer(() =>
      from(getDoc(doc(this._firestore, `graphs/${graphId}`))).pipe(
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
            where('graphIds', 'array-contains', graphId),
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
