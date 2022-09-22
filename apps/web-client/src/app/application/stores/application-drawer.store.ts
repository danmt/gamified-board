import { Injectable } from '@angular/core';
import { DrawerStore } from '../../drawer/stores';
import {
  ApplicationGraphData,
  ApplicationGraphKind,
  ApplicationNodeData,
  ApplicationNodeKinds,
} from '../utils';

@Injectable()
export class ApplicationDrawerStore extends DrawerStore<
  ApplicationNodeKinds,
  ApplicationNodeData,
  ApplicationGraphKind,
  ApplicationGraphData
> {
  constructor() {
    super();
  }
}
