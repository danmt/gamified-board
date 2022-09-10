import { Entity } from '../../shared';

export type InstructionApplicationDto = Entity<{
  name: string;
  applicationId: string;
}>;
