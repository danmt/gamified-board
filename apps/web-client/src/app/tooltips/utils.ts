import { ConnectedPosition } from '@angular/cdk/overlay';

export type Position = 'left' | 'right' | 'top' | 'bottom';

export const LEFT_POSITION: ConnectedPosition = {
  originX: 'start',
  originY: 'center',
  overlayX: 'end',
  overlayY: 'center',
  offsetX: -16,
};

export const RIGHT_POSITION: ConnectedPosition = {
  originX: 'end',
  originY: 'center',
  overlayX: 'start',
  overlayY: 'center',
  offsetX: 16,
};

export const TOP_POSITION: ConnectedPosition = {
  originX: 'center',
  originY: 'top',
  overlayX: 'center',
  overlayY: 'bottom',
  offsetY: -16,
};

export const BOTTOM_POSITION: ConnectedPosition = {
  originX: 'center',
  originY: 'bottom',
  overlayX: 'center',
  overlayY: 'top',
  offsetY: 16,
};

export const getPosition = (position: Position) => {
  switch (position) {
    case 'left':
      return LEFT_POSITION;
    case 'right':
      return RIGHT_POSITION;
    case 'top':
      return TOP_POSITION;
    case 'bottom':
      return BOTTOM_POSITION;
  }
};
