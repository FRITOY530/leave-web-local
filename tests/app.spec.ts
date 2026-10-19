import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('matches the supplied detail view and keeps local-only leave behavior', async ({ page }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('hnuit.edu.cn')) externalRequests.push(request.url())
  })

  await mkdir('artifacts', { recursive: true })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(page.getByRole('button', { name: '新建请假' })).toBeVisible()
  await page.getByRole('button', { name: '新建请假' }).click()
  await page.getByRole('button', { name: '提交' }).click()
  await expect(page.getByText('请选择请假性质')).toBeVisible()

  await page.getByRole('button', { name: '请假性质' }).click()
  await page.getByRole('button', { name: '因私请假', exact: true }).click()
  await page.getByRole('button', { name: '请假类型' }).click()
  await page.getByRole('button', { name: '事假', exact: true }).click()
  await page.getByLabel('请假事由').fill('本地网页功能测试')
  await page.getByLabel('手机号').fill('13800138000')
  await page.getByLabel('请假开始时间').fill('2026-10-20T08:00')
  await page.getByLabel('请假结束时间').fill('2026-10-20T18:00')
  await page.getByRole('button', { name: '请假去向' }).click()
  await page.getByRole('button', { name: '离开本市不离开本省', exact: true }).click()
  await page.getByLabel('请假去向(具体地址)').fill('本地测试地址')
  await page.getByRole('button', { name: '是否在校外过夜' }).click()
  await page.getByRole('button', { name: '否', exact: true }).click()

  await page.getByRole('button', { name: '提交' }).click()
  await expect(page.getByText('本地模拟记录已保存')).toBeVisible()
  await expect(page.getByText('审核中').first()).toBeVisible()

  await page.getByRole('button', { name: '查看事假详情' }).first().click()

  await expect(page.locator('#sfxj')).toHaveText('审核中')
  for (const label of [
    '请假性质',
    '请假类型',
    '请假天数',
    '请假事由',
    '证明材料',
    '手机号',
    '请假开始时间',
    '请假结束时间',
    '请假去向',
    '去向地区',
    '请假去向(具体地址)',
    '是否在校外过夜',
    '家长知情同意佐证材料 (0/0)',
    '审核流程',
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
  }

  for (const hiddenLabel of ['请假日期', '学生编号', 'WID', '申请编号', '审核状态']) {
    await expect(page.getByText(hiddenLabel, { exact: true })).toBeHidden()
  }

  await expect(page.getByText('本地网页功能测试')).toBeVisible()
  await expect(page.getByText('13800138000')).toBeVisible()
  await expect(page.getByText('本地测试地址')).toBeVisible()
  await expect(page.getByText('未上传')).toBeVisible()
  await expect(page.getByText('提交申请', { exact: true })).toBeVisible()
  await expect(page.getByText('辅导员审核', { exact: true })).toBeVisible()

  const statusBox = await page.locator('.sfxj-class').boundingBox()
  const firstRowBox = await page.locator('.emapm-item').first().boundingBox()
  expect(statusBox?.y).toBeCloseTo(13, 0)
  expect(statusBox?.height).toBeCloseTo(35, 0)
  expect(firstRowBox?.x).toBeCloseTo(20, 0)
  expect(firstRowBox?.y).toBeCloseTo(58, 0)
  expect(firstRowBox?.width).toBeCloseTo(370, 0)
  expect(firstRowBox?.height).toBeCloseTo(28, 0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.screenshot({ path: 'artifacts/leave-detail-reference-390.png', fullPage: true })

  await page.goto('/#/records')
  await expect(page.getByText('本地网页功能测试')).toBeVisible()

  const stored = await page.evaluate(() => localStorage.getItem('leave-web-local-records'))
  expect(stored).toContain('本地网页功能测试')
  expect(stored).toContain('审核中')

  await page.goto('/#/detail/sample-1')
  await page.reload()
  const proofBox = await page.locator('.bh-upload-wrap').boundingBox()
  const parentBox = await page.locator('.parent-material-item').boundingBox()
  const auditBox = await page.locator('.audit-container').boundingBox()
  expect(proofBox?.y).toBeCloseTo(170.21875, 3)
  expect(proofBox?.height).toBeCloseTo(114.21875, 3)
  expect(parentBox?.y).toBeCloseTo(509.3125, 3)
  expect(parentBox?.height).toBeCloseTo(124, 3)
  expect(auditBox?.y).toBeCloseTo(664.3125, 3)
  await expect(page.locator('.mint-step')).toHaveCount(6)
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(1154)
  expect(externalRequests).toEqual([])
})
