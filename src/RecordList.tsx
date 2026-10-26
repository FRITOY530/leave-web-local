import './RecordList.css'

type ListRecord = {
  id: string
  type: string
  status: string
  start: string
  end: string
  days: number
}

type RecordListProps<T extends ListRecord> = {
  records: T[]
  message: string
  onCreate: () => void
  onOpenDetail: (record: T) => void
}

export default function RecordList<T extends ListRecord>({
  records,
  message,
  onCreate,
  onOpenDetail,
}: RecordListProps<T>) {
  return (
    <section className="reference-records" aria-label="请假记录">
      {message && <div className="toast-message" role="status">{message}</div>}
      <div className="reference-record-list">
        {records.map((record) => (
          <div className="reference-record-entry" key={record.id}>
            <button
              className="reference-record-card"
              type="button"
              onClick={() => onOpenDetail(record)}
              aria-label={`查看${record.type}详情，${record.start.slice(0, 10)}，${record.status}`}
            >
              <div className="reference-record-heading">
                <div className="reference-record-half">
                  <span className="reference-record-type">{record.type}</span>
                </div>
                <div className="reference-record-half">
                  <span className="reference-record-status">{record.status}</span>
                  <span className="reference-record-dot" aria-hidden="true" />
                </div>
              </div>
              <div className="reference-record-dates">
                {record.start.slice(0, 10)} 至 {record.end.slice(0, 10)} / 共{record.days}天
              </div>
            </button>
            <div className="reference-record-divider" />
          </div>
        ))}
      </div>
      {records.length === 0 && <div className="reference-record-empty">暂无请假记录</div>}
      <div className="reference-record-end">没有更多啦~</div>
      <button className="reference-record-add" type="button" onClick={onCreate} aria-label="新建请假">
        <span className="reference-record-plus" aria-hidden="true" />
      </button>
    </section>
  )
}
