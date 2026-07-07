export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-semibold text-ink">方法说明</h1>
      <div className="mt-6 space-y-6 text-sm leading-8 text-muted">
        <section className="border border-line bg-white p-5">
          <h2 className="text-xl font-semibold text-ink">纳入标准</h2>
          <p className="mt-2">本数据库关注交易主体、标的资产、核心经营业务或控制权变动涉及中国大陆与境外司法辖区的股权、资产、业务收购、出售、合并、分立及控制权交易。香港、澳门、台湾地区视为境外。</p>
        </section>
        <section className="border border-line bg-white p-5">
          <h2 className="text-xl font-semibold text-ink">排除标准</h2>
          <p className="mt-2">纯融资、战略合作、非约束性意向、境内集团内部重组、少数财务投资、仅因存在离岸 SPV 的交易不会自动纳入。无法确认跨境属性或标的实质的记录进入复核队列。</p>
        </section>
        <section className="border border-line bg-white p-5">
          <h2 className="text-xl font-semibold text-ink">排序方法</h2>
          <p className="mt-2">周报优先采用人工置顶字段，其次按交易规模、控制权变化、公告披露的重要性分类、标的经营实质、交易进展和信息完整度形成的确定性评分排序。评分只用于页面排序，不代表投资价值、交易质量或成功概率。</p>
        </section>
        <section className="border border-line bg-white p-5">
          <h2 className="text-xl font-semibold text-ink">数据来源</h2>
          <p className="mt-2">采集端优先通过本地 Wind 环境检索公告和公司资料，生成结构化 JSON 后经受保护 API 推送至网站。Wind 凭证仅保留在本地采集环境，不进入公开部署服务。</p>
        </section>
      </div>
    </div>
  );
}
