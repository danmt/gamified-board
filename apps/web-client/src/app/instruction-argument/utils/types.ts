import { Entity } from '../../shared/utils';

export type InstructionArgumentDto = Entity<{
  name: string;
  type: string;
  isOption: boolean;
}>;
