# 本地学生请假网页复刻

这是一个移动端优先的 React + TypeScript + Vite 网站，用于本地模拟学生请假记录和新建请假流程。

## 运行

```powershell
npm install
npm run dev
```

浏览器打开终端显示的本地地址即可。默认开发地址为 `http://127.0.0.1:4173/`（若未指定端口则以 Vite 输出为准）。

## 功能

- 查看脱敏的本地请假记录
- 点击右下角 `+` 新建请假
- 使用本地选择弹层填写分类字段
- 校验必填项、手机号和结束时间
- 将模拟记录保存在浏览器 `localStorage`
- 选择证明材料时只记录本地文件名，不上传文件

`提交` 仅更新当前浏览器中的本地模拟数据，不会连接或修改学校系统。`清空` 会先弹出确认框，再删除当前浏览器中的本地模拟记录。

## 检查

```powershell
npm run lint
npm run build
npm run test:e2e
```

视觉参数、范围和验收标准见 `docs/superpowers/specs/2026-10-19-leave-local-design.md`。
