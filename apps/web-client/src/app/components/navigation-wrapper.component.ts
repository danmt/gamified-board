import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { map, Subscription } from 'rxjs';
import { distance } from '../utils';
import { BOARD_SIZE } from './board.component';

@Component({
  selector: 'pg-navigation-wrapper',
  template: `
    <div
      class="fixed w-4 h-4"
      [ngClass]="zPosition"
      (mouseenter)="onMoveLeft(); onMoveTop()"
      (mouseleave)="onStopMoveLeft(); onStopMoveTop()"
    ></div>
    <div
      class="fixed w-4 h-4 right-0"
      [ngClass]="zPosition"
      (mouseenter)="onMoveRight(); onMoveTop()"
      (mouseleave)="onStopMoveRight(); onStopMoveTop()"
    ></div>
    <div
      class="fixed w-4 h-4 bottom-0"
      [ngClass]="zPosition"
      (mouseenter)="onMoveLeft(); onMoveBottom()"
      (mouseleave)="onStopMoveLeft(); onStopMoveBottom()"
    ></div>
    <div
      class="fixed w-4 h-4 right-0 bottom-0"
      [ngClass]="zPosition"
      (mouseenter)="onMoveRight(); onMoveBottom()"
      (mouseleave)="onStopMoveRight(); onStopMoveBottom()"
    ></div>

    <div
      class="fixed w-4 h-screen"
      [ngClass]="zPosition"
      (mouseenter)="onMoveLeft()"
      (mouseleave)="onStopMoveLeft()"
    ></div>
    <div
      class="fixed w-4 h-screen right-0"
      [ngClass]="zPosition"
      (mouseenter)="onMoveRight()"
      (mouseleave)="onStopMoveRight()"
    ></div>
    <div
      class="fixed w-screen h-4"
      [ngClass]="zPosition"
      (mouseenter)="onMoveTop()"
      (mouseleave)="onStopMoveTop()"
    ></div>
    <div
      class="fixed w-screen h-4 bottom-0"
      [ngClass]="zPosition"
      (mouseenter)="onMoveBottom()"
      (mouseleave)="onStopMoveBottom()"
    ></div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class NavigationWrapperComponent {
  @Input() zPosition = 'z-10';
  moveRightSubscription: Subscription | null = null;
  moveLeftSubscription: Subscription | null = null;
  moveTopSubscription: Subscription | null = null;
  moveBottomSubscription: Subscription | null = null;

  onMoveRight() {
    // 8000 total of the board
    // 1500 inner width (window size)
    // 8000 - 1500 = 2500 max to the left
    // 32 current left scroll
    // 2500 - 32 = 2468 x distance
    const MAX_LEFT_SIZE = BOARD_SIZE - window.innerWidth;
    const CURRENT_SCROLL_LEFT = window.scrollX;
    const MAX_DISTANCE = MAX_LEFT_SIZE - CURRENT_SCROLL_LEFT;

    this.moveRightSubscription = distance(MAX_DISTANCE, 1000)
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
        },
      });
  }

  onStopMoveRight() {
    this.moveRightSubscription?.unsubscribe();
  }

  onMoveLeft() {
    const CURRENT_SCROLL_LEFT = window.scrollX;

    this.moveLeftSubscription = distance(CURRENT_SCROLL_LEFT, 1000)
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

  onStopMoveLeft() {
    this.moveLeftSubscription?.unsubscribe();
  }

  onMoveTop() {
    const CURRENT_SCROLL_TOP = window.scrollY;

    this.moveTopSubscription = distance(CURRENT_SCROLL_TOP, 1000)
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

  onStopMoveTop() {
    this.moveTopSubscription?.unsubscribe();
  }

  onMoveBottom() {
    // 8000 total of the board
    // 1500 inner width (window size)
    // 8000 - 1500 = 2500 max to the left
    // 32 current left scroll
    // 2500 - 32 = 2468 x distance
    const MAX_TOP_SIZE = BOARD_SIZE - window.innerHeight;
    const CURRENT_SCROLL_TOP = window.scrollY;
    const MAX_DISTANCE = MAX_TOP_SIZE - CURRENT_SCROLL_TOP;

    this.moveBottomSubscription = distance(MAX_DISTANCE, 1000)
      .pipe(map((x) => CURRENT_SCROLL_TOP + x))
      .subscribe({
        next: (top) => {
          window.scroll({
            top,
          });
        },
        complete: () => {
          window.scroll({
            top: MAX_TOP_SIZE,
          });
        },
      });
  }

  onStopMoveBottom() {
    this.moveBottomSubscription?.unsubscribe();
  }
}
