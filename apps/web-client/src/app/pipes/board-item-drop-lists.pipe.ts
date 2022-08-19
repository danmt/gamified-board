import { Pipe, PipeTransform } from '@angular/core';
import { Entity } from '../utils';

export type BoardItemKind = 'document' | 'task';

@Pipe({
  name: 'pgBoardItemDropLists',
  standalone: true,
})
export class BoardItemDropListsPipe implements PipeTransform {
  transform(value: Entity<unknown>[], kind: BoardItemKind): string[] {
    return value.map(({ id }) => `${id}-${kind}`);
  }
}
