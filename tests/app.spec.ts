import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('validates, saves locally, and keeps the mobile layout usable', async ({ page }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('hnuit.edu.cn')) externalRequests.push(request.url())
  })

  await mkdir('artifacts', { recursive: true })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(page.getByRole('button', { name: '新建请假' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.getByRole('button', { name: '新建请假' }).click()
  await expect(page.getByText('请假信息', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: '提交' }).click()
  await expect(page.getByText('请选择请假性质')).toBeVisible()
  await expect(page.getByText('请输入正确的手机号')).toBeVisible()

  await page.getByRole('button', { name: '请假性质' }).click()
  await page.getByRole('button', { name: '事假', exact: true }).click()
  await page.getByRole('button', { name: '请假类型' }).click()
  await page.getByRole('button', { name: '因私', exact: true }).click()
  await page.getByLabel('请假事由').fill('本地网页功能测试')
  await page.getByLabel('手机号').fill('13800138000')
  await page.getByLabel('请假开始时间').fill('2026-10-20T08:00')
  await page.getByLabel('请假结束时间').fill('2026-10-20T18:00')
  await page.getByRole('button', { name: '请假去向' }).click()
  await page.getByRole('button', { name: '校外', exact: true }).click()
  await page.getByLabel('请假去向（具体地址）').fill('本地测试地址')
  await page.getByRole('button', { name: '是否在校外过夜' }).click()
  await page.getByRole('button', { name: '否', exact: true }).click()

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'artifacts/leave-form-390.png', fullPage: true })

  await page.getByRole('button', { name: '提交' }).click()
  await expect(page.getByText('本地模拟记录已保存')).toBeVisible()
  await expect(page.getByText('本地网页功能测试')).toBeVisible()

  await page.screenshot({ path: 'artifacts/leave-records-390.png', fullPage: true })
  await page.reload()
  await expect(page.getByText('本地网页功能测试')).toBeVisible()

  const stored = await page.evaluate(() => localStorage.getItem('leave-web-local-records'))
  expect(stored).toContain('本地网页功能测试')
  expect(externalRequests).toEqual([])
})
