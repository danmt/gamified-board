import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity, isNull, Option } from '../../shared/utils';

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

export type InstructionDocumentDto = Entity<{
  name: string;
  method: string;
  collectionId: string;
  seeds: (Reference | Value)[];
  bump: Option<Reference>;
  payer: Option<DocumentReference>;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionDocumentApiService {
  private readonly _firestore = inject(Firestore);

  transferInstructionDocument(
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

          const previousInstructionInstructionDocuments =
            (previousInstruction.data()?.['documents'] ??
              []) as InstructionDocumentDto[];
          const newInstructionInstructionDocuments = (newInstruction.data()?.[
            'documents'
          ] ?? []) as InstructionDocumentDto[];
          const document =
            previousInstructionInstructionDocuments.find(
              (document) => document.id === documentId
            ) ?? null;

          if (isNull(document)) {
            throw new Error('InstructionDocument not found');
          }

          transaction.update(previousInstructionRef, {
            documents: previousInstructionInstructionDocuments.filter(
              (document: InstructionDocumentDto) => document.id !== documentId
            ),
          });
          transaction.update(newInstructionRef, {
            documents: [
              ...newInstructionInstructionDocuments.slice(0, newIndex),
              document,
              ...newInstructionInstructionDocuments.slice(newIndex),
            ],
          });

          return {};
        })
      )
    );
  }

  deleteInstructionDocument(instructionId: string, documentId: string) {
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
                (document: InstructionDocumentDto) => document.id !== documentId
              ),
          });

          return {};
        })
      )
    );
  }

  updateInstructionDocument(
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
            []) as InstructionDocumentDto[];
          const documentIndex = documents.findIndex(
            (document) => document.id === documentId
          );

          if (documentIndex === -1) {
            throw new Error('InstructionDocument not found');
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

  createInstructionDocument(
    ownerId: string,
    newInstructionDocumentId: string,
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
                id: newInstructionDocumentId,
                name,
                method,
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

  updateInstructionDocumentsOrder(ownerId: string, documentsOrder: string[]) {
    return defer(() =>
      from(
        runTransaction(this._firestore, async (transaction) => {
          const instructionRef = doc(
            this._firestore,
            `instructions/${ownerId}`
          );

          const instruction = await transaction.get(instructionRef);
          const documents = (instruction.data()?.['documents'] ??
            []) as InstructionDocumentDto[];

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
