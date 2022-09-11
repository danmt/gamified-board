import { Entity } from '../../shared';

export type SysvarDto = Entity<{
  name: string;
  thumbnailUrl: string;
}>;
