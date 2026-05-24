const insights = [
  ["业务目标", "自动化订单履约确认，缩短运营处理时长"],
  ["用户流程", "支付校验、库存锁定、生成拣货、异常转人工"],
  ["数据实体", "订单、库存快照、履约单、拣货任务、异常记录"],
  ["依赖模块", "order-service、inventory-api、web-admin、消息队列"],
];

const steps = [
  ["需求结构化", "抽取目标、角色、流程、约束和验收条件"],
  ["技术方案", "识别服务边界、灰度策略和高峰 QPS 风险"],
  ["数据/API", "生成表结构、接口契约和事件模型"],
  ["代码骨架", "输出前后端模块、DTO、Service 与页面入口"],
  ["测试报告", "生成单测、接口测试和评审清单"],
];

const agents = [
  {
    name: "产品理解 Agent",
    icon: "P",
    color: "#0d9488",
    state: "Clarifying",
    tasks: ["识别模糊字段与隐藏约束", "生成需求澄清问题", "沉淀用户流程与验收口径"],
  },
  {
    name: "架构 Agent",
    icon: "A",
    color: "#2563eb",
    state: "Designing",
    tasks: ["输出服务边界与时序方案", "评估现有模块复用点", "给出灰度、回滚和监控策略"],
  },
  {
    name: "编码 Agent",
    icon: "C",
    color: "#7c3aed",
    state: "Generating",
    tasks: ["生成 Controller、Service、DTO", "创建前端页面与状态流", "补齐接口 Mock 与样板代码"],
  },
  {
    name: "测试 Agent",
    icon: "T",
    color: "#f59e0b",
    state: "Validating",
    tasks: ["生成单元测试和接口测试", "覆盖异常路径和幂等逻辑", "输出可评审测试报告"],
  },
];

const artifacts = {
  design: {
    title: "技术设计文档",
    content: `# 订单履约自动化技术方案

## 目标
- 将支付后人工确认节点改为规则驱动自动确认
- 异常订单保留人工处理池，保证运营可追踪
- 兼容现有 order-service，支持灰度发布与快速回滚

## 核心链路
1. 订单支付成功后发布 OrderPaid 事件
2. fulfillment-service 拉取库存快照并校验可履约状态
3. 规则命中后创建 FulfillmentOrder 与 PickTask
4. 异常订单写入 ExceptionQueue，推送 web-admin 处理

## 风险
- 库存接口峰值 QPS 800，需要缓存和熔断
- 重复支付回调需要幂等键
- 灰度期间新旧链路数据需对齐`,
  },
  api: {
    title: "API 设计",
    content: `POST /api/fulfillment/orders/confirm
Request:
{
  "orderId": "O202605240001",
  "operator": "system",
  "idempotencyKey": "order-paid-O202605240001"
}

Response:
{
  "fulfillmentId": "F202605240001",
  "status": "PICKING_CREATED",
  "exceptionCode": null
}

GET /api/fulfillment/exceptions?status=PENDING
PATCH /api/fulfillment/exceptions/{id}/resolve`,
  },
  db: {
    title: "数据库表设计",
    content: `CREATE TABLE fulfillment_order (
  id BIGINT PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL,
  inventory_snapshot_id VARCHAR(64) NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE fulfillment_exception (
  id BIGINT PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  reason_code VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  status VARCHAR(32) NOT NULL,
  owner VARCHAR(64),
  created_at DATETIME NOT NULL
);`,
  },
  code: {
    title: "代码骨架",
    content: `src/
  modules/
    fulfillment/
      api.ts
      types.ts
      FulfillmentDashboard.tsx
      ExceptionQueue.tsx
      useFulfillmentFlow.ts

export async function confirmFulfillment(input: ConfirmInput) {
  return http.post<ConfirmResult>("/api/fulfillment/orders/confirm", input);
}

export function useFulfillmentFlow(orderId: string) {
  // query order context, submit confirmation, refresh exception queue
}`,
  },
  test: {
    title: "测试报告",
    content: `测试覆盖建议

[Unit]
- confirmFulfillment 命中库存充足时创建履约单
- 重复 idempotencyKey 返回同一履约结果
- 库存不足时写入异常池

[API]
- POST /confirm 正常链路 200
- POST /confirm 重复请求 200 且结果一致
- GET /exceptions 支持状态筛选

当前生成用例：28
高优先级风险覆盖：4 / 4`,
  },
};

const risks = [
  ["高", "库存接口峰值 QPS 800，建议增加本地短缓存和降级策略", "架构 Agent"],
  ["中", "订单支付回调可能重复触发，需要全链路幂等键", "测试 Agent"],
  ["中", "灰度期间新旧履约状态需双写比对", "架构 Agent"],
  ["低", "异常原因码需与运营后台枚举保持一致", "产品理解 Agent"],
];

const prdSample = `目标：建设商家退款自动审核能力，降低人工审核成本。
用户：商家客服、财务审核员、消费者。
流程：消费者提交退款，系统校验订单状态、售后规则和支付渠道，低风险退款自动通过，高风险退款进入审核池。
约束：需兼容 payment-service，自动审核结果必须可追溯，支持按商家灰度。
交付：需求拆解、技术方案、接口设计、表结构、前端审核台、测试用例。`;

const views = document.querySelectorAll(".view");
const navItems = document.querySelectorAll(".nav-item");
const timeline = document.querySelector("#timeline");
const insightList = document.querySelector("#insights");
const agentGrid = document.querySelector("#agentGrid");
const riskTable = document.querySelector("#riskTable");
const artifactTitle = document.querySelector("#artifactTitle");
const artifactContent = document.querySelector("#artifactContent");
const workflowState = document.querySelector("#workflowState");
const structuredScore = document.querySelector("#structuredScore");
const riskCount = document.querySelector("#riskCount");

function renderInsights() {
  insightList.innerHTML = insights
    .map(([label, text]) => `<div class="insight"><strong>${label}</strong><span>${text}</span></div>`)
    .join("");
}

function renderTimeline(activeIndex = -1) {
  timeline.innerHTML = steps
    .map(([title, text], index) => {
      const className = index < activeIndex ? "done" : index === activeIndex ? "running" : "";
      const marker = index < activeIndex ? "✓" : index + 1;
      return `<article class="step ${className}">
        <div class="step-index">${marker}</div>
        <h3>${title}</h3>
        <p>${text}</p>
      </article>`;
    })
    .join("");
}

function renderAgents() {
  agentGrid.innerHTML = agents
    .map(
      (agent) => `<article class="panel agent-card">
        <div class="agent-icon" style="background:${agent.color}">${agent.icon}</div>
        <h2>${agent.name}</h2>
        <ul>${agent.tasks.map((task) => `<li>${task}</li>`).join("")}</ul>
        <div class="agent-footer"><span>${agent.state}</span><strong>在线</strong></div>
      </article>`,
    )
    .join("");
}

function renderRisks() {
  riskTable.innerHTML = risks
    .map(([level, text, owner]) => `<div class="risk-row"><span>${level}风险</span><p>${text}</p><span>${owner}</span></div>`)
    .join("");
}

function setView(viewId) {
  views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
}

function setArtifact(key) {
  const artifact = artifacts[key];
  artifactTitle.textContent = artifact.title;
  artifactContent.textContent = artifact.content;
  document.querySelectorAll(".artifact-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.artifact === key);
  });
}

function runAgentFlow() {
  let current = 0;
  workflowState.textContent = "Running";
  renderTimeline(current);
  structuredScore.textContent = "61%";
  riskCount.textContent = "6";

  const timer = setInterval(() => {
    current += 1;
    renderTimeline(current);
    structuredScore.textContent = `${Math.min(96, 61 + current * 7)}%`;
    riskCount.textContent = `${Math.max(2, 6 - current)}`;

    if (current > steps.length) {
      clearInterval(timer);
      workflowState.textContent = "Review Ready";
      structuredScore.textContent = "96%";
      riskCount.textContent = "2";
      setView("artifacts");
    }
  }, 650);
}

navItems.forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
document.querySelectorAll(".artifact-tab").forEach((tab) => tab.addEventListener("click", () => setArtifact(tab.dataset.artifact)));
document.querySelector("#runAgent").addEventListener("click", runAgentFlow);
document.querySelector("#loadSample").addEventListener("click", () => {
  document.querySelector("#prdInput").value = prdSample;
});
document.querySelector("#themeToggle").addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
});

renderInsights();
renderTimeline();
renderAgents();
renderRisks();
setArtifact("design");
