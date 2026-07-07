export default function MethodologyPage() {
  const sections = [
    ["纳入标准", "本数据库关注交易主体、标的资产、核心经营业务或控制权变动涉及中国大陆与境外司法辖区的股权、资产、业务收购、出售、合并、分立及控制权交易。香港、澳门、台湾地区视为境外。"],
    ["排除标准", "纯融资、战略合作、非约束性意向、境内集团内部重组、少数财务投资、仅因存在离岸 SPV 的交易不会自动纳入。无法确认跨境属性或标的实质的记录进入复核队列。"],
    ["排序方法", "周报优先采用人工置顶字段，其次按交易规模、控制权变化、公告披露的重要性分类、标的经营实质、交易进展和信息完整度形成的确定性评分排序。评分只用于页面排序，不代表投资价值、交易质量或成功概率。"],
    ["数据来源", "采集端优先通过本地 Wind 环境检索公告和公司资料，生成结构化 JSON 后经受保护 API 推送至网站。Wind 凭证仅保留在本地采集环境，不进入公开部署服务。"],
    ["免责声明", "本网站内容仅用于交易信息整理和人工复核辅助，不构成投资建议、法律意见或交易确定性判断。"]
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
