import { Entity } from '../../shared';

export type InstructionSysvarDto = Entity<{
  name: string;
  sysvarId: string;
}>;
