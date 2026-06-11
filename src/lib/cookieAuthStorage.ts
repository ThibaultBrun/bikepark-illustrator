// Stockage de session Supabase partagé entre les sous-domaines *.pista.bike
// via un cookie (Domain=.pista.bike), avec repli localStorage (migration des
// sessions existantes + robustesse si les cookies sont indisponibles).
//
// Les deux apps (Pista et l'illustrator) utilisent la même URL Supabase, donc
// la même storageKey par défaut : il suffit de partager le même cookie.

const SHARE_DOMAIN = 'pista.bike'
const CHUNK = 3000 // taille brute par cookie (encodé < 4 Ko avec le nom/attrs)

function cookieDomain(): string | null {
  try {
    const h = location.hostname
    return h === SHARE_DOMAIN || h.endsWith('.' + SHARE_DOMAIN) ? '.' + SHARE_DOMAIN : null
  } catch {
    return null
  }
}

function setCookie(name: string, rawValue: string) {
  const d = cookieDomain()
  document.cookie =
    `${name}=${encodeURIComponent(rawValue)}; Path=/; Max-Age=31536000; Secure; SameSite=Lax` +
    (d ? `; Domain=${d}` : '')
}

function delCookie(name: string) {
  const d = cookieDomain()
  document.cookie =
    `${name}=; Path=/; Max-Age=0; Secure; SameSite=Lax` + (d ? `; Domain=${d}` : '')
}

function getCookie(name: string): string | null {
  const all = document.cookie ? document.cookie.split('; ') : []
  for (const c of all) {
    const eq = c.indexOf('=')
    if (eq > -1 && c.slice(0, eq) === name) return decodeURIComponent(c.slice(eq + 1))
  }
  return null
}

function readChunked(key: string): string | null {
  const single = getCookie(key)
  if (single !== null) return single
  let i = 0
  let out = ''
  let found = false
  for (;;) {
    const c = getCookie(`${key}.${i}`)
    if (c === null) break
    out += c
    found = true
    i++
  }
  return found ? out : null
}

function clearChunked(key: string) {
  delCookie(key)
  let i = 0
  while (getCookie(`${key}.${i}`) !== null) {
    delCookie(`${key}.${i}`)
    i++
  }
}

function writeChunked(key: string, value: string) {
  clearChunked(key)
  if (value.length <= CHUNK) {
    setCookie(key, value)
    return
  }
  for (let i = 0, p = 0; p < value.length; p += CHUNK, i++) {
    setCookie(`${key}.${i}`, value.slice(p, p + CHUNK))
  }
}

export const sharedAuthStorage = {
  getItem(key: string): string | null {
    const fromCookie = readChunked(key)
    if (fromCookie !== null) return fromCookie
    // Migration paresseuse : une session existe en localStorage mais pas encore
    // dans le cookie partagé → on sème le cookie pour activer le SSO de suite.
    let local: string | null = null
    try {
      local = window.localStorage.getItem(key)
    } catch {
      local = null
    }
    if (local !== null) writeChunked(key, local)
    return local
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
    writeChunked(key, value)
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
    clearChunked(key)
  },
}
