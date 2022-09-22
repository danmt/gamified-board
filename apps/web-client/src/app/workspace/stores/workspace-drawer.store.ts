import { Injectable } from '@angular/core';
import { DrawerStore } from '../../drawer/stores';
import {
  WorkspaceGraphData,
  WorkspaceNodeData,
  WorkspaceNodeKinds,
} from '../utils';

@Injectable()
export class WorkspaceDrawerStore extends DrawerStore<
  WorkspaceNodeKinds,
  WorkspaceNodeData,
  'workspace',
  WorkspaceGraphData
> {
  constructor() {
    super();
  }
}
