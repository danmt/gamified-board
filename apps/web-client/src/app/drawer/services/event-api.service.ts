import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { defer, from } from 'rxjs';
import { EventDto } from '../utils';

@Injectable({ providedIn: 'root' })
export class EventApiService {
  private readonly _functions = inject(Functions);
  private readonly _firestore = inject(Firestore);

  emit(clientId: string, { type, payload }: EventDto) {
    const publishEvent = httpsCallable(this._functions, 'publishEvent');

    return defer(() => from(publishEvent({ type, payload, clientId })));
  }
}
