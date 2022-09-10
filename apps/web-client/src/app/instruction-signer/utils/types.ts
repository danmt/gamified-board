import { Entity } from '../../shared';

export type InstructionSignerDto = Entity<{
  name: string;
  saveChanges: boolean;
}>;
