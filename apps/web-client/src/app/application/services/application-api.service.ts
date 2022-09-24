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
import { ApplicationCheckpoint, ApplicationDto } from '../utils';

export type CreateApplicationDto = Entity<{
  workspaceId: string;
  name: string;
  kind: string;
}>;

export type UpdateApplicationDto = Partial<{
  name: string;
}>;

export interface UpdateApplicationThumbnailDto {
  fileId: string;
  fileUrl: string;
}

export interface InstallApplicationDto {
  id: string;
  data: ApplicationCheckpoint;
}

@Injectable({ providedIn: 'root' })
export class ApplicationApiService {
  private readonly _firestore = inject(Firestore);
  private readonly _eventApiService = inject(EventApiService);

  getApplication(applicationId: string): Observable<ApplicationDto> {
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );

    return docData(applicationRef).pipe(
      map((application) => ({
        id: applicationId,
        name: application['name'],
        workspaceId: application['workspaceRef'].id,
        thumbnailUrl: application['thumbnailUrl'],
      }))
    );
  }

  getWorkspaceApplications(workspaceId: string) {
    const applicationsRef = collection(
      this._firestore,
      `graphs/${workspaceId}/nodes`
    );

    return collectionData(
      query(applicationsRef).withConverter({
        fromFirestore: (snapshot) => {
          const application = snapshot.data();

          return {
            id: snapshot.id,
            data: application['data'],
          };
        },
        toFirestore: (it) => it,
      })
    );
  }

  async getApplicationLastCheckpoint(
    workspaceId: string,
    applicationId: string
  ) {
    const querySnapshot = await getDocs(
      query(
        collection(
          this._firestore,
          `graphs/${workspaceId}/nodes/${applicationId}/checkpoints`
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

  async getApplicationInstallations(
    workspaceId: string,
    applicationId: string
  ) {
    const querySnapshot = await getDocs(
      query(
        collection(
          this._firestore,
          `graphs/${workspaceId}/nodes/${applicationId}/installations`
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

  createApplication({ id, workspaceId, name }: CreateApplicationDto) {
    const workspaceRef = doc(this._firestore, `workspaces/${workspaceId}`);
    const newApplicationRef = doc(this._firestore, `applications/${id}`);

    return defer(() =>
      from(
        setDoc(newApplicationRef, {
          name,
          thumbnailUrl: null,
          workspaceRef,
        })
      )
    );
  }

  updateApplication(applicationId: string, changes: UpdateApplicationDto) {
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );

    return defer(() => from(updateDoc(applicationRef, changes)));
  }

  updateApplicationThumbnail(
    applicationId: string,
    { fileId, fileUrl }: UpdateApplicationThumbnailDto
  ) {
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );
    const uploadRef = doc(this._firestore, `uploads/${fileId}`);

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          transaction.set(uploadRef, {
            kind: 'application',
            ref: applicationId,
          });
          transaction.update(applicationRef, { thumbnailUrl: fileUrl });

          return true;
        })
      )
    );
  }

  deleteApplication(applicationId: string) {
    const applicationRef = doc(
      this._firestore,
      `applications/${applicationId}`
    );

    return defer(() => from(deleteDoc(applicationRef)));
  }

  installApplication(
    clientId: string,
    workspaceId: string,
    applicationId: string,
    payload: InstallApplicationDto
  ) {
    return this._eventApiService.emit(clientId, {
      type: 'installApplication',
      payload: {
        ...payload,
        workspaceId,
        applicationId,
      },
    });
  }
}
