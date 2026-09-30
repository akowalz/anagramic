// https://bost.ocks.org/mike/shuffle/
export function shuffle<T>(array: Array<T>): Array<T> {
  let m = array.length, t, i;

  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

/*
 * Shuffle a copy of the array, leaving locked items at their current index.
 * The unlocked items are shuffled among the remaining indices.
 */
export function shuffleUnlocked<T>(
  array: Array<T>,
  isLocked: (item: T, index: number) => boolean,
): Array<T> {
  const unlockedIndices = array.flatMap((item, index) =>
    isLocked(item, index) ? [] : [index],
  )
  const shuffled = shuffle(unlockedIndices.map((index) => array[index]))

  const result = [...array]
  unlockedIndices.forEach((index, i) => {
    result[index] = shuffled[i]
  })

  return result
}
