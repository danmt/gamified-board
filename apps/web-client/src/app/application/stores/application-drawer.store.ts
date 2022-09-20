import { Injectable } from '@angular/core';
import { DrawerStore } from '../../drawer/stores';
import { ApplicationGraphData, ApplicationNodeData } from '../utils';

@Injectable()
export class ApplicationDrawerStore extends DrawerStore<
  ApplicationGraphData,
  ApplicationNodeData
> {
  constructor() {
    super();
  }
}
