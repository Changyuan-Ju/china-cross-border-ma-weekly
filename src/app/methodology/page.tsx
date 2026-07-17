export default function MethodologyPage() {
  const sections = [
    ["纳入标准", "正式纳入的交易原则上须同时满足以下条件：（1）中资企业为交易一方，或交易完成后将直接或通过其控制的境内外主体取得、出售或调整相关权益；（2）交易具有实质跨境属性，即交易对手、标的公司、核心经营资产或主要业务所在地至少一项位于中国大陆以外，香港、澳门和台湾地区按境外处理；（3）交易属于股权、资产或业务的收购、出售、合并、分立、私有化、控制权转让，或具有明确产业整合目的的少数股权交易，而非单纯融资或财务投资；（4）已有可核验披露证明交易进入实质阶段，例如签署具有约束力的协议、取得董事会或股东大会批准、发出正式要约、完成交割，或就既有交易披露重要进展。系统对候选作出纳入或排除的二元判定，不设置待复核状态。"],
    ["排除标准", "纯融资、战略合作、非约束性意向、境内集团内部重组、少数财务投资、仅因存在离岸 SPV 的交易不会自动纳入。无法确认中资主体、实质跨境属性、标的经营实质或约束性交易阶段的候选，按证据门槛不足自动排除并保留具体原因。"],
    ["排序方法", "周报优先采用人工置顶字段，其次按交易规模、控制权变化、公告披露的重要性分类、标的经营实质、交易进展和信息完整度形成的确定性评分排序。评分只用于页面排序，不代表投资价值、交易质量或成功概率。"],
    ["事件与时间线", "同一交易的首次公告、签约、审批、融资条件、延期、条款调整、交割、退市和终止等新节点使用同一个 Deal，并持续更新原详情页、最新状态和交易时间线。只有来源、日期、阶段及事实均未增加的重复报道才会去重；同一交易在不同周出现新的实质进展时，会再次进入当周周报，但不会另建交易页面。"],
    ["数据来源", "本数据库综合使用上市公司公告、交易双方披露、证券交易所文件及其他可核验公开资料。Wind 等金融数据库主要用于发现交易线索和检索公告，最终交易事实、阶段和关键条款以可追溯的底层披露为依据；可取得的来源链接会保留在交易页面。资料经自动化结构化整理、事件匹配、去重和证据校验后，通过受保护接口写入网站；公开部署服务不保存第三方数据平台凭证。"],
    ["免责声明", "本网站内容仅用于交易信息整理，不构成投资建议、法律意见或交易确定性判断。"]
  ];
  return (
    <div className="shell py-8">
      <div className="text-xs font-bold tracking-[0.18em] text-gold">METHODOLOGY</div>
      <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">方法说明</h1>
      <p className="measure mt-4 text-base leading-8 text-muted">本页说明跨境并购公告的纳入、排除、排序和来源处理原则。规则用于保持周报口径稳定，不改变任何单笔交易事实。</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2 border-l-2 border-gold pl-4 text-sm text-muted">
            {sections.map(([title]) => <a key={title} className="block hover:text-ink" href={`#${title}`}>{title}</a>)}
          </nav>
        </aside>
        <div className="space-y-7 text-sm leading-8 text-muted">
          {sections.map(([title, body]) => (
            <section key={title} id={title} className="border-b border-line pb-6">
              <h2 className="text-xl font-semibold text-ink">{title}</h2>
              <p className="mt-2">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
