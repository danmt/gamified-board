import { Pipe, PipeTransform } from '@angular/core';
import { Entity, Option } from '../utils';

export type BoardItemKind = 'document' | 'task' | 'application' | 'sysvar';

@Pipe({
  name: 'pgBoardItemDropLists',
  standalone: true,
})
export class BoardItemDropListsPipe implements PipeTransform {
  transform(value: Option<Entity<unknown>[]>, kind: BoardItemKind): string[] {
    return value?.map(({ id }) => `${id}-${kind}`) ?? [];
  }
}
