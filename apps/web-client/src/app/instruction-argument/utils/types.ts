import { Entity } from '../../shared';

export type InstructionArgumentDto = Entity<{
  name: string;
  type: string;
  isOption: boolean;
}>;
