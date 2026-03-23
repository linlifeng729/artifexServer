/**
 * @description 获取当前时间戳（秒）
 * @returns {string} 当前时间戳（秒）
 */
export function getCurrentTimestamp(): string {
  return `${Math.floor(new Date().getTime() / 1000)}`
}