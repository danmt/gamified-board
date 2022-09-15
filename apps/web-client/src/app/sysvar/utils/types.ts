import { Entity } from '../../shared/utils';

export type SysvarDto = Entity<{
  name: string;
  thumbnailUrl: string;
}>;
