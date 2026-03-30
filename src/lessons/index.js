// Finger IDs: lp=left pinky, lr=left ring, lm=left middle, li=left index
//             ri=right index, rm=right middle, rr=right ring, rp=right pinky
export const FINGER_MAP = {
  '1':'lp','2':'lr','3':'lm','4':'li','5':'li','6':'ri','7':'ri','8':'rm','9':'rr','0':'rp',
  'q':'lp','w':'lr','e':'lm','r':'li','t':'li','y':'ri','u':'ri','i':'rm','o':'rr','p':'rp',
  'a':'lp','s':'lr','d':'lm','f':'li','g':'li','h':'ri','j':'ri','k':'rm','l':'rr',';':'rp',
  'z':'lp','x':'lr','c':'lm','v':'li','b':'li','n':'ri','m':'ri',',':'rm','.':'rr','/':'rp',
}

export const LESSONS = [
  { id:1,  group:'thuisrij', keys:['f','j'],         label:'F J' },
  { id:2,  group:'thuisrij', keys:['d','k'],         label:'D K' },
  { id:3,  group:'thuisrij', keys:['s','l'],         label:'S L' },
  { id:4,  group:'thuisrij', keys:['a'],              label:'A' },
  { id:5,  group:'thuisrij', keys:['a','s','d','f','g','h','j','k','l'],     label:'ASDFGHJKL' },
  { id:6,  group:'bovenrij', keys:['r','u'],         label:'R U' },
  { id:7,  group:'bovenrij', keys:['e','i'],         label:'E I' },
  { id:8,  group:'bovenrij', keys:['w','o'],         label:'W O' },
  { id:9,  group:'bovenrij', keys:['q','p'],         label:'Q P' },
  { id:10, group:'bovenrij', keys:['q','w','e','r','t','y','u','i','o','p'], label:'QWERTYUIOP' },
  { id:11, group:'onderrij', keys:['v','m'],         label:'V M' },
  { id:12, group:'onderrij', keys:['c'],              label:'C' },
  { id:13, group:'onderrij', keys:['x'],              label:'X' },
  { id:14, group:'onderrij', keys:['z'],              label:'Z' },
  { id:15, group:'volledig', keys:Object.keys(FINGER_MAP).filter(k => /^[a-z]$/.test(k)), label:'VOLLEDIG', labelKey:'lessons.label.volledig' },
]

/** Returns all keys introduced in lessons 1..lessonId (cumulative, deduped). */
export function getLearnedKeys(lessonId) {
  const keys = new Set()
  for (const lesson of LESSONS) {
    if (lesson.id > lessonId) break
    for (const k of lesson.keys) keys.add(k)
  }
  return [...keys]
}

export function getFingerForKey(key) {
  return FINGER_MAP[key.toLowerCase()] ?? null
}

/**
 * Returns the single recommended lesson for the given profile.
 * Steps (in order):
 *   1. No data yet → lessons[0]
 *   2. Lowest lesson with a struggling newly-introduced key (accuracy < 0.95, ≥5 presses)
 *   3. Lowest unplayed lesson (0 stars)
 *   4. Lesson with lowest bestAccuracy (most room to improve)
 */
export function getRecommendedLesson(profile, lessons) {
  const lessonProgress = profile?.lessonProgress ?? {}
  const keyStats = profile?.keyStats ?? {}

  // Step 1: No data yet
  const hasKeyData = Object.values(keyStats).some(arr => Array.isArray(arr) && arr.length >= 5)
  if (!hasKeyData) return lessons[0]

  // Step 2: Lowest lesson with a struggling key
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i]
    const prevId = i > 0 ? lessons[i - 1].id : 0
    const currentKeys = new Set(getLearnedKeys(lesson.id))
    const prevKeys = new Set(getLearnedKeys(prevId))
    const newKeys = [...currentKeys].filter(k => !prevKeys.has(k))

    for (const key of newKeys) {
      const results = keyStats[key]
      if (!results || results.length < 5) continue
      const accuracy = results.filter(Boolean).length / results.length
      if (accuracy < 0.95) return lesson
    }
  }

  // Step 3: First unplayed lesson
  for (const lesson of lessons) {
    if ((lessonProgress[lesson.id]?.stars ?? 0) === 0) return lesson
  }

  // Step 4: Lesson with lowest bestAccuracy
  let worst = lessons[0]
  for (const lesson of lessons) {
    const acc = lessonProgress[lesson.id]?.bestAccuracy ?? 0
    const worstAcc = lessonProgress[worst.id]?.bestAccuracy ?? 0
    if (acc < worstAcc) worst = lesson
  }
  return worst
}

export const FINGER_VARS = {
  lp:'var(--f-lp)', lr:'var(--f-lr)', lm:'var(--f-lm)', li:'var(--f-li)',
  ri:'var(--f-ri)', rm:'var(--f-rm)', rr:'var(--f-rr)', rp:'var(--f-rp)',
}
