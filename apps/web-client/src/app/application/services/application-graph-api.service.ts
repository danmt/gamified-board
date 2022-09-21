import { Injectable } from '@angular/core';
import { GraphApiService } from '../../drawer/services';
import { ApplicationGraphData, ApplicationNodeData } from '../utils';

@Injectable({ providedIn: 'root' })
export class ApplicationGraphApiService extends GraphApiService<
  ApplicationGraphData,
  ApplicationNodeData
> {
  constructor() {
    super();
  }
}
