import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  runTransaction,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { combineLatest, defer, from, map, Observable, of } from 'rxjs';
import { Entity } from '../../shared/utils';

export type SysvarDto = Entity<{
  name: string;
  thumbnailUrl: string;
}>;

export type CreateSysvarDto = Entity<{
  name: string;
}>;

export type UpdateSysvarDto = Partial<{
  name: string;
}>;

export interface UpdateSysvarThumbnailDto {
  fileId: string;
  fileUrl: string;
}

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

  createSysvar({ id, name }: CreateSysvarDto) {
    const newSysvarRef = doc(this._firestore, `sysvars/${id}`);

    return defer(() =>
      from(
        setDoc(newSysvarRef, {
          name,
          thumbnailUrl: null,
        })
      )
    );
  }

  updateSysvar(sysvarId: string, changes: UpdateSysvarDto) {
    const sysvarRef = doc(this._firestore, `sysvars/${sysvarId}`);

    return defer(() => from(updateDoc(sysvarRef, changes)));
  }

  updateSysvarThumbnail(
    sysvarId: string,
    { fileId, fileUrl }: UpdateSysvarThumbnailDto
  ) {
    const sysvarRef = doc(this._firestore, `sysvars/${sysvarId}`);
    const uploadRef = doc(this._firestore, `uploads/${fileId}`);

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          transaction.set(uploadRef, {
            kind: 'sysvar',
            ref: sysvarId,
          });
          transaction.update(sysvarRef, { thumbnailUrl: fileUrl });

          return true;
        })
      )
    );
  }
}
