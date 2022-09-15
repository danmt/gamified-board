import { inject, Injectable } from '@angular/core';
import { doc, Firestore, runTransaction } from '@angular/fire/firestore';
import { defer, from } from 'rxjs';
import { Entity, Option } from '../../shared/utils';
import {
  ArgumentReference,
  AttributeReference,
  DocumentReference,
  InstructionDocumentDto,
  SignerReference,
  Value,
} from '../utils';

export type CreateInstructionDocumentDto = Entity<{
  name: string;
  method: string;
  collectionId: string;
  payer: Option<DocumentReference | SignerReference>;
}>;

export type UpdateInstructionDocumentDto = Partial<{
  name: string;
  method: string;
  seeds: (ArgumentReference | AttributeReference | Value)[];
  bump: Option<ArgumentReference | AttributeReference>;
  payer: Option<DocumentReference | SignerReference>;
}>;

@Injectable({ providedIn: 'root' })
export class InstructionDocumentApiService {
  private readonly _firestore = inject(Firestore);

  createInstructionDocument(
    ownerId: string,
    { id, name, method, collectionId, payer }: CreateInstructionDocumentDto
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
                id,
                name,
                method,
                collectionId,
                seeds: [],
                bump: null,
                payer,
              },
            ],
          });

          return {};
        })
      )
    );
  }

  updateInstructionDocument(
    instructionId: string,
    documentId: string,
    changes: UpdateInstructionDocumentDto
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
                ...changes,
              },
              ...documents.slice(documentIndex + 1),
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
}
