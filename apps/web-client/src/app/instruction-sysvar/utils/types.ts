import { Entity } from '../../shared/utils';

export type InstructionSysvarDto = Entity<{
  name: string;
  sysvarId: string;
}>;
