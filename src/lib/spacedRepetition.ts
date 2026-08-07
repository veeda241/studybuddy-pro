export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface Sm2State {
  ease: number;
  interval: number;
  repetitions: number;
  dueAt: number;
  lastReviewedAt: number;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export const RATING_TO_QUALITY: Record<ReviewRating, ReviewQuality> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Classic SM-2 spaced repetition update. */
export function applySm2(
  current: Pick<Sm2State, 'ease' | 'interval' | 'repetitions'>,
  quality: ReviewQuality,
  now = Date.now()
): Sm2State {
  let { ease, interval, repetitions } = current;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.max(1, Math.round(interval * ease));
    }
    repetitions += 1;
  }

  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  if (quality === 3) {
    interval = Math.max(1, Math.round(interval * 1.2));
  } else if (quality === 5 && repetitions > 1) {
    interval = Math.max(1, Math.round(interval * 1.3));
  }

  return {
    ease: Math.round(ease * 100) / 100,
    interval,
    repetitions,
    dueAt: now + interval * DAY_MS,
    lastReviewedAt: now,
  };
}

export function reviewWithRating(
  current: Pick<Sm2State, 'ease' | 'interval' | 'repetitions'>,
  rating: ReviewRating,
  now = Date.now()
): Sm2State {
  return applySm2(current, RATING_TO_QUALITY[rating], now);
}
