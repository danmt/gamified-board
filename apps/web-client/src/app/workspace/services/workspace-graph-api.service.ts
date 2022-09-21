import { Injectable } from '@angular/core';
import { GraphApiService } from '../../drawer/services';
import { WorkspaceGraphData, WorkspaceNodeData } from '../utils';

@Injectable({ providedIn: 'root' })
export class WorkspaceGraphApiService extends GraphApiService<
  WorkspaceGraphData,
  WorkspaceNodeData
> {
  constructor() {
    super();
  }
}
