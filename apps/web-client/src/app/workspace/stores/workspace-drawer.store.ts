import { Injectable } from '@angular/core';
import { DrawerStore } from '../../drawer/stores';
import {
  WorkspaceGraphData,
  WorkspaceGraphKind,
  WorkspaceNodeData,
  WorkspaceNodeKinds,
  WorkspaceNodesData,
} from '../utils';

@Injectable()
export class WorkspaceDrawerStore extends DrawerStore<
  WorkspaceNodeKinds,
  WorkspaceNodeData,
  WorkspaceNodesData,
  WorkspaceGraphKind,
  WorkspaceGraphData
> {
  constructor() {
    super();
  }
}
