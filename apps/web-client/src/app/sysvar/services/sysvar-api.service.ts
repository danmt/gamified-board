import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { combineLatest, defer, from, map, Observable, of } from 'rxjs';
import { Entity } from '../../shared/utils';

export type SysvarDto = Entity<{
  name: string;
  thumbnailUrl: string;
}>;

@Injectable({ providedIn: 'root' })
export class SysvarApiService {
  private readonly _firestore = inject(Firestore);

  getSysvar(sysvarId: string): Observable<SysvarDto> {
    return docData(doc(this._firestore, `sysvars/${sysvarId}`)).pipe(
      map((sysvar) => ({
        id: sysvarId,
        name: sysvar['name'],
        thumbnailUrl: sysvar['thumbnailUrl'],
      }))
    );
  }

  getSysvars(sysvarIds: string[]): Observable<SysvarDto[]> {
    if (sysvarIds.length === 0) {
      return of([]);
    }

    return combineLatest(sysvarIds.map((sysvarId) => this.getSysvar(sysvarId)));
  }

  getAllSysvars(): Observable<SysvarDto[]> {
    return collectionData(
      collection(this._firestore, 'sysvars').withConverter({
        fromFirestore: (snapshot) => {
          const data = snapshot.data();

          return {
            id: snapshot.id,
            name: data['name'],
            thumbnailUrl: data['thumbnailUrl'],
          };
        },
        toFirestore: (it) => it,
      })
    );
  }

  deleteSysvar(sysvarId: string) {
    const sysvarRef = doc(this._firestore, `sysvars/${sysvarId}`);

    return defer(() => from(deleteDoc(sysvarRef)));
  }

  createSysvar(newSysvarId: string, name: string, thumbnailUrl: string) {
    const newSysvarRef = doc(this._firestore, `sysvars/${newSysvarId}`);

    return defer(() =>
      from(
        setDoc(newSysvarRef, {
          name,
          thumbnailUrl,
        })
      )
    );
  }

  updateSysvar(sysvarId: string, name: string, thumbnailUrl: string) {
    const sysvarRef = doc(this._firestore, `sysvars/${sysvarId}`);

    return defer(() =>
      from(
        updateDoc(sysvarRef, {
          name,
          thumbnailUrl,
        })
      )
    );
  }
}
