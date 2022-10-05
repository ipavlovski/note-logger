const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`


export type ClientError = { error: string }

export default class Client {
  // static ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i

  // should match inferred prisma types, parsed through reviver
  static async get<T>(route: string): Promise<T> {
    return await fetch(`${SERVER_URL}${route}`).then((val) => val.json())
  }

  static async safeGet<T>(route: string): Promise<T | ClientError> {
    return await fetch(`${SERVER_URL}${route}`).then((val) => val.json())
  }


  static async post<T, R>(route: string, body: T): Promise<R> {
    return await fetch(`${SERVER_URL}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((val) => val.json())
  }

  static async put<T, R>(route: string, body: T): Promise<R> {
    return await fetch(`${SERVER_URL}${route}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    }).then((val) => val.json())
  }

  static async upload(route: string, body: FormData): Promise<{ path: string }> {
    return await fetch(`${SERVER_URL}${route}`, { method: 'POST', body }).then((val) => val.json())
  }

  static async delete<T, R>(route: string, body: T): Promise<R> {
    return await fetch(`${SERVER_URL}${route}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((val) => val.json())
  }

}
