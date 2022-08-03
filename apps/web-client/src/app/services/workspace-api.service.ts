import { inject, Injectable } from '@angular/core';
import {
  collectionData,
  collectionGroup,
  doc,
  docData,
  DocumentData,
  documentId,
  DocumentReference,
  endAt,
  Firestore,
  orderBy,
  query,
  startAt,
} from '@angular/fire/firestore';
import { combineLatest, map, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkspaceApiService {
  private readonly _firestore = inject(Firestore);

  getFavoriteWorkspaces(userId: string) {
    const userRef = doc(this._firestore, `users/${userId}`);

    return collectionData(
      query(
        collectionGroup(this._firestore, 'favorite-workspaces').withConverter<
          DocumentReference<DocumentData>
        >({
          fromFirestore: (snapshot) => snapshot.data()['workspaceRef'],
          toFirestore: (it: DocumentData) => it,
        }),
        orderBy(documentId()),
        startAt(userRef.path),
        endAt(userRef.path + '\uf8ff')
      )
    ).pipe(
      switchMap((favoriteWorkspacesRefs) =>
        combineLatest(
          favoriteWorkspacesRefs.map((favoriteWorkspaceRef) =>
            docData(favoriteWorkspaceRef).pipe(
              switchMap((workspace) =>
                collectionData(
                  query(
                    collectionGroup(
                      this._firestore,
                      'applications'
                    ).withConverter<DocumentReference<DocumentData>>({
                      fromFirestore: (snapshot) =>
                        snapshot.data()['applicationRef'],
                      toFirestore: (it: DocumentData) => it,
                    }),
                    orderBy(documentId()),
                    startAt(favoriteWorkspaceRef.path),
                    endAt(favoriteWorkspaceRef.path + '\uf8ff')
                  )
                ).pipe(
                  switchMap((applicationsRefs) =>
                    combineLatest(
                      applicationsRefs.map((applicationRef) =>
                        docData(applicationRef).pipe(
                          map((application) => ({
                            id: applicationRef.id,
                            name: application['name'],
                          }))
                        )
                      )
                    ).pipe(
                      map((applications) => ({
                        id: favoriteWorkspaceRef.id,
                        name: workspace['name'],
                        applications,
                      }))
                    )
                  )
                )
              )
            )
          )
        )
      )
    );
  }
}
