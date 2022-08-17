import { transferArrayItem } from '@angular/cdk/drag-drop';
import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';

import { defer, from } from 'rxjs';
import { Collection } from '../utils';

@Injectable({ providedIn: 'root' })
export class DocumentApiService {
  private readonly _firestore = inject(Firestore);

  transferDocument(
    instructions: { id: string; documents: { id: string }[] }[],
    previousInstructionId: string,
    newInstructionId: string,
    documentId: string,
    previousIndex: number,
    newIndex: number
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const previousInstructionIndex = instructions.findIndex(
            ({ id }) => id === previousInstructionId
          );

          if (previousInstructionIndex === -1) {
            throw new Error('Invalid previous instruction.');
          }

          const previousInstructionRef = doc(
            this._firestore,
            `instructions/${previousInstructionId}`
          );

          const newInstructionIndex = instructions.findIndex(
            ({ id }) => id === newInstructionId
          );

          if (newInstructionIndex === -1) {
            throw new Error('Invalid new instruction.');
          }

          const newInstructionRef = doc(
            this._firestore,
            `instructions/${newInstructionId}`
          );

          const previousInstructionDocuments = instructions[
            previousInstructionIndex
          ].documents.map(({ id }) => id);
          const newInstructionDocuments = instructions[
            newInstructionIndex
          ].documents.map(({ id }) => id);

          transferArrayItem(
            previousInstructionDocuments,
            newInstructionDocuments,
            previousIndex,
            newIndex
          );

          const currentDocumentRef = doc(
            this._firestore,
            `instructions/${previousInstructionId}/documents/${documentId}`
          );
          const newDocumentRef = doc(
            this._firestore,
            `instructions/${newInstructionId}/documents/${documentId}`
          );

          const document = await transaction.get(currentDocumentRef);
          // remove from previous instruction documents
          transaction.update(previousInstructionRef, {
            documentsOrder: previousInstructionDocuments,
          });
          // remove from previous instruction documentsOrder
          transaction.delete(currentDocumentRef);

          // add it to new instruction documents
          transaction.set(newDocumentRef, document.data());
          // update new instruction documents order
          transaction.update(newInstructionRef, {
            documentsOrder: newInstructionDocuments,
          });

          return {};
        })
      )
    );
  }

  deleteDocument(instructionId: string, documentId: string) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

          const instruction = await transaction.get(instructionRef);

          const documentsOrder = instruction
            .data()
            ?.['documentsOrder'].filter(
              (document: string) => document !== documentId
            );

          transaction.update(instructionRef, { documentsOrder });
          transaction.delete(
            doc(
              this._firestore,
              `instructions/${instructionId}/documents/${documentId}`
            )
          );

          return {};
        })
      )
    );
  }

  createDocument(
    instructionId: string,
    newDocumentId: string,
    name: string,
    documentCollection: Collection
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );
          const newDocumentRef = doc(
            this._firestore,
            `instructions/${instructionId}/documents/${newDocumentId}`
          );
          const instruction = await transaction.get(instructionRef);
          const instructionData = instruction.data();

          // create the new document
          transaction.set(newDocumentRef, {
            name,
            isInternal: documentCollection.isInternal,
            collectionRef: documentCollection.isInternal
              ? doc(this._firestore, `collections/${documentCollection.id}`)
              : null,
            namespace: documentCollection.namespace ?? null,
            plugin: documentCollection.plugin ?? null,
            account: documentCollection.account ?? null,
          });
          // push document id to the documentsOrder
          transaction.update(instructionRef, {
            documentsOrder: [
              ...(instructionData ? instructionData['documentsOrder'] : []),
              newDocumentId,
            ],
          });

          return {};
        })
      )
    );
  }
}
