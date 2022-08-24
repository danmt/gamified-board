import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity, Option } from '../utils';

export interface ArgumentReference {
  kind: 'argument';
  argumentId: string;
}

export interface DocumentReference {
  kind: 'document';
  documentId: string;
  attributeId: string;
}

export type Reference = ArgumentReference | DocumentReference;

export type Value = {
  type: string;
  value: string;
};

export type DocumentDto = Entity<{
  name: string;
  method: string;
  ownerId: string;
  collectionId: string;
  seeds: (Reference | Value)[];
  bump: Option<Reference>;
  payer: Option<DocumentReference>;
}>;

@Injectable({ providedIn: 'root' })
export class DocumentApiService {
  private readonly _firestore = inject(Firestore);

  transferDocument(
    previousInstructionId: string,
    newInstructionId: string,
    documentId: string,
    newIndex: number
  ) {
    const previousInstructionRef = doc(
      this._firestore,
      `instructions/${previousInstructionId}`
    );

    const newInstructionRef = doc(
      this._firestore,
      `instructions/${newInstructionId}`
    );

    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const previousInstruction = await transaction.get(
            previousInstructionRef
          );
          const newInstruction = await transaction.get(newInstructionRef);

          const previousInstructionDocuments = (previousInstruction.data()?.[
            'documents'
          ] ?? []) as DocumentDto[];
          const newInstructionDocuments = (newInstruction.data()?.[
            'documents'
          ] ?? []) as DocumentDto[];
          const document =
            previousInstructionDocuments.find(
              (document) => document.id === documentId
            ) ?? null;

          if (document === null) {
            throw new Error('Document not found');
          }

          transaction.update(previousInstructionRef, {
            documents: previousInstructionDocuments.filter(
              (document: DocumentDto) => document.id !== documentId
            ),
          });
          transaction.update(newInstructionRef, {
            documents: [
              ...newInstructionDocuments.slice(0, newIndex),
              document,
              ...newInstructionDocuments.slice(newIndex + 1),
            ],
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

          transaction.update(instructionRef, {
            documents: instruction
              .data()
              ?.['documents'].filter(
                (document: DocumentDto) => document.id !== documentId
              ),
          });

          return {};
        })
      )
    );
  }

  updateDocument(
    instructionId: string,
    documentId: string,
    name: string,
    method: string,
    seeds: (Reference | Value)[],
    bump: Option<Reference>,
    payer: Option<DocumentReference>
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${instructionId}`
          );

          const instruction = await transaction.get(instructionRef);
          const documents = (instruction.data()?.['documents'] ??
            []) as DocumentDto[];
          const documentIndex = documents.findIndex(
            (document) => document.id === documentId
          );

          if (documentIndex === -1) {
            throw new Error('Document not found');
          }

          transaction.update(instructionRef, {
            documents: [
              ...documents.slice(0, documentIndex),
              {
                ...documents[documentIndex],
                name,
                method,
                seeds,
                bump,
                payer,
              },
              ...documents.slice(documentIndex + 1),
            ],
          });

          return {};
        })
      )
    );
  }

  createDocument(
    ownerId: string,
    newDocumentId: string,
    name: string,
    method: string,
    collectionId: string,
    seeds: (Reference | Value)[],
    bump: Option<Reference>,
    payer: Option<DocumentReference>
  ) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${ownerId}`
          );
          const instruction = await transaction.get(instructionRef);
          const instructionData = instruction.data();

          // push document to the instruction's documents list
          transaction.update(instructionRef, {
            documents: [
              ...(instructionData && instructionData['documents']
                ? instructionData['documents']
                : []),
              {
                id: newDocumentId,
                name,
                method,
                ownerId,
                collectionId,
                seeds,
                bump,
                payer,
              },
            ],
          });

          return {};
        })
      )
    );
  }

  updateDocumentsOrder(ownerId: string, documentsOrder: string[]) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${ownerId}`
          );

          const instruction = await transaction.get(instructionRef);
          const documents = (instruction.data()?.['documents'] ??
            []) as DocumentDto[];

          transaction.update(instructionRef, {
            documents: documentsOrder.map((documentId) => {
              const documentIndex = documents.findIndex(
                (document) => document.id === documentId
              );

              return documents[documentIndex];
            }),
          });

          return {};
        })
      )
    );
  }
}
