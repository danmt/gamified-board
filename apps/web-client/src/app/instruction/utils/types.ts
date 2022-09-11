import { InstructionApplicationDto } from '../../instruction-application';
import { InstructionArgumentDto } from '../../instruction-argument';
import { InstructionDocumentDto } from '../../instruction-document';
import { InstructionSignerDto } from '../../instruction-signer';
import { InstructionSysvarDto } from '../../instruction-sysvar';
import { InstructionTaskDto } from '../../instruction-task';
import { Entity } from '../../shared';

export type InstructionDto = Entity<{
  name: string;
  thumbnailUrl: string;
  applicationId: string;
  workspaceId: string;
  documents: InstructionDocumentDto[];
  applications: InstructionApplicationDto[];
  tasks: InstructionTaskDto[];
  arguments: InstructionArgumentDto[];
  sysvars: InstructionSysvarDto[];
  signers: InstructionSignerDto[];
}>;
