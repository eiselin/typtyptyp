/**
 * Triggers a JSON file download containing all profile data.
 * @param {object[]} profileList - array of profile objects
 * @param {string} langCode - current language code
 */
export function exportProfiles(profileList, langCode) {
  const data = {
    version: 1,
    exportedAt: Date.now(),
    lang: langCode,
    profiles: profileList,
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `typtyptyp-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Reads and validates a backup JSON file.
 * @param {File} file
 * @returns {Promise<object[]>} resolves with valid profile array
 * @throws {'noProfiles'} if file has no valid profiles
 * @throws {'invalid'} if file is malformed
 */
export function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!Array.isArray(data?.profiles)) { reject(new Error('invalid')); return }
        const valid = data.profiles.filter(p => p?.id && p?.name && p?.lessonProgress)
        if (valid.length === 0) { reject(new Error('noProfiles')); return }
        resolve(valid)
      } catch {
        reject(new Error('invalid'))
      }
    }
    reader.readAsText(file)
  })
}
