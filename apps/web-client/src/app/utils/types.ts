export type ItemKind = 'collection' | 'instruction';

export interface Item {
  kind: ItemKind;
  data: string;
}
