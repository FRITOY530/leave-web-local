import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { Camera, Check, ChevronRight, ClipboardList } from 'lucide-react'
import proofPreview from './assets/proof-preview.svg'
import parentPreview from './assets/parent-preview.svg'
import RecordList from './RecordList'
import './App.css'

type Page = 'records' | 'form' | 'detail'
type SelectField = 'nature' | 'type' | 'destination' | 'overnight'
type DateField = 'start' | 'end'

type AuditStep = {
  time?: string
  title: string
  result?: string
  reviewer?: string
  opinion?: string
}

type LeaveRecord = {
  id: string
  applicationNumber: string
  nature: string
  type: string
  reason: string
  start: string
  end: string
  days: number
  destination: string
  address: string
  overnight: string
  phone: string
  proofName: string
  submittedAt: string
  status: string
  studentNumber: string
  wid: string
  auditStatus: string
  proofCount: string
  destinationRegion: string
  parentAttachmentName: string
  parentAttachmentSize: string
  auditSteps: AuditStep[]
}

type LeaveForm = {
  nature: string
  type: string
  days: string
  reason: string
  phone: string
  start: string
  end: string
  destination: string
  address: string
  overnight: string
  proofName: string
}

const STORAGE_KEY = 'leave-web-local-records'
const COUNSELOR_REVIEWER = '201620012-黄渊健'
const initialRecords: LeaveRecord[] = [
  {
    id: 'sample-1',
    applicationNumber: 'LOCAL-20261009-0001',
    nature: '因私请假',
    type: '事假',
    reason: '个人事务，需要请假。次日上午返校',
    start: '2026-10-25T08:00',
    end: '2026-10-26T08:00',
    days: 1,
    destination: '离开本市不离开本省',
    address: '本地示例地址',
    overnight: '是',
    phone: '138****0000',
    proofName: 'proof-example.jpg',
    submittedAt: '2026-10-24T13:17:09',
    status: '已通过',
    studentNumber: '2023LOCAL001',
    wid: 'LOCAL-WID-0001',
    auditStatus: '已通过',
    proofCount: '1/0',
    destinationRegion: '示例省/示例市/示例区',
    parentAttachmentName: 'Screenshot_2026-10-24-13-14-18-675_local.example.jpg',
    parentAttachmentSize: '376KB',
    auditSteps: [
      { time: '2026-10-24 13:17:09', title: '提交申请' },
      { time: '2026-10-24 16:04:08', title: '辅导员审核', result: '通过', reviewer: COUNSELOR_REVIEWER, opinion: '同意' },
      { title: '院系审核' },
      { title: '学校审核' },
      { title: '校领导审核' },
      { title: '结束' },
    ],
  },
]

initialRecords.push({
  ...initialRecords[0],
  id: 'sample-2',
  applicationNumber: 'LOCAL-20260929-0002',
  wid: 'LOCAL-WID-0002',
  reason: '回家',
  start: '2026-09-29T10:55',
  end: '2026-09-30T10:55',
  submittedAt: '2026-09-29T10:58:00',
  status: '已销假',
  parentAttachmentName: 'Screenshot_2026-09-29-10-57-04-588_local.example.jpg',
  parentAttachmentSize: '390KB',
  auditSteps: [
    { time: '2026-09-29 10:58:00', title: '提交申请' },
    { time: '2026-09-29 11:20:00', title: '辅导员审核', result: '通过', reviewer: COUNSELOR_REVIEWER, opinion: '同意' },
    { title: '院系审核' }, { title: '学校审核' }, { title: '校领导审核' }, { title: '结束' },
  ],
})

const initialForm: LeaveForm = {
  nature: '',
  type: '',
  days: '',
  reason: '',
  phone: '',
  start: '',
  end: '',
  destination: '',
  address: '',
  overnight: '',
  proofName: '',
}

const options: Record<SelectField, string[]> = {
  nature: ['因私请假', '因病请假', '公假'],
  type: ['事假', '病假', '其他'],
  destination: ['离开本市不离开本省', '离开本省', '校内'],
  overnight: ['是', '否'],
}

const labels: Record<SelectField, string> = {
  nature: '请假性质',
  type: '请假类型',
  destination: '请假去向',
  overnight: '是否在校外过夜',
}

function readRecords(): LeaveRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialRecords
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.map(normalizeRecord) : initialRecords
  } catch {
    return initialRecords
  }
}

function normalizeRecord(record: Partial<LeaveRecord>): LeaveRecord {
  const start = record.start ?? ''
  const end = record.end ?? ''
  const auditSteps = (record.auditSteps ?? [
    { time: record.submittedAt, title: '提交申请' },
    { title: '辅导员审核' },
    { title: '院系审核' },
    { title: '学校审核' },
    { title: '校领导审核' },
    { title: '结束' },
  ]).map((step) => step.title === '辅导员审核'
    ? { ...step, result: step.result ?? '通过', reviewer: COUNSELOR_REVIEWER, opinion: step.opinion ?? '同意' }
    : step)
  return {
    id: record.id ?? crypto.randomUUID(),
    applicationNumber: record.applicationNumber ?? 'LOCAL-UNKNOWN',
    nature: record.nature ?? '因私请假',
    type: record.type ?? '事假',
    reason: record.reason ?? '',
    start,
    end,
    days: record.days ?? calculateDays(start, end),
    destination: record.destination ?? '',
    address: record.address ?? '',
    overnight: record.overnight ?? '',
    phone: record.phone ?? '',
    proofName: record.proofName ?? '',
    submittedAt: record.submittedAt ?? start,
    status: record.status ?? '审核中',
    studentNumber: record.studentNumber ?? '2023LOCAL000',
    wid: record.wid ?? `LOCAL-WID-${(record.id ?? 'NEW').slice(0, 8).toUpperCase()}`,
    auditStatus: record.auditStatus ?? record.status ?? '审核中',
    proofCount: record.proofCount ?? (record.proofName ? '1/0' : '0/0'),
    destinationRegion: record.destinationRegion ?? '示例省/示例市/示例区',
    parentAttachmentName: record.parentAttachmentName ?? '',
    parentAttachmentSize: record.parentAttachmentSize ?? '',
    auditSteps,
  }
}

function saveRecords(records: LeaveRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function dateOnly(value: string) {
  return value ? value.slice(0, 10) : '未设置'
}

function formatDateTime(value: string) {
  if (!value) return '未设置'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replaceAll('/', '-')
}

function getRoute(): { page: Page; recordId: string | null } {
  const hash = window.location.hash
  if (hash === '#/new') return { page: 'form', recordId: null }
  if (hash.startsWith('#/detail/')) {
    try {
      return { page: 'detail', recordId: decodeURIComponent(hash.slice('#/detail/'.length)) }
    } catch {
      return { page: 'detail', recordId: null }
    }
  }
  return { page: 'records', recordId: null }
}

function createApplicationNumber() {
  return `LOCAL-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().replaceAll('-', '').slice(0, 4).toUpperCase()}`
}

function calculateDays(start: string, end: string) {
  if (!start || !end) return 0
  const diff = new Date(end).getTime() - new Date(start).getTime()
  if (diff <= 0) return 0
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)))
}

function App() {
  const [{ page, recordId: selectedRecordId }, setRoute] = useState(getRoute)
  const [records, setRecords] = useState<LeaveRecord[]>(readRecords)
  const [form, setForm] = useState<LeaveForm>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveForm, string>>>({})
  const [activeSelect, setActiveSelect] = useState<SelectField | null>(null)
  const [savedMessage, setSavedMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null)

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const syncRoute = () => {
      setRoute(getRoute())
      setNotice('')
      setActiveSelect(null)
      document.getElementById('root')?.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  const updateForm = (key: keyof LeaveForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const updateDate = (key: DateField, value: string) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      const days = calculateDays(next.start, next.end)
      return { ...next, days: days ? String(days) : '' }
    })
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const openDetail = (record: LeaveRecord) => {
    setSavedMessage('')
    window.location.hash = `/detail/${encodeURIComponent(record.id)}`
  }

  const closeDetail = () => {
    window.location.hash = '/records'
  }

  const openForm = () => {
    if (records.some((record) => ['审核中', '已通过'].includes(record.status))) {
      setNotice('存在待审核或未销假的请假记录，不可继续请假!')
      return
    }
    setSavedMessage('')
    setErrors({})
    setForm(initialForm)
    window.location.hash = '/new'
  }

  const completeLeave = () => {
    if (!confirmLeaveId) return
    const next = records.map((record) => record.id === confirmLeaveId
      ? { ...record, status: '已销假', auditStatus: '已销假' }
      : record)
    saveRecords(next)
    setRecords(next)
    setConfirmLeaveId(null)
    setNotice('已销假')
  }

  const validate = () => {
    const next: Partial<Record<keyof LeaveForm, string>> = {}
    if (!form.nature) next.nature = '请选择请假性质'
    if (!form.type) next.type = '请选择请假类型'
    if (!form.reason.trim()) next.reason = '请填写请假事由'
    if (!/^1\d{10}$/.test(form.phone.trim())) next.phone = '请输入正确的手机号'
    if (!form.start) next.start = '请选择请假开始时间'
    if (!form.end) next.end = '请选择请假结束时间'
    if (form.start && form.end && new Date(form.end) <= new Date(form.start)) next.end = '结束时间需晚于开始时间'
    if (!form.destination) next.destination = '请选择请假去向'
    if (!form.address.trim()) next.address = '请填写具体地址'
    if (!form.overnight) next.overnight = '请选择是否在校外过夜'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    const id = crypto.randomUUID()
    const submittedAt = new Date().toISOString().slice(0, 16)
    const record: LeaveRecord = {
      id,
      applicationNumber: createApplicationNumber(),
      nature: form.nature,
      type: form.type,
      reason: form.reason.trim(),
      start: form.start,
      end: form.end,
      days: calculateDays(form.start, form.end),
      destination: form.destination,
      address: form.address.trim(),
      overnight: form.overnight,
      phone: form.phone.trim(),
      proofName: form.proofName,
      submittedAt,
      status: '已通过',
      studentNumber: '2023LOCAL000',
      wid: `LOCAL-WID-${id.slice(0, 8).toUpperCase()}`,
      auditStatus: '已通过',
      proofCount: form.proofName ? '1/0' : '0/0',
      destinationRegion: '示例省/示例市/示例区',
      parentAttachmentName: '',
      parentAttachmentSize: '',
      auditSteps: [
        { time: formatDateTime(submittedAt), title: '提交申请' },
        { time: formatDateTime(submittedAt), title: '辅导员审核', result: '通过', reviewer: COUNSELOR_REVIEWER, opinion: '同意' },
        { title: '院系审核' },
        { title: '学校审核' },
        { title: '校领导审核' },
        { title: '结束' },
      ],
    }
    const next = [record, ...records]
    saveRecords(next)
    setRecords(next)
    setSavedMessage('本地模拟记录已保存')
    window.location.hash = '/records'
  }

  return (
    <main className="app-shell">
      {page === 'records' ? (
        <RecordList records={records} message={savedMessage} onCreate={openForm} onOpenDetail={openDetail} />
      ) : page === 'detail' ? (
        <LeaveDetail
          key={selectedRecordId}
          record={records.find((record) => record.id === selectedRecordId || record.applicationNumber === selectedRecordId)}
          onBack={closeDetail}
          onLocate={() => selectedRecordId && setConfirmLeaveId(selectedRecordId)}
        />
      ) : (
        <LeaveFormPage
          form={form}
          errors={errors}
          activeSelect={activeSelect}
          onOpenSelect={setActiveSelect}
          onCloseSelect={() => setActiveSelect(null)}
          onSelect={(key, value) => {
            updateForm(key, value)
            setActiveSelect(null)
          }}
          onChange={updateForm}
          onDateChange={updateDate}
          onFile={(event) => updateForm('proofName', event.target.files?.[0]?.name ?? '')}
          onSubmit={handleSubmit}
        />
      )}
      {confirmLeaveId && <NoticeDialog
        message="确认定位销假吗？"
        onClose={() => setConfirmLeaveId(null)}
        onConfirm={completeLeave}
        confirmLabel="确认销假"
      />}
      {notice && <NoticeDialog message={notice} onClose={() => setNotice('')} />}
    </main>
  )
}

function NoticeDialog({
  message,
  onClose,
  onConfirm,
  confirmLabel = '确定',
}: {
  message: string
  onClose: () => void
  onConfirm?: () => void
  confirmLabel?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal() }, [])
  return (
    <dialog ref={dialog} className="notice-dialog" aria-labelledby="notice-title" onCancel={onClose}>
      <div id="notice-title" className="notice-title">提示</div>
      <div className="notice-message">{message}</div>
      {onConfirm ? (
        <div className="notice-actions">
          <button type="button" className="notice-cancel" onClick={onClose}>取消</button>
          <button type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      ) : <button type="button" onClick={onClose}>{confirmLabel}</button>}
    </dialog>
  )
}

function AttachmentPreview({ src, onClose }: { src: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal() }, [])
  return (
    <dialog ref={dialog} className="attachment-preview" aria-label="附件预览" onCancel={onClose} onClick={onClose}>
      <button className="preview-close" type="button" aria-label="关闭预览" onClick={onClose}>×</button>
      <img src={src} alt="本地示例附件" />
      <span className="preview-counter">1/1</span>
    </dialog>
  )
}

function LeaveDetail({ record, onBack, onLocate }: { record?: LeaveRecord; onBack: () => void; onLocate: () => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  if (!record) {
    return (
      <section className="detail-page">
        <div className="empty-state">
          <ClipboardList aria-hidden="true" size={48} strokeWidth={1.5} />
          <p>未找到请假详情</p>
          <span>该记录可能已经被清空</span>
          <button className="detail-fallback-back" type="button" onClick={onBack}>返回请假记录</button>
        </div>
      </section>
    )
  }

  return (
    <section className="detail-page reference-detail">
      <div className="mint-hr detail-top-line" />
      {record.status === '已销假' && <div className="mint-layout-container sfxj-class">
        <span className="status-ok-icon" aria-hidden="true"><Check size={17} strokeWidth={3} /></span>
        <span id="sfxj">{record.status}</span>
      </div>}

      <div className="emapm-form emapm-form-readonly">
        <div className="mint-cell-group mt-bg-lv2">
          <div className="mint-cell-group-content mint-hairline--top-bottom mt-bg-white">
            <DetailRow label="请假性质" value={record.nature} />
            <DetailRow label="请假类型" value={record.type} />
            <DetailRow className="reference-hidden" label="请假日期" value={`${dateOnly(record.start)} 至 ${dateOnly(record.end)}`} />
            <DetailRow className="reference-hidden" label="请假开始日期" value={dateOnly(record.start)} />
            <DetailRow className="reference-hidden" label="请假结束日期" value={dateOnly(record.end)} />
            <DetailRow label="请假天数" value={String(record.days)} />
            <DetailRow className="reason-row" label="请假事由" value={record.reason} />
            <DetailRow className="reference-hidden" label="学生编号" value={record.studentNumber} />
            <DetailRow className="reference-hidden" label="WID" value={record.wid} />
            <DetailRow className="reference-hidden" label="申请编号" value={record.applicationNumber} />
            <DetailRow className="reference-hidden" label="审核状态" value={record.auditStatus} />

            <div className="emapm-item bh-upload-wrap emapm-uploa-imgs">
              <div className="mint-cell mt-bg-white mint-uploadimgs is-vertical">
                <div className="mint-cell-wrapper">
                  <div className="mint-cell-title"><span className="mint-cell-text">证明材料</span></div>
                  <div className="mint-cell-value"><span /></div>
                </div>
              </div>
              {record.proofName && (
                <button type="button" className="upload_item" aria-label="查看证明材料" onClick={() => setPreview(record.id === 'sample-2' ? parentPreview : proofPreview)}>
                  <img className="upload_img" src={record.id === 'sample-2' ? parentPreview : proofPreview} alt="" />
                </button>
              )}
            </div>

            <DetailRow label="手机号" value={record.phone || '未填写'} />
            <DetailRow label="请假开始时间" value={formatDateTime(record.start)} />
            <DetailRow label="请假结束时间" value={formatDateTime(record.end)} />
            <DetailRow label="请假去向" value={record.destination} />
            <DetailRow label="去向地区" value={record.destinationRegion} />
            <DetailRow label="请假去向(具体地址)" value={record.address || '未填写'} />
            <DetailRow label="是否在校外过夜" value={record.overnight} />

            <div className="emapm-item parent-material-item">
              <div className="__em-attachment-list">
                <p className="__em-attachment-list-title">
                  家长知情同意佐证材料 ({record.parentAttachmentName ? '1/1' : '0/0'})
                </p>
                {record.parentAttachmentName ? (
                  <button className="mint-cell mt-bg-white attachment-button" type="button" aria-label="查看家长知情同意佐证材料" onClick={() => setPreview(parentPreview)}>
                    <div className="mint-cell-wrapper">
                      <div className="mint-cell-title parent-file-title">
                        <img className="__em-img-icon" src={parentPreview} alt="" />
                        <div className="__em-file-info">
                          <p className="__em-file-info_name">{record.parentAttachmentName}</p>
                          <p className="__em-file-info_size"><span>{record.parentAttachmentSize || '未知大小'}</span></p>
                        </div>
                      </div>
                      <div className="mint-cell-value" />
                    </div>
                  </button>
                ) : (
                  <div className="attachment-empty">未上传</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mint-hr" />
      <div className="mint-layout-spacing detail-spacing" />

      <div className="mint-layout-container bh-bg-color-light audit-container">
        <div className="mint-hr" />
        <div className="mint-layout-container audit-header">
          <div className="mint-layout-lr">
            <div className="mint-layout-lr-item mint-layout-container">
              <div className="mint-text">审核流程</div>
            </div>
          </div>
        </div>
        <div className="mint-hr audit-inner-hr" />
        <div className="mint-steps mint-steps--vertical">
          <div className="mint-steps__items mint-steps__items--alone">
            {record.auditSteps.map((step, index) => (
              <div className={`mint-step mint-step--vertical mint-step--finish ${step.result ? 'has-result' : ''}`} key={`${step.title}-${index}`}>
                <div className="mint-step__circle-container"><span className="mint-step__icon"><Check size={16} strokeWidth={1.5} /></span></div>
                <div className="mint-step__line" />
                <div className={`mint-step__time ${index === record.auditSteps.length - 1 ? '' : 'has-slot'}`}>
                  {index > 0 && <div className="mint-step__time-spacer" />}
                  {step.time && <div className="mint-step__time-text">{step.time}</div>}
                </div>
                <div className="mint-step__title">
                  <div className="mint-step__name">{step.title}</div>
                  {step.result && <div className="mint-step__detail">{step.result}</div>}
                  {step.reviewer && <div className="mint-step__detail">审核人：{step.reviewer}</div>}
                  {step.opinion && <pre className="mint-step__detail">审核意见：{step.opinion}</pre>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mint-layout-spacing detail-spacing" />
      {record.status === '已通过' && <button type="button" className="locate-button" onClick={onLocate}>定位销假</button>}
      <div className="mint-layout-spacing detail-spacing" />
      {preview && <AttachmentPreview src={preview} onClose={() => setPreview(null)} />}
    </section>
  )
}

function DetailRow({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`emapm-item ${className}`.trim()}>
      <div className="mint-cell mt-bg-white">
        <div className="mint-cell-wrapper">
          <div className="mint-cell-title"><span className="mint-cell-text">{label}</span></div>
          <div className="mint-cell-value"><div className="em-select-value">{value}</div></div>
        </div>
      </div>
    </div>
  )
}
function LeaveFormPage({
  form,
  errors,
  activeSelect,
  onOpenSelect,
  onCloseSelect,
  onSelect,
  onChange,
  onDateChange,
  onFile,
  onSubmit,
}: {
  form: LeaveForm
  errors: Partial<Record<keyof LeaveForm, string>>
  activeSelect: SelectField | null
  onOpenSelect: (field: SelectField) => void
  onCloseSelect: () => void
  onSelect: (field: SelectField, value: string) => void
  onChange: (key: keyof LeaveForm, value: string) => void
  onDateChange: (key: DateField, value: string) => void
  onFile: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent) => void
}) {
  return (
    <form className="form-page" onSubmit={onSubmit} noValidate>
      <div className="form-section-title">请假信息</div>
      <SelectCell label="请假性质" value={form.nature} required error={errors.nature} onClick={() => onOpenSelect('nature')} />
      <SelectCell label="请假类型" value={form.type} required error={errors.type} onClick={() => onOpenSelect('type')} />
      <div className="form-cell">
        <label htmlFor="days">请假天数</label>
        <input id="days" value={form.days} readOnly placeholder="" aria-label="请假天数" />
      </div>
      <div className={`form-cell textarea-cell ${errors.reason ? 'has-error' : ''}`}>
        <label htmlFor="reason">请假事由<span className="required">*</span></label>
        <textarea id="reason" maxLength={1000} value={form.reason} onChange={(event) => onChange('reason', event.target.value)} placeholder="请输入请假事由" />
        <span className="counter">{form.reason.length}/1000</span>
        {errors.reason && <small className="field-error">{errors.reason}</small>}
      </div>
      <div className="upload-cell">
        <div className="upload-title">证明材料</div>
        <label className="upload-box" htmlFor="proof">
          <Camera aria-hidden="true" size={42} strokeWidth={1.6} />
          <span>{form.proofName || '图片'}</span>
        </label>
        <input id="proof" type="file" accept="image/*,.pdf" onChange={onFile} />
      </div>
      <FieldCell id="phone" label="手机号" required error={errors.phone}>
        <input id="phone" type="tel" inputMode="numeric" value={form.phone} onChange={(event) => onChange('phone', event.target.value)} placeholder="请输入手机号" />
      </FieldCell>
      <DateCell label="请假开始时间" value={form.start} error={errors.start} onChange={(value) => onDateChange('start', value)} />
      <DateCell label="请假结束时间" value={form.end} error={errors.end} onChange={(value) => onDateChange('end', value)} />
      <SelectCell label="请假去向" value={form.destination} required error={errors.destination} onClick={() => onOpenSelect('destination')} />
      <FieldCell id="address" label="请假去向(具体地址)" required error={errors.address}>
        <input id="address" value={form.address} onChange={(event) => onChange('address', event.target.value)} placeholder="请输入请假去向(具体地址)" />
      </FieldCell>
      <SelectCell label="是否在校外过夜" value={form.overnight} required error={errors.overnight} onClick={() => onOpenSelect('overnight')} />
      <button className="submit-button" type="submit">提交</button>
      <p className="local-note">此按钮仅保存到当前浏览器，不会提交到学校系统。</p>
      {activeSelect && (
        <SelectSheet
          field={activeSelect}
          selected={form[activeSelect]}
          onSelect={onSelect}
          onClose={onCloseSelect}
        />
      )}
    </form>
  )
}

function FieldCell({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className={`form-cell field-cell ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}{required && <span className="required">*</span>}</label>
      {children}
      {error && <small className="field-error">{error}</small>}
    </div>
  )
}

function DateCell({
  label,
  value,
  error,
  onChange,
}: {
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <div className={`form-cell field-cell ${error ? 'has-error' : ''}`}>
      <label>{label}<span className="required">*</span></label>
      <input type="datetime-local" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} />
      {error && <small className="field-error">{error}</small>}
    </div>
  )
}

function SelectCell({
  label,
  value,
  required,
  error,
  onClick,
}: {
  label: string
  value: string
  required?: boolean
  error?: string
  onClick: () => void
}) {
  return (
    <div className={`form-cell select-cell ${error ? 'has-error' : ''}`}>
      <button type="button" onClick={onClick} aria-label={`${label}${value ? `，当前为${value}` : ''}`}>
        <span>{label}{required && <span className="required">*</span>}</span>
        <span className={`select-value ${value ? 'selected' : ''}`}>
          {value || '请选择'}
          <ChevronRight aria-hidden="true" size={21} strokeWidth={1.6} />
        </span>
      </button>
      {error && <small className="field-error">{error}</small>}
    </div>
  )
}

function SelectSheet({
  field,
  selected,
  onSelect,
  onClose,
}: {
  field: SelectField
  selected: string
  onSelect: (field: SelectField, value: string) => void
  onClose: () => void
}) {
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="select-sheet" role="dialog" aria-modal="true" aria-label={`选择${labels[field]}`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-head">
          <strong>{labels[field]}</strong>
          <button type="button" onClick={onClose} aria-label="关闭">×</button>
        </div>
        {options[field].map((option) => (
          <button
            className={`sheet-option ${option === selected ? 'active' : ''}`}
            type="button"
            key={option}
            onClick={() => onSelect(field, option)}
          >
            {option}{option === selected && <span>✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export default App
