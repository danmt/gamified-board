import { Injectable } from '@angular/core';
import { DrawerStore } from '../../drawer/stores';
import { WorkspaceGraphData, WorkspaceNodeData } from '../utils';

@Injectable()
export class WorkspaceDrawerStore extends DrawerStore<
  WorkspaceGraphData,
  WorkspaceNodeData
> {
  constructor() {
    super();
  }
}
