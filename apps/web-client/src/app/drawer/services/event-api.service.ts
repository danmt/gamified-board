import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { defer, from } from 'rxjs';
import { DrawerEvent, EventDto } from '../utils';

@Injectable({ providedIn: 'root' })
export class EventApiService {
  private readonly _functions = inject(Functions);
  private readonly _firestore = inject(Firestore);

  emit(clientId: string, graphId: string, { type, payload }: EventDto) {
    const publishEvent = httpsCallable(this._functions, 'publishEvent');

    return defer(() =>
      from(publishEvent({ type, payload, graphId, clientId }))
    );
  }

  async onServerCreate(
    clientId: string,
    graphId: string,
    lastEventId: string,
    callback: (event: DrawerEvent) => void
  ) {
    const lastEvent = await getDoc(
      doc(this._firestore, `events/${lastEventId}`)
    );

    return onSnapshot(
      query(
        collection(this._firestore, 'events'),
        where('graphId', '==', graphId),
        orderBy('createdAt', 'asc'),
        startAfter(lastEvent),
        limitToLast(1)
      ),
      (querySnapshot) => {
        if (!querySnapshot.metadata.hasPendingWrites && !querySnapshot.empty) {
          const firstDocument = querySnapshot.docs[0].data();

          if (firstDocument && firstDocument['clientId'] !== clientId) {
            callback({
              type: firstDocument['type'],
              payload: firstDocument['payload'],
            });
          }
        }
      }
    );
  }
}
