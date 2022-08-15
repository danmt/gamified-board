import { Pipe, PipeTransform } from '@angular/core';
import { BoardItemKind, Entity } from '../utils';

@Pipe({
  name: 'pgBoardItemDropLists',
  standalone: true,
})
export class BoardItemDropListsPipe implements PipeTransform {
  transform(value: Entity<unknown>[], kind: BoardItemKind): string[] {
    return value.map(({ id }) => `${id}-${kind}`);
  }
}
