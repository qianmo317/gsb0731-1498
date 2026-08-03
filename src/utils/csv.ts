/**
 * CSV 导出工具
 *
 * 纯前端生成并下载 CSV，无第三方依赖。
 */

// 转义单个 CSV 字段：含逗号、引号、换行时用双引号包裹并转义内部引号
const escapeCell = (value: string | number): string => {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * 将表头与行数据拼成 CSV 文本。
 */
export const toCsv = (headers: string[], rows: Array<Array<string | number>>): string => {
  const headerLine = headers.map(escapeCell).join(',')
  const bodyLines = rows.map(row => row.map(escapeCell).join(','))
  return [headerLine, ...bodyLines].join('\n')
}

/**
 * 触发浏览器下载 CSV 文件。
 * 加 UTF-8 BOM 以便 Excel 正确识别中文。
 */
export const downloadCsv = (filename: string, content: string): void => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
