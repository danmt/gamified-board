import { Entity } from '../../shared/utils';

export type InstructionSignerDto = Entity<{
  name: string;
  saveChanges: boolean;
}>;
