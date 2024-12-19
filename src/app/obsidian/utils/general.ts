export function padLefZero(str: string | any[]) {
  return (`00${str}`).substr(str.length)
}
