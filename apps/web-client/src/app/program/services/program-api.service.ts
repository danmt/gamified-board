import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { defer, from, map, Observable } from 'rxjs';
import { EventApiService } from '../../drawer/services';
import { Entity } from '../../shared/utils';
import { ProgramCheckpoint, ProgramDto } from '../utils';

export type CreateProgramDto = Entity<{
  workspaceId: string;
  name: string;
  kind: string;
}>;

export type UpdateProgramDto = Partial<{
  name: string;
}>;

export interface UpdateProgramThumbnailDto {
  fileId: string;
  fileUrl: string;
}

export interface InstallProgramDto {
  id: string;
  data: ProgramCheckpoint;
}

@Injectable({ providedIn: 'root' })
export class ProgramApiService {
  private readonly _firestore = inject(Firestore);
  private readonly _eventApiService = inject(EventApiService);

  getProgram(programId: string): Observable<ProgramDto> {
    const programRef = doc(this._firestore, `graphs/${programId}`);

    return docData(programRef).pipe(
      map((program) => ({
        id: programId,
        name: program['name'],
        workspaceId: program['workspaceRef'].id,
        thumbnailUrl: program['thumbnailUrl'],
      }))
    );
  }

  getWorkspacePrograms(workspaceId: string) {
    const programsRef = collection(
      this._firestore,
      `graphs/${workspaceId}/nodes`
    );

    return collectionData(
      query(programsRef).withConverter({
        fromFirestore: (snapshot) => {
          const program = snapshot.data();

          return {
            id: snapshot.id,
            data: program['data'],
          };
        },
        toFirestore: (it) => it,
      })
    );
  }

  async getProgramLastCheckpoint(workspaceId: string, programId: string) {
    const querySnapshot = await getDocs(
      query(
        collection(
          this._firestore,
          `graphs/${workspaceId}/nodes/${programId}/checkpoints`
        ).withConverter({
          fromFirestore: (snapshot) => {
            const data = snapshot.data();

            return {
              id: snapshot.id,
              name: data['name'],
              graph: data['graph'],
              nodes: data['nodes'],
              edges: data['edges'],
            };
          },
          toFirestore: (it) => it,
        }),
        orderBy('createdAt', 'desc'),
        limit(3)
      )
    );

    return querySnapshot.docs.map((doc) => doc.data());
  }

  async getProgramInstallations(workspaceId: string, programId: string) {
    const querySnapshot = await getDocs(
      query(
        collection(
          this._firestore,
          `graphs/${workspaceId}/nodes/${programId}/installations`
        ).withConverter({
          fromFirestore: (snapshot) => {
            const installationData = snapshot.data();

            return {
              id: snapshot.id,
              data: installationData['data'],
            };
          },
          toFirestore: (it) => it,
        })
      )
    );

    return querySnapshot.docs.map((doc) => doc.data());
  }

  createProgram({ id, workspaceId, name }: CreateProgramDto) {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);
    const newProgramRef = doc(this._firestore, `programs/${id}`);

    return defer(() =>
      from(
        setDoc(newProgramRef, {
          name,
          thumbnailUrl: null,
          workspaceRef,
        })
      )
    );
  }

  updateProgram(programId: string, changes: UpdateProgramDto) {
    const programRef = doc(this._firestore, `programs/${programId}`);

    return defer(() => from(updateDoc(programRef, changes)));
  }

  updateProgramThumbnail(
    programId: string,
    { fileId, fileUrl }: UpdateProgramThumbnailDto
  ) {
    const programRef = doc(this._firestore, `programs/${programId}`);
    const uploadRef = doc(this._firestore, `uploads/${fileId}`);

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          transaction.set(uploadRef, {
            kind: 'program',
            ref: programId,
          });
          transaction.update(programRef, { thumbnailUrl: fileUrl });

          return true;
        })
      )
    );
  }

  deleteProgram(programId: string) {
    const programRef = doc(this._firestore, `programs/${programId}`);

    return defer(() => from(deleteDoc(programRef)));
  }

  installProgram(
    clientId: string,
    workspaceId: string,
    programId: string,
    payload: InstallProgramDto
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'installProgram',
      payload: {
        ...payload,
        workspaceId,
        programId,
      },
    });
  }
}
