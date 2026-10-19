import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { ArrowLeft, Camera, ChevronRight, ClipboardList, FileText, Plus } from 'lucide-react'
import './App.css'

type Page = 'records' | 'form' | 'detail'
type SelectField = 'nature' | 'type' | 'destination' | 'overnight'
type DateField = 'start' | 'end'

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
const initialRecords: LeaveRecord[] = [
  {
    id: 'sample-1',
    applicationNumber: 'SQ202610090001',
    nature: '事假',
    type: '因私',
    reason: '个人事务',
    start: '2026-10-09T08:00',
    end: '2026-10-09T18:00',
    days: 1,
    destination: '校外',
    address: '校外实习单位',
    overnight: '否',
    phone: '138****0000',
    proofName: '',
    submittedAt: '2026-10-08T16:30',
    status: '已销假',
  },
]

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
  nature: ['事假', '病假', '公假'],
  type: ['因私', '其他'],
  destination: ['校内', '校外'],
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
    return Array.isArray(parsed) ? parsed : initialRecords
  } catch {
    return initialRecords
  }
}

function saveRecords(records: LeaveRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function formatDate(value: string) {
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
    return { page: 'detail', recordId: decodeURIComponent(hash.slice('#/detail/'.length)) }
  }
  return { page: 'records', recordId: null }
}

function createApplicationNumber() {
  return `SQ${new Date().toISOString().slice(0, 10).replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase()}`
}

function calculateDays(start: string, end: string) {
  if (!start || !end) return 0
  const diff = new Date(end).getTime() - new Date(start).getTime()
  if (diff <= 0) return 0
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)))
}

function App() {
  const initialRoute = getRoute()
  const [page, setPage] = useState<Page>(initialRoute.page)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(initialRoute.recordId)
  const [records, setRecords] = useState<LeaveRecord[]>(readRecords)
  const [form, setForm] = useState<LeaveForm>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveForm, string>>>({})
  const [activeSelect, setActiveSelect] = useState<SelectField | null>(null)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    const nextHash = page === 'form'
      ? '#/new'
      : page === 'detail' && selectedRecordId
        ? `#/detail/${encodeURIComponent(selectedRecordId)}`
        : '#/records'
    window.history.replaceState(null, '', nextHash)
  }, [page, selectedRecordId])

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
    setSelectedRecordId(record.id)
    setPage('detail')
  }

  const closeDetail = () => {
    setSelectedRecordId(null)
    setPage('records')
  }

  const openForm = () => {
    setSavedMessage('')
    setErrors({})
    setForm(initialForm)
    setPage('form')
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
    const record: LeaveRecord = {
      id: crypto.randomUUID(),
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
      submittedAt: new Date().toISOString().slice(0, 16),
      status: '审核中',
    }
    const next = [record, ...records]
    saveRecords(next)
    setRecords(next)
    setSavedMessage('本地模拟记录已保存')
    setPage('records')
  }

  const clearRecords = () => {
    if (!window.confirm('确定清空当前浏览器中的本地模拟记录吗？')) return
    saveRecords([])
    setRecords([])
    setSavedMessage('')
  }

  return (
    <main className="app-shell">
      {page === 'records' ? (
        <RecordList records={records} message={savedMessage} onCreate={openForm} onClear={clearRecords} onOpenDetail={openDetail} />
      ) : page === 'detail' ? (
        <LeaveDetail
          record={records.find((record) => record.id === selectedRecordId || record.applicationNumber === selectedRecordId)}
          onBack={closeDetail}
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
    </main>
  )
}

function RecordList({
  records,
  message,
  onCreate,
  onClear,
  onOpenDetail,
}: {
  records: LeaveRecord[]
  message: string
  onCreate: () => void
  onClear: () => void
  onOpenDetail: (record: LeaveRecord) => void
}) {
  return (
    <section className="records-page">
      <div className="page-intro">
        <span className="intro-label">事假</span>
        <div className="intro-meta">
          <span className="intro-count">共 {records.length} 条记录</span>
          {records.length > 0 && <button className="clear-button" onClick={onClear}>清空</button>}
        </div>
      </div>
      {message && <div className="toast-message" role="status">{message}</div>}
      {records.length === 0 ? (
        <div className="empty-state">
          <ClipboardList aria-hidden="true" size={48} strokeWidth={1.5} />
          <p>暂无请假记录</p>
          <span>点击右下角“+”创建本地模拟记录</span>
        </div>
      ) : (
        <div className="record-list">
          {records.map((record) => (
            <button className="record-card record-open" type="button" key={record.id} onClick={() => onOpenDetail(record)} aria-label={`查看${record.nature}详情`}>
              <div className="record-card-head">
                <strong>{record.nature}</strong>
                <span className="status-badge">{record.status}</span>
              </div>
              <div className="record-row"><span>请假类型</span><b>{record.type}</b></div>
              <div className="record-row"><span>请假时间</span><b>{formatDate(record.start)} - {formatDate(record.end)}</b></div>
              <div className="record-row"><span>请假天数</span><b>{record.days} 天</b></div>
              <div className="record-row"><span>请假事由</span><b>{record.reason}</b></div>
              <div className="record-detail-link">查看详细数据 <ChevronRight aria-hidden="true" size={16} /></div>
            </button>
          ))}
          <div className="no-more">没有更多啦</div>
        </div>
      )}
      <button className="floating-add" onClick={onCreate} aria-label="新建请假">
        <Plus aria-hidden="true" size={32} strokeWidth={1.8} />
      </button>
    </section>
  )
}

function LeaveDetail({ record, onBack }: { record?: LeaveRecord; onBack: () => void }) {
  if (!record) {
    return (
      <section className="detail-page">
        <DetailNav onBack={onBack} />
        <div className="empty-state">
          <ClipboardList aria-hidden="true" size={48} strokeWidth={1.5} />
          <p>未找到请假详情</p>
          <span>该记录可能已经被清空</span>
        </div>
      </section>
    )
  }

  return (
    <section className="detail-page">
      <DetailNav onBack={onBack} />
      <div className="detail-status-card">
        <span>当前状态</span>
        <strong>{record.status}</strong>
        <small>申请编号：{record.applicationNumber}</small>
      </div>
      <DetailSection title="申请信息">
        <DetailRow label="申请编号" value={record.applicationNumber} />
        <DetailRow label="提交时间" value={formatDate(record.submittedAt)} />
        <DetailRow label="手机号" value={record.phone || '未填写'} />
        <DetailRow label="证明材料" value={record.proofName || '未上传'} />
      </DetailSection>
      <DetailSection title="请假信息">
        <DetailRow label="请假性质" value={record.nature} />
        <DetailRow label="请假类型" value={record.type} />
        <DetailRow label="请假天数" value={`${record.days} 天`} />
        <DetailRow label="开始时间" value={formatDate(record.start)} />
        <DetailRow label="结束时间" value={formatDate(record.end)} />
        <DetailRow label="请假去向" value={record.destination} />
        <DetailRow label="具体地址" value={record.address || '未填写'} />
        <DetailRow label="校外过夜" value={record.overnight || '未填写'} />
        <DetailRow label="请假事由" value={record.reason} multiline />
      </DetailSection>
      <DetailSection title="审核信息">
        <DetailRow label="审核状态" value={record.status} />
        <div className="detail-audit-note">
          <FileText aria-hidden="true" size={19} />
          <span>申请已保存在当前浏览器，模拟状态为“{record.status}”。</span>
        </div>
      </DetailSection>
    </section>
  )
}

function DetailNav({ onBack }: { onBack: () => void }) {
  return (
    <div className="detail-nav">
      <button type="button" onClick={onBack} aria-label="返回请假记录">
        <ArrowLeft aria-hidden="true" size={23} />
      </button>
      <strong>请假详情</strong>
      <span />
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="detail-section">
      <div className="detail-section-title">{title}</div>
      <div className="detail-section-body">{children}</div>
    </section>
  )
}

function DetailRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={`detail-row ${multiline ? 'multiline' : ''}`}>
      <span>{label}</span>
      <b>{value}</b>
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
      <FieldCell id="address" label="请假去向（具体地址）" required error={errors.address}>
        <input id="address" value={form.address} onChange={(event) => onChange('address', event.target.value)} placeholder="请输入请假去向（具体地址）" />
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




