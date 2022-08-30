import { Directive, HostListener } from '@angular/core';
import { map, Subscription } from 'rxjs';
import { distance, Option } from '../utils';

@Directive({ selector: '[pgCursorScroll]', standalone: true })
export class CursorScrollDirective {
  private _movingRightSubscription: Option<Subscription> = null;
  private _movingLeftSubscription: Option<Subscription> = null;
  private _movingTopSubscription: Option<Subscription> = null;
  private _movingBottomSubscription: Option<Subscription> = null;

  @HostListener('window:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    if (
      this._isInRightBorder(event.clientX) &&
      this._movingRightSubscription === null
    ) {
      this._moveRight();
    } else if (
      !this._isInRightBorder(event.clientX) &&
      this._movingRightSubscription !== null
    ) {
      this._stopMovingRight();
    }

    if (
      this._isInLeftBorder(event.clientX) &&
      this._movingLeftSubscription === null
    ) {
      this._moveLeft();
    } else if (
      !this._isInLeftBorder(event.clientX) &&
      this._movingLeftSubscription !== null
    ) {
      this._stopMovingLeft();
    }

    if (
      this._isInBottomBorder(event.clientY) &&
      this._movingBottomSubscription === null
    ) {
      this._moveBottom();
    } else if (
      !this._isInBottomBorder(event.clientY) &&
      this._movingBottomSubscription !== null
    ) {
      this._stopMovingBottom();
    }

    if (
      this._isInTopBorder(event.clientY) &&
      this._movingTopSubscription === null
    ) {
      this._moveTop();
    } else if (
      !this._isInTopBorder(event.clientY) &&
      this._movingTopSubscription !== null
    ) {
      this._stopMovingTop();
    }
  }

  private _isInRightBorder(positionX: number) {
    return (
      Math.ceil(window.innerWidth - positionX) <= 16 &&
      Math.ceil(window.scrollX + window.innerWidth) <
        window.document.body.scrollWidth
    );
  }

  private _moveRight() {
    // 8000 total of the board
    // 1500 inner width (window size)
    // 8000 - 1500 = 2500 max to the left
    // 32 current left scroll
    // 2500 - 32 = 2468 x distance
    const MAX_LEFT_SIZE = window.document.body.scrollWidth - window.innerWidth;
    const CURRENT_SCROLL_LEFT = window.scrollX;
    const MAX_DISTANCE = MAX_LEFT_SIZE - CURRENT_SCROLL_LEFT;

    this._movingRightSubscription = distance(MAX_DISTANCE, 1000)
      .pipe(map((x) => CURRENT_SCROLL_LEFT + x))
      .subscribe({
        next: (left) => {
          window.scroll({
            left,
          });
        },
        complete: () => {
          window.scroll({
            left: MAX_LEFT_SIZE,
          });

          this._movingRightSubscription?.unsubscribe();
          this._movingRightSubscription = null;
        },
      });
  }

  private _stopMovingRight() {
    this._movingRightSubscription?.unsubscribe();
    this._movingRightSubscription = null;
  }

  private _isInLeftBorder(positionX: number) {
    return positionX <= 16 && window.scrollX > 0;
  }

  private _moveLeft() {
    const CURRENT_SCROLL_LEFT = window.scrollX;

    this._movingLeftSubscription = distance(CURRENT_SCROLL_LEFT, 1000)
      .pipe(map((x) => CURRENT_SCROLL_LEFT - x))
      .subscribe({
        next: (left) => {
          window.scroll({
            left,
          });
        },
        complete: () => {
          window.scroll({
            left: 0,
          });
        },
      });
  }

  private _stopMovingLeft() {
    this._movingLeftSubscription?.unsubscribe();
    this._movingLeftSubscription = null;
  }

  private _isInBottomBorder(positionY: number) {
    return (
      Math.ceil(window.innerHeight - positionY) <= 16 &&
      Math.ceil(window.scrollY + window.innerHeight) <
        window.document.body.scrollHeight
    );
  }

  private _moveBottom() {
    // 5000 total of the board
    // 600 inner height (window size)
    // 5000 - 600 = 4400 max to the bottom
    // 32 current left scroll
    // 4400 - 32 = 4368 x distance
    const MAX_BOTTOM_SIZE =
      window.document.body.scrollHeight - window.innerHeight;
    const CURRENT_SCROLL_BOTTOM = window.scrollY;
    const MAX_DISTANCE = MAX_BOTTOM_SIZE - CURRENT_SCROLL_BOTTOM;

    this._movingBottomSubscription = distance(MAX_DISTANCE, 1000)
      .pipe(map((x) => CURRENT_SCROLL_BOTTOM + x))
      .subscribe({
        next: (top) => {
          window.scroll({
            top,
          });
        },
        complete: () => {
          window.scroll({
            top: MAX_BOTTOM_SIZE,
          });
        },
      });
  }

  private _stopMovingBottom() {
    this._movingBottomSubscription?.unsubscribe();
    this._movingBottomSubscription = null;
  }

  private _isInTopBorder(positionY: number) {
    return positionY <= 16 && window.scrollY > 0;
  }

  private _moveTop() {
    const CURRENT_SCROLL_TOP = window.scrollY;

    this._movingTopSubscription = distance(CURRENT_SCROLL_TOP, 1000)
      .pipe(map((x) => CURRENT_SCROLL_TOP - x))
      .subscribe({
        next: (top) => {
          window.scroll({
            top,
          });
        },
        complete: () => {
          window.scroll({
            top: 0,
          });
        },
      });
  }

  private _stopMovingTop() {
    this._movingTopSubscription?.unsubscribe();
    this._movingTopSubscription = null;
  }
}
