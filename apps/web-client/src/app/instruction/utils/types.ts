import { InstructionApplicationDto } from '../../instruction-application/utils';
import { InstructionArgumentDto } from '../../instruction-argument/utils';
import { InstructionDocumentDto } from '../../instruction-document/utils';
import { InstructionSignerDto } from '../../instruction-signer/utils';
import { InstructionSysvarDto } from '../../instruction-sysvar/utils';
import { InstructionTaskDto } from '../../instruction-task/utils';
import { Entity } from '../../shared/utils';

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
