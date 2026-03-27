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
  { id:4,  group:'thuisrij', keys:['a',';'],         label:'A' },
  { id:5,  group:'thuisrij', keys:['a','s','d','f','g','h','j','k','l',';'], label:'ASDFGHJKL' },
  { id:6,  group:'bovenrij', keys:['r','u'],         label:'R U' },
  { id:7,  group:'bovenrij', keys:['e','i'],         label:'E I' },
  { id:8,  group:'bovenrij', keys:['w','o'],         label:'W O' },
  { id:9,  group:'bovenrij', keys:['q','p'],         label:'Q P' },
  { id:10, group:'bovenrij', keys:['q','w','e','r','t','y','u','i','o','p'], label:'QWERTYUIOP' },
  { id:11, group:'onderrij', keys:['v','m'],         label:'V M' },
  { id:12, group:'onderrij', keys:['c',','],         label:'C' },
  { id:13, group:'onderrij', keys:['x','.'],         label:'X' },
  { id:14, group:'onderrij', keys:['z','/'],         label:'Z' },
  { id:15, group:'volledig', keys:Object.keys(FINGER_MAP).filter(k => !'1234567890'.includes(k)), label:'VOLLEDIG' },
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
