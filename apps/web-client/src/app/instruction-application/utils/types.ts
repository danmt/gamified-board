import { Entity } from '../../shared/utils';

export type InstructionApplicationDto = Entity<{
  name: string;
  applicationId: string;
}>;
