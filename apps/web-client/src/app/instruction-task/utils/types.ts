import { Entity, Option } from '../../shared';

export type TaskArgumentReferenceDto = Entity<{
  kind: 'argument';
  ref: Option<string>;
}>;

export type TaskDocumentReferenceDto = Entity<{
  kind: 'document';
  ref: Option<string>;
}>;

export type TaskSysvarReferenceDto = Entity<{
  kind: 'sysvar';
  ref: Option<string>;
}>;

export type TaskSignerReferenceDto = Entity<{
  kind: 'signer';
  ref: Option<string>;
}>;

export type TaskApplicationReferenceDto = Entity<{
  kind: 'application';
  ref: Option<string>;
}>;

export type TaskReferenceDto =
  | TaskArgumentReferenceDto
  | TaskDocumentReferenceDto
  | TaskSysvarReferenceDto
  | TaskSignerReferenceDto
  | TaskApplicationReferenceDto;

export type InstructionTaskDto = Entity<{
  name: string;
  instructionId: string;
  references: TaskReferenceDto[];
}>;
