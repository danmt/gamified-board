export type Option<T> = T | null;

export type Entity<T = unknown> = T & { id: string };

export type Position = 'left' | 'right' | 'top' | 'bottom';

export type GetTypeUnion<Nodes extends { [key: string]: unknown }> = {
  [TNode in keyof Nodes]: {
    kind: TNode;
    data: Nodes[TNode];
  };
}[keyof Nodes & string];
