import { Injectable } from '@angular/core';
import { DrawerStore } from '../../drawer/stores';
import {
  ApplicationGraphData,
  ApplicationGraphKind,
  ApplicationNodeData,
  ApplicationNodeKinds,
  ApplicationNodesData,
} from '../utils';

@Injectable()
export class ApplicationDrawerStore extends DrawerStore<
  ApplicationNodeKinds,
  ApplicationNodeData,
  ApplicationNodesData,
  ApplicationGraphKind,
  ApplicationGraphData
> {
  constructor() {
    super();
  }
}
